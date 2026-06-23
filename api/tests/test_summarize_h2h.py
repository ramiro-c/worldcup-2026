"""Unit tests for summarize_h2h helper."""

from routers.tournament import summarize_h2h


def _make_match(
    team1: str,
    team2: str,
    score: str,
    stage: str = "group",
    penalty_score: str | None = None,
    date: str | None = None,
    tournament_year: int | None = None,
) -> dict:
    parts = score.split("-")
    t1g = int(parts[0])
    t2g = int(parts[1])
    match = {
        "team1": {"name": team1, "is_winner": False},
        "team2": {"name": team2, "is_winner": False},
        "score": score,
        "stage": stage,
        "penalty_score": penalty_score,
        "date": date,
        "venue": "Some Stadium",
        "has_extra_time": penalty_score is not None,
    }
    if tournament_year is not None:
        match["tournament_year"] = tournament_year
        match["tournament_name"] = f"World Cup {tournament_year}"
    return match


class TestSummarizeH2hEmptyHistory:
    """When there are no historical matches, all counts are zero."""

    def test_empty_list_returns_zero_counts(self):
        result = summarize_h2h([], "Argentina", "Germany")
        assert result["total_matches"] == 0
        assert result["team1_wins"] == 0
        assert result["team2_wins"] == 0
        assert result["draws"] == 0
        assert result["team1_goals"] == 0
        assert result["team2_goals"] == 0
        assert result["last_meetings"] == []
        assert result["last_meeting"] is None


class TestSummarizeH2hBasicStats:
    """Basic win/draw/goal counting."""

    def test_single_match_team1_wins(self):
        matches = [_make_match("Argentina", "Germany", "3-1", date="18 Dec 2022")]
        result = summarize_h2h(matches, "Argentina", "Germany")
        assert result["total_matches"] == 1
        assert result["team1_wins"] == 1
        assert result["team2_wins"] == 0
        assert result["draws"] == 0
        assert result["team1_goals"] == 3
        assert result["team2_goals"] == 1

    def test_single_match_team2_wins(self):
        matches = [_make_match("Argentina", "Germany", "0-4", date="3 Jul 2010")]
        result = summarize_h2h(matches, "Argentina", "Germany")
        assert result["total_matches"] == 1
        assert result["team1_wins"] == 0
        assert result["team2_wins"] == 1
        assert result["team1_goals"] == 0
        assert result["team2_goals"] == 4

    def test_draw_counts_as_draw(self):
        matches = [_make_match("Argentina", "Germany", "1-1", date="30 Jun 2006")]
        result = summarize_h2h(matches, "Argentina", "Germany")
        assert result["total_matches"] == 1
        assert result["team1_wins"] == 0
        assert result["team2_wins"] == 0
        assert result["draws"] == 1

    def test_multiple_matches_accumulate(self):
        matches = [
            _make_match("Argentina", "Germany", "3-1", date="18 Dec 2022"),
            _make_match("Germany", "Argentina", "4-0", date="3 Jul 2010"),
            _make_match("Argentina", "Germany", "1-1", date="30 Jun 2006"),
        ]
        result = summarize_h2h(matches, "Argentina", "Germany")
        assert result["total_matches"] == 3
        assert result["team1_wins"] == 1  # Argentina won 3-1 in 2022
        assert result["team2_wins"] == 1  # Germany won 4-0 in 2010 (from GER perspective, team2=GER)
        assert result["draws"] == 1
        assert result["team1_goals"] == 4  # 3 + 0 + 1
        assert result["team2_goals"] == 6  # 1 + 4 + 1


class TestSummarizeH2hGoalsByPerspective:
    """Goals are counted from team1/team2 perspective regardless of home/away in historical match."""

    def test_goals_count_from_team1_perspective(self):
        """When team1 appears on team2 side of historical match, goals are still attributed to team1."""
        matches = [
            _make_match("Germany", "Argentina", "0-1", date="3 Jul 2010"),
        ]
        result = summarize_h2h(matches, "Argentina", "Germany")
        # Argentina (team1) won 1-0 despite being listed as team2 in historical match
        assert result["team1_wins"] == 1
        assert result["team2_wins"] == 0
        assert result["team1_goals"] == 1
        assert result["team2_goals"] == 0


class TestSummarizeH2hPenaltyDecisions:
    """Penalty-decided matches count as wins for the penalty winner."""

    def test_penalty_win_counted_as_win(self):
        matches = [
            _make_match("Argentina", "France", "3-3", date="18 Dec 2022", penalty_score="4-2"),
        ]
        result = summarize_h2h(matches, "Argentina", "France")
        assert result["total_matches"] == 1
        assert result["team1_wins"] == 1  # Argentina won on penalties
        assert result["team2_wins"] == 0
        assert result["draws"] == 0  # Penalty-decided match is not a draw

    def test_penalty_win_for_team2(self):
        matches = [
            _make_match("Brazil", "Chile", "1-1", date="28 Jun 2014", penalty_score="2-3"),
        ]
        result = summarize_h2h(matches, "Brazil", "Chile")
        assert result["total_matches"] == 1
        assert result["team1_wins"] == 0
        assert result["team2_wins"] == 1  # Chile won on penalties
        assert result["draws"] == 0


