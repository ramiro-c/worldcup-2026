"""Tests for the openfootball H2H provider.

These tests stub the network layer and exercise the data assembly logic
in isolation. They focus on the contract that the H2H provider attaches
a `tournament_year` to each match (Bug #3 fix), so the downstream
sort key in summarize_h2h can use it as a fallback when the date
string omits the year.
"""

import asyncio

from providers.openfootball import OpenfootballProvider


class _StubTournament:
    """In-memory tournament fixture."""

    def __init__(self, year: int, matches: list[dict]):
        self.year = year
        self.matches = matches
        self.name = f"World Cup {year}"


def _make_provider_with_stubs(tournaments: dict[int, _StubTournament]) -> OpenfootballProvider:
    """Build a provider whose get_tournament is stubbed to return in-memory data."""
    provider = OpenfootballProvider()

    async def fake_get_tournament(year: int) -> dict:
        t = tournaments.get(year)
        if t is None:
            return {"year": year, "host": "?", "name": f"World Cup {year}", "groups": [], "matches": []}
        return {
            "year": t.year,
            "host": "?",
            "name": t.name,
            "groups": [],
            "matches": t.matches,
        }

    provider.get_tournament = fake_get_tournament  # type: ignore[assignment]
    return provider


def _run(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


class TestHeadToHeadAttachesTournamentYear:
    """get_head_to_head must enrich every returned match with tournament_year."""

    def test_each_match_has_tournament_year(self):
        tournaments = {
            2010: _StubTournament(
                2010,
                [
                    {
                        "date": "Sat Jul  3",
                        "team1": {"name": "Germany", "is_winner": False},
                        "team2": {"name": "Argentina", "is_winner": False},
                        "score": "4-0",
                        "stage": "quarter_final",
                        "venue": "Some Stadium",
                        "penalty_score": None,
                        "has_extra_time": False,
                    },
                ],
            ),
            2022: _StubTournament(
                2022,
                [
                    {
                        "date": "Sun Dec 18",
                        "team1": {"name": "Argentina", "is_winner": False},
                        "team2": {"name": "France", "is_winner": False},
                        "score": "3-3",
                        "stage": "final",
                        "venue": "Lusail",
                        "penalty_score": "4-2",
                        "has_extra_time": True,
                    },
                ],
            ),
        }
        provider = _make_provider_with_stubs(tournaments)

        result = _run(provider.get_head_to_head("Germany", "Argentina"))

        # Only the 2010 match is between Germany and Argentina
        assert len(result) == 1
        match = result[0]
        assert match["tournament_year"] == 2010
        assert match["tournament_name"] == "World Cup 2010"

    def test_tournament_year_distinguishes_identical_score_lines(self):
        """If two tournaments have a 1-0 between the same teams, tournament_year
        is the only signal that breaks the tie in date sort order."""
        tournaments = {
            1990: _StubTournament(
                1990,
                [
                    {
                        "date": "Fri Jun  8",
                        "team1": {"name": "West Germany", "is_winner": False},
                        "team2": {"name": "Argentina", "is_winner": False},
                        "score": "1-0",
                        "stage": "final",
                        "venue": "Rome",
                        "penalty_score": None,
                        "has_extra_time": False,
                    },
                ],
            ),
            2014: _StubTournament(
                2014,
                [
                    {
                        "date": "Sun Jul 13",
                        "team1": {"name": "Germany", "is_winner": False},
                        "team2": {"name": "Argentina", "is_winner": False},
                        "score": "1-0",
                        "stage": "final",
                        "venue": "Maracanã",
                        "penalty_score": None,
                        "has_extra_time": True,
                    },
                ],
            ),
        }
        provider = _make_provider_with_stubs(tournaments)

        result = _run(provider.get_head_to_head("Germany", "Argentina"))

        years = [m["tournament_year"] for m in result]
        assert sorted(years) == [1990, 2014]
        # Both matches present, both with tournament_year populated
        assert all(m["tournament_year"] is not None for m in result)

    def test_no_matches_returns_empty_list(self):
        provider = _make_provider_with_stubs({})
        result = _run(provider.get_head_to_head("Atlantis", "Narnia"))
        assert result == []
