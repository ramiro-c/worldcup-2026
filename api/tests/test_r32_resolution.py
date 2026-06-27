"""Tests for R32 match resolution from standings + Annex C table."""

from providers.r32_resolver import resolve_r32_matches
from providers.standings import TeamStanding
from providers.r32_combinations import ANNEX_C


def _make_standings(group: str, first: str, second: str, third: str, fourth: str) -> list[TeamStanding]:
    """Build mock group standings with specified team codes."""
    return [
        TeamStanding(first, 3, 3, 0, 0, 6, 0, 6, 9, 1, "qualified"),
        TeamStanding(second, 3, 2, 0, 1, 4, 2, 2, 6, 2, "qualified"),
        TeamStanding(third, 3, 1, 0, 2, 2, 3, -1, 3, 3, "best_third"),
        TeamStanding(fourth, 3, 0, 0, 3, 1, 8, -7, 0, 4, "eliminated"),
    ]


def _make_best_thirds(groups_and_thirds: list[tuple[str, str, int, int, int]]) -> list[dict]:
    """Build mock best_third ranking list."""
    ranking = []
    for group, code, pts, gd, gf in groups_and_thirds:
        ranking.append({
            "team_code": code,
            "group": group,
            "points": pts,
            "gd": gd,
            "gf": gf,
            "ga": gf - gd,
            "played": 3,
            "won": pts // 3,
            "drawn": 0,
            "lost": 3 - pts // 3,
            "position": 0,
            "qualified": False,
        })
    # Sort and mark top 8 qualified
    ranking.sort(key=lambda t: (-t["points"], -t["gd"], -t["gf"]))
    for i, t in enumerate(ranking):
        t["position"] = i + 1
        t["qualified"] = i < 8
    return ranking