class TestSummarizeH2hMalformedPenaltyScore:
    """Malformed penalty_score strings must not crash the function.

    Real openfootball data can include non-digit characters in the penalty
    score field. The parser must guard with .isdigit() and fall back to 0
    instead of raising ValueError.
    """

    def test_non_digit_penalty_score_does_not_crash(self):
        matches = [
            _make_match("Argentina", "France", "3-3", date="18 Dec 2022", penalty_score="abc-def"),
        ]
        # Must not raise ValueError
        result = summarize_h2h(matches, "Argentina", "France")
        # Falls back to 0-0: not a win for either side → counted as draw-ish
        # (per current logic, no penalty winner attribution is made)
        assert result["total_matches"] == 1
        # 0-0 penalty falls through to the no-winner branch (pen_winner_is_team1 False → team2_wins += 1)
        # The important contract: no crash, stats stay consistent.
        assert (result["team1_wins"] + result["team2_wins"] + result["draws"]) == 1

    def test_partial_digit_penalty_score_uses_zero_for_bad_part(self):
        matches = [
            _make_match("Argentina", "France", "1-1", date="18 Dec 2022", penalty_score="4-x"),
        ]
        # Must not raise — "x" is not a digit, so pt2 defaults to 0 → Argentina wins on pens
        result = summarize_h2h(matches, "Argentina", "France")
        assert result["total_matches"] == 1
        assert result["team1_wins"] == 1

    def test_malformed_penalty_score_does_not_suppress_other_matches(self):
        """One bad penalty match must not hide the rest of the history."""
        matches = [
            _make_match("Argentina", "France", "3-3", date="18 Dec 2022", penalty_score="???"),
            _make_match("Argentina", "France", "1-0", date="13 Jul 1930", tournament_year=1930),
        ]
        result = summarize_h2h(matches, "Argentina", "France")
        # Both matches should be accounted for
        assert result["total_matches"] == 2
        assert result["team1_goals"] == 4  # 3 + 1
        assert result["team2_goals"] == 3  # 3 + 0


class TestSummarizeH2hLastMeetings:
    """Last meetings are sorted descending and capped at 5."""

    def test_last_meetings_contains_most_recent_first(self):
        matches = [
            _make_match("Argentina", "Germany", "4-0", date="3 Jul 2010"),
            _make_match("Argentina", "Germany", "3-1", date="18 Dec 2022"),
        ]
        result = summarize_h2h(matches, "Argentina", "Germany")
        assert len(result["last_meetings"]) == 2
        assert result["last_meetings"][0]["date"] == "18 Dec 2022"
        assert result["last_meetings"][1]["date"] == "3 Jul 2010"

    def test_last_meeting_is_most_recent(self):
        matches = [
            _make_match("Argentina", "Germany", "0-1", date="3 Jul 2010"),
            _make_match("Argentina", "Germany", "3-1", date="18 Dec 2022"),
        ]
        result = summarize_h2h(matches, "Argentina", "Germany")
        assert result["last_meeting"] is not None
        assert result["last_meeting"]["date"] == "18 Dec 2022"
        assert result["last_meeting"]["score"] == "3-1"

    def test_last_meetings_capped_at_five(self):
        dates = [f"{i} Jun 20{i:02d}" for i in range(1, 10)]
        matches = [_make_match("Team A", "Team B", "1-0", date=d) for d in dates]
        result = summarize_h2h(matches, "Team A", "Team B")
        assert len(result["last_meetings"]) == 5

    def test_last_meeting_winner_field(self):
        matches = [_make_match("Argentina", "Germany", "3-1", date="18 Dec 2022")]
        result = summarize_h2h(matches, "Argentina", "Germany")
        assert result["last_meeting"]["winner"] == "Argentina"

    def test_last_meeting_winner_is_none_on_draw(self):
        matches = [_make_match("Argentina", "Germany", "1-1", date="30 Jun 2006")]
        result = summarize_h2h(matches, "Argentina", "Germany")
        assert result["last_meeting"]["winner"] is None

    def test_last_meeting_stage_preserved(self):
        matches = [_make_match("Argentina", "Germany", "3-1", stage="final", date="18 Dec 2022")]
        result = summarize_h2h(matches, "Argentina", "Germany")
        assert result["last_meeting"]["stage"] == "final"

    def test_last_meeting_year_preserved_from_tournament_year(self):
        matches = [_make_match("Argentina", "Germany", "3-1", date="18 Dec 2022", tournament_year=2022)]
        result = summarize_h2h(matches, "Argentina", "Germany")
        assert result["last_meeting"]["year"] == 2022


