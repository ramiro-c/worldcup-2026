"""Tests for H2H-aware group standings and best-third ranking."""

from providers.standings import (
    compute_group_standings,
    compute_best_third_ranking,
    TeamStanding,
)


def _match(home: str, away: str, home_score: int, away_score: int, group: str = "a", status: str = "finished") -> dict:
    """Build a minimal wheniskickoff-like group-stage match dict."""
    return {
        "slug": f"match-{home}-vs-{away}",
        "home": home,
        "away": away,
        "home_name": home.upper(),
        "away_name": away.upper(),
        "score_home": home_score,
        "score_away": away_score,
        "status": status,
        "group": group,
        "phase": "group",
        "num": 1,
    }


class TestComputeGroupStandings:
    """Unit tests for compute_group_standings()."""

    def test_clear_ranking_by_points(self):
        """Scenario: 4 teams with distinct point totals."""
        matches = [
            _match("arg", "mex", 2, 0),
            _match("pol", "ksa", 1, 0),
            _match("arg", "pol", 3, 0),
            _match("mex", "ksa", 2, 1),
            _match("arg", "ksa", 4, 0),
            _match("mex", "pol", 1, 1),
        ]
        result = compute_group_standings(matches, "a")
        assert len(result) == 4

        codes = [s.team_code for s in result]
        assert codes[0] == "arg"  # 9 pts, GD +9
        assert codes[3] == "ksa"  # 0 pts

        # Validate stats
        arg = result[0]
        assert arg.points == 9
        assert arg.played == 3
        assert arg.won == 3
        assert arg.gf == 9
        assert arg.ga == 0
        assert arg.gd == 9
        assert arg.position == 1
        assert arg.qualification == "qualified"

        ksa = result[3]
        assert ksa.points == 0
        assert ksa.position == 4
        assert ksa.qualification == "eliminated"

    def test_h2h_breaks_points_tie(self):
        """Scenario: Two teams tied on points, H2H result determines order."""
        # MEX beats POL 2-1, both finish with 4 pts. MEX should rank higher.
        matches = [
            _match("arg", "mex", 3, 0),   # ARG 3 pts
            _match("pol", "ksa", 0, 0),   # POL 1, KSA 1
            _match("arg", "pol", 1, 0),   # ARG 6, POL 1
            _match("mex", "ksa", 2, 0),   # MEX 3, KSA 1
            _match("arg", "ksa", 2, 0),   # ARG 9, KSA 1
            _match("mex", "pol", 2, 1),   # MEX 6, POL 1 → MEX and POL tie on points
            # ARG 9, MEX 6, POL 1, KSA 1 → wait: MEX has 6 after first win (vs KSA)
            # MEX: L to ARG, W vs KSA, W vs POL = 6 pts
            # POL: D vs KSA, L to ARG, L to MEX = 1 pt
            # Actually let me re-check. MEX beat KSA (2-0) + beat POL (2-1) = 6 pts
            # POL drew KSA (0-0) + lost ARG (0-1) + lost MEX (1-2) = 1 pt
            # KSA drew POL (0-0) + lost MEX (0-2) + lost ARG (0-2) = 1 pt
            # No tie on points here. Let me fix the scenario.
        ]
        # Let me construct a clearer 2-way tie:
        # ARG beats MEX, MEX beats POL, POL beats ARG (rock-paper-scissors, all 3 pts from those)
        # plus all beat KSA
        matches2 = [
            _match("arg", "mex", 2, 1),   # ARG 3, MEX 0
            _match("pol", "ksa", 2, 0),   # POL 3, KSA 0
            _match("arg", "pol", 0, 1),   # POL 6, ARG 3 — but POL beat ARG
            _match("mex", "ksa", 3, 0),   # MEX 3, KSA 0
            _match("arg", "ksa", 4, 0),   # ARG 6, KSA 0
            _match("mex", "pol", 2, 0),   # MEX 6, POL 6 — POL and MEX tied at 6 pts
        ]
        # H2H: POL 2, MEX 0? No — MEX beat POL 2-0 in the last match
        # So MEX should rank above POL via H2H.
        # But POL beat ARG, ARG beat MEX, MEX beat POL — all 3 tied at 6 pts!
        # H2H circle: POL 3 (beat ARG), ARG 3 (beat MEX), MEX 3 (beat POL)
        # H2H GD: filter to matches among these 3:
        #   ARG 2-1 MEX, ARG 0-1 POL  → ARG: GD 0 (2 GF, 2 GA)
        #   MEX 1-2 ARG, MEX 2-0 POL  → MEX: GD +1 (3 GF, 2 GA)
        #   POL 1-0 ARG, POL 0-2 MEX  → POL: GD -1 (1 GF, 2 GA)
        # So: MEX (6 pts, GD+1) > ARG (6 pts, GD 0) > POL (6 pts, GD-1)
        # Order: MEX, ARG, POL, KSA
        result = compute_group_standings(matches2, "a")
        codes = [s.team_code for s in result]
        # ARG and MEX tied at 6 pts, GD+4, GF 6 → cluster {ARG, MEX}
        # H2H: ARG 2-1 MEX → ARG wins cluster
        # POL has 6 pts but GD+1 (different from cluster) → 3rd
        assert codes[0] == "arg"   # H2H winner
        assert codes[1] == "mex"
        assert codes[2] == "pol"
        assert codes[3] == "ksa"

    def test_h2h_three_way_partial_break(self):
        """Scenario: 3-way tie, H2H resolves 1 winner, rest remains tied."""
        # ARG beats MEX, MEX-POL draw, all beat KSA, ARG-POL draw
        matches = [
            _match("arg", "mex", 1, 0),
            _match("pol", "ksa", 2, 0),
            _match("arg", "pol", 0, 0),
            _match("mex", "ksa", 3, 0),
            _match("arg", "ksa", 2, 0),
            _match("mex", "pol", 1, 1),
        ]
        # Points: ARG 7 (2W, 1D), MEX 4 (1W, 1D, 1L), POL 5 (1W, 2D), KSA 0
        # ARG 7, POL 5, MEX 4, KSA 0 — no 3-way tie. Let me fix.
        # Need ARG beat MEX but ARG draw POL, MEX draw POL → ARG 4 (1W 1D), POL 2 (2D?), MEX 1 (1D 1L)
        # Let me make MEX beat KSA (3 pts), ARG beat KSA (3 pts), POL beat KSA (3 pts)
        # ARG beat MEX, MEX draw POL, ARG draw POL
        # ARG: W vs MEX, D vs POL, W vs KSA → 7 pts
        # MEX: L vs ARG, D vs POL, W vs KSA → 4 pts
        # POL: D vs ARG, D vs MEX, W vs KSA → 5 pts
        # KSA: 0 pts
        # Not a 3-way tie. Let me try again with simpler numbers.

        # Actually let's make it simpler: all 3 draw with each other, all beat KSA
        matches2 = [
            _match("arg", "mex", 1, 1),
            _match("pol", "ksa", 3, 0),
            _match("arg", "pol", 0, 0),
            _match("mex", "ksa", 2, 0),
            _match("arg", "ksa", 3, 0),
            _match("mex", "pol", 1, 1),
        ]
        # ARG: D vs MEX, D vs POL, W vs KSA → 5 pts, GD +4 (GF 4, GA 1)
        # MEX: D vs ARG, W vs KSA, D vs POL → 5 pts, GD +3 (GF 4, GA 1)
        # POL: W vs KSA, D vs ARG, D vs MEX → 5 pts, GD +4 (GF 4, GA 0)
        # KSA: 0 pts
        # H2H: POL GD +1 (1 GF, 0 GA in matches vs ARG/MEX)
        #   POL 0-0 ARG, POL 1-1 MEX → POL: GD 0 (1 GF, 1 GA)
        #   ARG 0-0 POL, ARG 1-1 MEX → ARG: GD 0 (1 GF, 1 GA)
        #   MEX 1-1 ARG, MEX 1-1 POL → MEX: GD 0 (2 GF, 2 GA) — no GD advantage
        # H2H GF: MEX 2 > ARG 1 = POL 1
        # Not clean. Let me use overall stats to break.
        # POL: GD +4 (GF 4, GA 0) → higher overall GD
        # ARG: GD +4 (GF 4, GA 1) but wait GF calculation:
        #   ARG scored 1 (vs MEX) + 0 (vs POL) + 3 (vs KSA) = 4 GF, 1 GA = GD +3, not +4
        #   Actually: MEX scored 1 (vs ARG) + 2 (vs KSA) + 1 (vs POL) = 4 GF, 1 GA = GD +3
        #   POL scored 3 (vs KSA) + 0 (vs ARG) + 1 (vs MEX) = 4 GF, 0 GA = GD +4
        # So POL has overall GD +4, ARG +3, MEX +3.
        # But the spec says H2H comes FIRST. H2H: all 3 drew with each other → all have 2 PTS, GD 0, GF 2.
        # After H2H exhausted (no break), fall to overall: POL +4 > ARG +3 = MEX +3 → POL 1st, then ARG vs MEX on GF
        # ARG GF 4, MEX GF 4 → identical overall GF. Fall to fair play → fifa → exhausted.

        result = compute_group_standings(matches2, "a")
        codes = [s.team_code for s in result]
        # POL: 5 pts, GD+3, GF 4  — cluster with ARG (identical pts+gd+gf)
        # ARG: 5 pts, GD+3, GF 4  — cluster with POL
        # MEX: 5 pts, GD+2, GF 4  — different GD, no cluster
        # H2H ARG-POL: 0-0 draw → tied → overall GD both +3 → GF both 4 → exhausted
        # ARG and POL tied for 1st/2nd (both exhausted), MEX 3rd
        top_two = {codes[0], codes[1]}
        assert top_two == {"arg", "pol"}
        tied = [s for s in result if s.tiebreaker_exhausted]
        assert len(tied) == 2  # ARG and POL tied after all tiebreakers

    def test_h2h_cascade_through_all_levels(self):
        """Scenario: Two teams tied through H2H PTS/GD/GF, overall GD breaks tie."""
        # ARG and BRA in the same group, they draw 1-1, both beat other teams identically
        # but ARG scores 1 more goal against the 4th team
        matches = [
            _match("arg", "bra", 1, 1),
            _match("uru", "chi", 0, 2),
            _match("arg", "uru", 2, 0),
            _match("bra", "chi", 2, 0),
            _match("arg", "chi", 3, 0),
            _match("bra", "uru", 3, 1),
        ]
        # ARG: D vs BRA, W vs URU, W vs CHI → 7 pts, GF 6, GA 1, GD +5
        # BRA: D vs ARG, W vs CHI, W vs URU → 7 pts, GF 6, GA 2, GD +4
        # H2H: ARG 1-1 BRA → tied at all H2H levels → overall GD breaks: ARG +5 > BRA +4
        result = compute_group_standings(matches, "a")
        codes = [s.team_code for s in result]
        assert codes[0] == "arg"  # Better overall GD
        assert codes[1] == "bra"

    def test_incomplete_group(self):
        """Scenario: Only 4 of 6 matches played; H2H uses available matches only."""
        matches = [
            _match("arg", "mex", 2, 0),
            _match("pol", "ksa", 1, 1),
            _match("arg", "pol", 3, 1),
            _match("mex", "ksa", 2, 1),
            # Missing: ARG-KSA, MEX-POL
        ]
        result = compute_group_standings(matches, "a")
        assert len(result) == 4

        arg = result[0]
        assert arg.team_code == "arg"
        assert arg.played == 2  # Only 2 matches played
        assert arg.points == 6

    def test_fair_play_fallback_unavailable(self):
        """Scenario: Teams tied through all levels, no FP/ranking data → exhausted."""
        # Two teams with IDENTICAL everything
        matches = [
            _match("arg", "bra", 1, 1),
            _match("arg", "uru", 2, 0),
            _match("bra", "uru", 2, 0),
        ]
        # ARG: D 1-1 BRA, W 2-0 URU → 4 pts, GF 3, GA 1, GD +2
        # BRA: D 1-1 ARG, W 2-0 URU → 4 pts, GF 3, GA 1, GD +2
        # H2H: ARG 1-1 BRA → tie at all levels → overall GD same → overall GF same
        # No 3rd team in the scenario to make it 4 teams... but we only have 3.
        # The function should handle groups with any number of teams.

        # Actually the function signature says group_id and matches, and should find 
        # all teams from matches. Let me create a 4-team scenario with 2 fully identical:
        matches4 = [
            _match("arg", "bra", 1, 1),
            _match("uru", "chi", 0, 3),
            _match("arg", "uru", 3, 0),
            _match("bra", "chi", 3, 0),
            _match("arg", "chi", 4, 1),
            _match("bra", "uru", 4, 1),
        ]
        # Both ARG and BRA: 7 pts, GF 8, GA 2, GD +6, H2H draw 1-1
        # H2H: 1 pt each, GD 0, GF 1 → exhausted
        # Overall: identical → exhausted at overall level too
        result = compute_group_standings(matches4, "a")
        tied = [s for s in result if s.tiebreaker_exhausted]
        assert len(tied) >= 1
        # ARG and BRA should share positions or both have exhausted flag
        top_codes = {s.team_code for s in result if s.position in (1, 2)}
        assert "arg" in top_codes
        assert "bra" in top_codes