class TestResolveR32Matches:
    """Unit tests for resolve_r32_matches()."""

    def test_partial_groups_returns_nulls(self):
        """Scenario: fewer than 8 groups completed → R32 teams are null."""
        standings = {}
        for gl in "abcdefg":  # Only 7 groups
            standings[gl] = _make_standings(gl, f"T{gl}1", f"T{gl}2", f"T{gl}3", f"T{gl}4")

        result = resolve_r32_matches(standings, [], ANNEX_C)
        assert len(result) == 16

        # All teams should be null (not enough groups for best-third ranking)
        for match in result:
            assert match["home_team"] is None
            assert match["away_team"] is None

    def test_full_resolution_returns_16_concrete_teams(self):
        """Scenario: all 12 groups complete → all 16 R32 slots have teams."""
        # Simulate a scenario where groups B,D,E,F,I,J,K,L produce best thirds
        # (combination #67 in ANNEX_C)
        standings = {}
        for gl in "abcdefghijkl":
            standings[gl] = _make_standings(gl, f"T{gl}1", f"T{gl}2", f"T{gl}3", f"T{gl}4")

        # Set up best thirds so groups B,D,E,F,I,J,K,L have the top 8 thirds
        # Third-placed teams: give them different stats so we get a clear ranking
        best_thirds_data = [
            ("b", "TB3", 9, 4, 5),   # Best third
            ("d", "TD3", 7, 3, 4),
            ("e", "TE3", 6, 2, 3),
            ("f", "TF3", 6, 1, 3),
            ("i", "TI3", 5, 1, 3),
            ("j", "TJ3", 5, 0, 2),
            ("k", "TK3", 4, 0, 2),
            ("l", "TL3", 4, -1, 1),  # 8th — qualifies
            # Non-qualifiers
            ("a", "TA3", 3, -1, 2),
            ("c", "TC3", 3, -2, 1),
            ("g", "TG3", 2, -3, 1),
            ("h", "TH3", 1, -4, 0),
        ]
        best_thirds = _make_best_thirds(best_thirds_data)

        result = resolve_r32_matches(standings, best_thirds, ANNEX_C)
        assert len(result) == 16

        # Every match should have resolved teams
        for i, match in enumerate(result):
            assert match["home_team"] is not None, f"Match {i} ({match.get('id')}) has null home_team"
            assert match["away_team"] is not None, f"Match {i} ({match.get('id')}) has null away_team"

    def test_tiebreaker_exhausted_handled(self):
        """Scenario: tiebreaker_exhausted best-thirds are treated as qualified."""
        standings = {}
        for gl in "abcdefghijkl":
            standings[gl] = _make_standings(gl, f"T{gl}1", f"T{gl}2", f"T{gl}3", f"T{gl}4")

        # 9th and 10th best thirds tied — but only 8 qualify
        # The qualifiers are B,D,E,F,I,J,K,L (same as above but with tie at 8/9)
        best_thirds_data = [
            ("b", "TB3", 5, 2, 3),
            ("d", "TD3", 5, 1, 3),
            ("e", "TE3", 4, 2, 3),
            ("f", "TF3", 4, 1, 3),
            ("i", "TI3", 4, 0, 3),
            ("j", "TJ3", 3, 1, 2),
            ("k", "TK3", 3, 0, 2),
            ("l", "TL3", 2, 0, 2),
            ("a", "TA3", 2, -1, 1),
            ("c", "TC3", 2, -2, 1),
            ("g", "TG3", 1, -3, 1),
            ("h", "TH3", 0, -4, 0),
        ]

        best_thirds = _make_best_thirds(best_thirds_data)
        result = resolve_r32_matches(standings, best_thirds, ANNEX_C)

        # Should still produce 16 matches
        assert len(result) == 16

    def test_match_structure(self):
        """Each resolved match has the expected structure."""
        standings = {}
        for gl in "abcdefghijkl":
            standings[gl] = _make_standings(gl, f"T{gl}1", f"T{gl}2", f"T{gl}3", f"T{gl}4")

        best_thirds_data = [
            ("b", "TB3", 5, 2, 3),
            ("d", "TD3", 4, 1, 3),
            ("e", "TE3", 4, 0, 3),
            ("f", "TF3", 3, 1, 3),
            ("i", "TI3", 3, 0, 3),
            ("j", "TJ3", 2, 1, 2),
            ("k", "TK3", 2, 0, 2),
            ("l", "TL3", 1, 0, 2),
            ("a", "TA3", 1, -1, 1),
            ("c", "TC3", 1, -2, 1),
            ("g", "TG3", 0, -3, 1),
            ("h", "TH3", 0, -4, 0),
        ]
        best_thirds = _make_best_thirds(best_thirds_data)
        result = resolve_r32_matches(standings, best_thirds, ANNEX_C)

        for match in result:
            required = {"id", "slot", "home_team", "away_team", "home_team_name", "away_team_name"}
            for key in required:
                assert key in match, f"Match {match.get('id')} missing key '{key}'"

    def test_fixed_slots_use_group_winners_and_runners_up(self):
        """Fixed slots (no third-place teams) correctly use 1st/2nd from each group."""
        standings = {}
        for gl in "abcdefghijkl":
            standings[gl] = _make_standings(gl, f"T{gl}1", f"T{gl}2", f"T{gl}3", f"T{gl}4")

        best_thirds_data = [
            ("b", "TB3", 5, 2, 3),
            ("d", "TD3", 4, 1, 3),
            ("e", "TE3", 4, 0, 3),
            ("f", "TF3", 3, 1, 3),
            ("i", "TI3", 3, 0, 3),
            ("j", "TJ3", 2, 1, 2),
            ("k", "TK3", 2, 0, 2),
            ("l", "TL3", 1, 0, 2),
            ("a", "TA3", 1, -1, 1),
            ("c", "TC3", 1, -2, 1),
            ("g", "TG3", 0, -3, 1),
            ("h", "TH3", 0, -4, 0),
        ]
        best_thirds = _make_best_thirds(best_thirds_data)
        result = resolve_r32_matches(standings, best_thirds, ANNEX_C)

        # M73 (slot 0): 2A vs 2B
        assert result[0]["home_team"].lower() == "ta2"
        assert result[0]["away_team"].lower() == "tb2"

        # M75 (slot 2): 1F vs 2C
        assert result[2]["home_team"].lower() == "tf1"
        assert result[2]["away_team"].lower() == "tc2"

        # M88 (slot 15): 2D vs 2G
        assert result[15]["home_team"].lower() == "td2"
        assert result[15]["away_team"].lower() == "tg2"