class TestSummarizeH2hDateSortWithTournamentYear:
    """Date sort must use tournament_year when the date string omits the year.

    Real openfootball dates look like "Sat Jun 12" — no year. The H2H
    provider attaches a tournament_year to each match, and the sort key
    must fall back to it so the order is actually chronological.
    """

    def test_dates_without_year_sort_by_tournament_year(self):
        # Provider returns these in arbitrary order; the most recent (2014) should
        # come first regardless of input ordering.
        matches = [
            _make_match("Argentina", "Germany", "1-0", date="Sat Jun 14", tournament_year=1930),
            _make_match("Argentina", "Germany", "3-1", date="Sat Jul 13", tournament_year=2014),
            _make_match("Argentina", "Germany", "0-0", date="Mon Jun  8", tournament_year=1958),
        ]
        result = summarize_h2h(matches, "Argentina", "Germany")
        assert len(result["last_meetings"]) == 3
        # Newest tournament year first
        assert result["last_meetings"][0]["year"] == 2014
        assert result["last_meetings"][1]["year"] == 1958
        assert result["last_meetings"][2]["year"] == 1930

    def test_dates_with_year_take_precedence_over_tournament_year(self):
        """When the date string includes a year, use it (more precise)."""
        matches = [
            _make_match("Argentina", "Germany", "1-0", date="14 Jun 1930", tournament_year=1930),
            _make_match("Argentina", "Germany", "3-1", date="13 Jul 2014", tournament_year=2014),
        ]
        result = summarize_h2h(matches, "Argentina", "Germany")
        assert result["last_meetings"][0]["date"] == "13 Jul 2014"
        assert result["last_meetings"][1]["date"] == "14 Jun 1930"

    def test_matches_without_year_or_tournament_year_dont_crash(self):
        """Defensive: missing both fields must not raise."""
        matches = [
            _make_match("Team A", "Team B", "1-0", date="Sat Jun 12"),
        ]
        result = summarize_h2h(matches, "Team A", "Team B")
        assert result["total_matches"] == 1
        assert len(result["last_meetings"]) == 1


class TestSummarizeH2hTeamAliasResolution:
    """Historical team name variants must resolve to their canonical form.

    openfootball uses historical names (e.g. "Czechoslovakia" for
    "Czech Republic", "W. Germany" for "Germany"). Without alias
    resolution these matches are silently dropped and the winner
    attribution is inverted.
    """

    def test_czech_republic_matches_czechoslovakia_alias(self):
        # API call uses the canonical name; openfootball has the historical alias.
        matches = [_make_match("Czechoslovakia", "Germany", "0-1", date="22 Jun 1990", tournament_year=1990)]
        result = summarize_h2h(matches, "Czech Republic", "Germany")
        # Without alias resolution this match would be silently dropped.
        assert result["total_matches"] == 1
        assert result["team1_wins"] == 0
        assert result["team2_wins"] == 1
        assert result["team1_goals"] == 0
        assert result["team2_goals"] == 1

    def test_czechia_resolves_to_czech_republic_in_match_lookup(self):
        """'Czechia' (modern FIFA name) and 'Czech Republic' must both match
        historical 'Czechoslovakia'."""
        matches = [_make_match("Czechoslovakia", "Germany", "0-1", date="22 Jun 1990", tournament_year=1990)]
        result = summarize_h2h(matches, "Czechia", "Germany")
        assert result["total_matches"] == 1
        assert result["team2_wins"] == 1

    def test_west_germany_alias_counts_for_germany(self):
        matches = [
            _make_match("West Germany", "Argentina", "1-0", date="29 Jun 1986", tournament_year=1986),
        ]
        result = summarize_h2h(matches, "Germany", "Argentina")
        assert result["total_matches"] == 1
        assert result["team1_wins"] == 1
        assert result["team2_wins"] == 0
        assert result["team1_goals"] == 1
        assert result["team2_goals"] == 0

    def test_winner_attribution_corrected_by_alias(self):
        """The score is 0-1 with Czechoslovakia as team1, but team1 is Czech Republic
        and team2 is Germany — the German win must be attributed to team2, not team1.
        Without alias resolution the match is dropped entirely."""
        matches = [_make_match("Czechoslovakia", "Germany", "0-1", date="22 Jun 1990", tournament_year=1990)]
        result = summarize_h2h(matches, "Czech Republic", "Germany")
        assert result["team1_wins"] == 0  # Czech Republic lost
        assert result["team2_wins"] == 1  # Germany won

    def test_both_sides_aliased(self):
        """Match with both teams under historical aliases still resolves."""
        matches = [
            _make_match("Czechoslovakia", "West Germany", "2-2", date="20 Jun 1982", tournament_year=1982),
        ]
        result = summarize_h2h(matches, "Czech Republic", "Germany")
        assert result["total_matches"] == 1
        assert result["draws"] == 1
        assert result["team1_goals"] == 2
        assert result["team2_goals"] == 2

    def test_alias_resolution_preserves_winner_field_in_last_meetings(self):
        matches = [_make_match("Czechoslovakia", "Germany", "0-1", date="22 Jun 1990", tournament_year=1990)]
        result = summarize_h2h(matches, "Czech Republic", "Germany")
        # The winner is the team that won, regardless of aliasing
        assert result["last_meeting"]["winner"] == "Germany"