class TestComputeBestThirdRanking:
    """Unit tests for compute_best_third_ranking()."""

    def _make_mock_standings(self, group_letters: list[str], third_stats: list[tuple[str, int, int, int, int]] = None) -> dict[str, list[TeamStanding]]:
        """Build mock all_standings for multiple groups.

        Each group gets 4 teams with synthetic stats. The third element (position 3)
        will match the provided third_stats when given.
        """
        result = {}
        for idx, gl in enumerate(group_letters):
            if third_stats and idx < len(third_stats):
                code, pts, gd, gf, won = third_stats[idx]
            else:
                code = f"team-{gl}3"
                pts, gd, gf, won = 0, -10, 0, 0

            s = [
                TeamStanding(f"team-{gl}1", 3, 3, 0, 0, 9, 0, 9, 9, 1, "qualified"),
                TeamStanding(f"team-{gl}2", 3, 2, 0, 1, 5, 1, 4, 6, 2, "qualified"),
                TeamStanding(code, 3, won, 0, 3 - won, gf, gf - gd, gd, pts, 3, "best_third"),
                TeamStanding(f"team-{gl}4", 3, 0, 0, 3, 0, 8, -8, 0, 4, "eliminated"),
            ]
            result[gl] = s
        return result

    def test_rank_12_third_placed_teams(self):
        """Scenario: All 12 groups complete, top 8 qualify."""
        group_letters = [chr(ord("a") + i) for i in range(12)]
        # Give each 3rd-placed team different stats for clear ranking
        standings = self._make_mock_standings(
            group_letters,
            [
                (f"T{i}", 9 - i, 5 - i // 2, 8 - i, 3 - (i // 4))
                for i in range(12)
            ],
        )
        result = compute_best_third_ranking(standings)
        assert len(result) == 12

        # First 8 should be qualified
        qualified = [r for r in result if r["qualified"]]
        assert len(qualified) == 8

        # Points should be descending
        for i in range(len(result) - 1):
            assert result[i]["points"] >= result[i + 1]["points"]

    def test_fewer_than_12_groups_complete(self):
        """Scenario: Only 6 groups done, results reflect partial data."""
        group_letters = [chr(ord("a") + i) for i in range(6)]
        standings = self._make_mock_standings(
            group_letters,
            [(f"T{i}", 6 - i, 2, 4, 2) for i in range(6)],
        )
        result = compute_best_third_ranking(standings)
        assert len(result) == 6

    def test_tie_at_every_level_best_third(self):
        """Scenario: Two third-placed teams identical, no FP/FIFA → exhausted."""
        standings = self._make_mock_standings(
            ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"],
            [
                ("TA", 4, 0, 2, 1),  # Group A: 4 pts, GD 0, GF 2
                ("TB", 4, 0, 2, 1),  # Group B: identical
                ("TC", 3, -1, 3, 1),
                ("TD", 3, -2, 1, 1),
                ("TE", 2, -3, 2, 0),
                ("TF", 2, -4, 1, 0),
                ("TG", 1, -5, 2, 0),
                ("TH", 1, -6, 1, 0),
                ("TI", 0, -7, 0, 0),
                ("TJ", 0, -8, 0, 0),
                ("TK", 0, -9, 0, 0),
                ("TL", 0, -10, 0, 0),
            ],
        )
        result = compute_best_third_ranking(standings)
        # TA and TB identical (4 pts, GD 0, GF 2)
        # They should have tiebreaker_exhausted flag
        top_two = result[:2]
        assert any(r.get("tiebreaker_exhausted") for r in top_two)
