"""Unit tests for summarize_h2h helper."""

from routers.tournament import summarize_h2h


def _make_match(
    team1: str,
    team2: str,
    score: str,
    stage: str = "group",
    penalty_score: str | None = None,
    date: str | None = None,
) -> dict:
    parts = score.split("-")
    t1g = int(parts[0])
    t2g = int(parts[1])
    return {
        "team1": {"name": team1, "is_winner": False},
        "team2": {"name": team2, "is_winner": False},
        "score": score,
        "stage": stage,
        "penalty_score": penalty_score,
        "date": date,
        "venue": "Some Stadium",
        "has_extra_time": penalty_score is not None,
    }


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
