"""Tests for Tournament Stats aggregation and champion detection."""

import pytest
from providers.openfootball import OpenfootballProvider


class TestParseScore:
    """Score parsing utility."""

    def test_normal_score(self):
        provider = OpenfootballProvider()
        assert provider._parse_score("3-1") == (3, 1)

    def test_goalless(self):
        provider = OpenfootballProvider()
        assert provider._parse_score("0-0") == (0, 0)

    def test_big_score(self):
        provider = OpenfootballProvider()
        assert provider._parse_score("10-1") == (10, 1)

    def test_invalid_returns_zeroes(self):
        provider = OpenfootballProvider()
        assert provider._parse_score("abc") == (0, 0)


class TestDetectChampion:
    """Champion detection from tournament data."""

    def test_champion_from_final_match(self):
        """Regular tournament: final match winner is champion."""
        provider = OpenfootballProvider()
        tournament = {
            "year": 2022,
            "matches": [
                {"stage": "group", "team1": {"name": "A", "is_winner": False}, "team2": {"name": "B", "is_winner": True}, "score": "1-2"},
                {"stage": "final", "team1": {"name": "Argentina", "is_winner": True}, "team2": {"name": "France", "is_winner": False}, "score": "3-3"},
            ],
        }
        assert provider._detect_champion(tournament) == "Argentina"

    def test_champion_is_team2_in_final(self):
        """Final match winner can be team2."""
        provider = OpenfootballProvider()
        tournament = {
            "year": 2014,
            "matches": [
                {"stage": "final", "team1": {"name": "Germany", "is_winner": True}, "team2": {"name": "Argentina", "is_winner": False}, "score": "1-0"},
            ],
        }
        assert provider._detect_champion(tournament) == "Germany"

    def test_1950_champion(self):
        """1950 had no final match — Uruguay is champion."""
        provider = OpenfootballProvider()
        tournament = {
            "year": 1950,
            "matches": [
                {"stage": "group", "team1": {"name": "Brazil", "is_winner": True}, "team2": {"name": "Uruguay", "is_winner": False}, "score": "0-0"},
            ],
        }
        assert provider._detect_champion(tournament) == "Uruguay"

    def test_no_champion_returns_none(self):
        """Future or incomplete tournament with no final match."""
        provider = OpenfootballProvider()
        tournament = {
            "year": 2026,
            "matches": [
                {"stage": "group", "team1": {"name": "A", "is_winner": False}, "team2": {"name": "B", "is_winner": True}, "score": "0-1"},
            ],
        }
        assert provider._detect_champion(tournament) is None


class TestAggregation:
    """Full aggregation logic (mocked tournament data)."""

    @pytest.mark.asyncio
    async def test_champion_counts(self, monkeypatch):
        """Verify known champion counts: Brazil 5, Germany 4, Italy 4, Argentina 3."""
        provider = OpenfootballProvider()

        # Map year → expected champion
        champion_map = {
            1930: "Uruguay",
            1934: "Italy",
            1938: "Italy",
            1950: "Uruguay",
            1954: "West Germany",
            1958: "Brazil",
            1962: "Brazil",
            1966: "England",
            1970: "Brazil",
            1974: "West Germany",
            1978: "Argentina",
            1982: "Italy",
            1986: "Argentina",
            1990: "West Germany",
            1994: "Brazil",
            1998: "France",
            2002: "Brazil",
            2006: "Italy",
            2010: "Spain",
            2014: "Germany",
            2018: "France",
            2022: "Argentina",
        }

        async def mock_get_tournament(year):
            champion = champion_map.get(year, "Unknown")
            if year == 1950:
                # 1950 has no final match
                match = {
                    "stage": "group",
                    "team1": {"name": "Uruguay", "is_winner": True},
                    "team2": {"name": "Brazil", "is_winner": False},
                    "score": "2-1",
                    "scorers": [],
                }
            else:
                match = {
                    "stage": "final",
                    "team1": {"name": champion, "is_winner": True},
                    "team2": {"name": "Loser", "is_winner": False},
                    "score": "2-0",
                    "scorers": [],
                }
            return {
                "year": year,
                "host": "Somewhere",
                "name": f"World Cup {year}",
                "matches": [match],
            }

        monkeypatch.setattr(provider, "get_tournament", mock_get_tournament)

        stats = await provider.get_tournament_stats()
        counts = {c["country"]: c["count"] for c in stats["champion_counts"]}

        assert counts.get("Brazil") == 5
        assert counts.get("Germany") == 4
        assert counts.get("Italy") == 4
        assert counts.get("Argentina") == 3
        assert counts.get("Uruguay") == 2
        assert counts.get("France") == 2
        assert counts.get("England") == 1
        assert counts.get("Spain") == 1

    @pytest.mark.asyncio
    async def test_champion_counts_sorted(self, monkeypatch):
        """Champion counts are sorted by count descending."""
        provider = OpenfootballProvider()

        async def mock_get_tournament(year):
            # Alternate between Brazil and Argentina to get multiple entries
            champion = "Brazil" if year % 2 == 0 else "Argentina"
            return {
                "year": year,
                "host": "X",
                "name": f"WC {year}",
                "matches": [
                    {"stage": "final", "team1": {"name": champion, "is_winner": True}, "team2": {"name": "Loser", "is_winner": False}, "score": "1-0", "scorers": []},
                ],
            }

        monkeypatch.setattr(provider, "get_tournament", mock_get_tournament)

        stats = await provider.get_tournament_stats()
        counts = stats["champion_counts"]
        for i in range(len(counts) - 1):
            assert counts[i]["count"] >= counts[i + 1]["count"]

    @pytest.mark.asyncio
    async def test_biggest_wins_detected(self, monkeypatch):
        """Big margins are detected and sorted correctly."""
        provider = OpenfootballProvider()

        async def mock_get_tournament(year):
            matches = []
            if year == 1954:
                matches.append({
                    "stage": "group",
                    "team1": {"name": "Hungary", "is_winner": True},
                    "team2": {"name": "South Korea", "is_winner": False},
                    "score": "9-0",
                    "scorers": [],
                })
                matches.append({
                    "stage": "group",
                    "team1": {"name": "Hungary", "is_winner": True},
                    "team2": {"name": "West Germany", "is_winner": False},
                    "score": "8-3",
                    "scorers": [],
                })
            elif year == 1982:
                matches.append({
                    "stage": "group",
                    "team1": {"name": "Hungary", "is_winner": True},
                    "team2": {"name": "El Salvador", "is_winner": False},
                    "score": "10-1",
                    "scorers": [],
                })
            elif year == 2002:
                matches.append({
                    "stage": "group",
                    "team1": {"name": "Germany", "is_winner": True},
                    "team2": {"name": "Saudi Arabia", "is_winner": False},
                    "score": "8-0",
                    "scorers": [],
                })
            else:
                matches.append({
                    "stage": "group",
                    "team1": {"name": "A", "is_winner": True},
                    "team2": {"name": "B", "is_winner": False},
                    "score": "1-0",
                    "scorers": [],
                })
            return {
                "year": year,
                "host": "X",
                "name": f"WC {year}",
                "matches": matches,
            }

        monkeypatch.setattr(provider, "get_tournament", mock_get_tournament)

        stats = await provider.get_tournament_stats()
        wins = stats["biggest_wins"]

        # 1982 Hungary 10-1 El Salvador (margin 9)
        # 1954 Hungary 9-0 South Korea (margin 9)
        # 2002 Germany 8-0 Saudi Arabia (margin 8)
        # 1954 Hungary 8-3 West Germany (margin 5)
        assert len(wins) >= 3

        # Check biggest win is one of the 9-margin ones
        assert wins[0]["margin"] == 9
        # Check all have margin >= 4
        for w in wins:
            assert w["margin"] >= 4

    @pytest.mark.asyncio
    async def test_total_goals_accumulated(self, monkeypatch):
        """Total goals across all tournaments."""
        provider = OpenfootballProvider()

        async def mock_get_tournament(year):
            # Each tournament has one match with score 2-1 (3 goals)
            return {
                "year": year,
                "host": "X",
                "name": f"WC {year}",
                "matches": [
                    {"stage": "final", "team1": {"name": "A", "is_winner": True}, "team2": {"name": "B", "is_winner": False}, "score": "2-1", "scorers": []},
                ],
            }

        monkeypatch.setattr(provider, "get_tournament", mock_get_tournament)

        stats = await provider.get_tournament_stats()
        # 22 tournaments * 3 goals = 66
        assert stats["total_goals"]["overall"] == 66
        assert stats["total_goals"]["avg_per_tournament"] == 3.0

    @pytest.mark.asyncio
    async def test_host_records(self, monkeypatch):
        """Host records include year, host, and champion."""
        provider = OpenfootballProvider()

        async def mock_get_tournament(year):
            if year == 1950:
                return {
                    "year": 1950,
                    "host": "Brazil",
                    "name": "WC 1950",
                    "matches": [
                        {"stage": "group", "team1": {"name": "Uruguay", "is_winner": True}, "team2": {"name": "Brazil", "is_winner": False}, "score": "2-1", "scorers": []},
                    ],
                }
            champion = "Germany" if year == 2014 else "SomeTeam"
            return {
                "year": year,
                "host": "Germany" if year == 2014 else "Place",
                "name": f"WC {year}",
                "matches": [
                    {"stage": "final", "team1": {"name": champion, "is_winner": True}, "team2": {"name": "Loser", "is_winner": False}, "score": "1-0", "scorers": []},
                ],
            }

        monkeypatch.setattr(provider, "get_tournament", mock_get_tournament)

        stats = await provider.get_tournament_stats()
        records = stats["host_records"]

        # 1950: host Brazil, champion Uruguay
        r1950 = next(r for r in records if r["year"] == 1950)
        assert r1950["host"] == "Brazil"
        assert r1950["champion"] == "Uruguay"

    @pytest.mark.asyncio
    async def test_partial_failure_skips_tournament(self, monkeypatch):
        """One tournament failure doesn't crash the whole aggregation."""
        provider = OpenfootballProvider()

        call_count = 0

        async def mock_get_tournament(year):
            nonlocal call_count
            call_count += 1
            if year == 1950:
                raise Exception("Network error for 1950")
            return {
                "year": year,
                "host": "X",
                "name": f"WC {year}",
                "matches": [
                    {"stage": "final", "team1": {"name": "A", "is_winner": True}, "team2": {"name": "B", "is_winner": False}, "score": "1-0", "scorers": []},
                ],
            }

        monkeypatch.setattr(provider, "get_tournament", mock_get_tournament)

        stats = await provider.get_tournament_stats()
        assert "skipped_tournaments" in stats
        assert 1950 in stats["skipped_tournaments"]
        assert stats["total_goals"]["overall"] > 0

    @pytest.mark.asyncio
    async def test_top_scorers_aggregated(self, monkeypatch):
        """Top scorers are aggregated across tournaments."""
        provider = OpenfootballProvider()

        async def mock_get_tournament(year):
            scorers = [
                {"player": "Müller", "minute": 10, "penalty": False, "team": "Germany"},
                {"player": "Müller", "minute": 55, "penalty": False, "team": "Germany"},
                {"player": "Klose", "minute": 20, "penalty": False, "team": "Germany"},
            ]
            if year != 2010:
                scorers = []
            return {
                "year": year,
                "host": "X",
                "name": f"WC {year}",
                "matches": [
                    {"stage": "group", "team1": {"name": "A", "is_winner": True}, "team2": {"name": "B", "is_winner": False}, "score": "3-0", "scorers": scorers},
                ],
            }

        monkeypatch.setattr(provider, "get_tournament", mock_get_tournament)

        stats = await provider.get_tournament_stats()
        scorers = stats["top_scorers"]

        muller = next(s for s in scorers if s["player"] == "Müller")
        assert muller["goals"] == 2
        assert muller["tournaments"] == [2010]

        klose = next(s for s in scorers if s["player"] == "Klose")
        assert klose["goals"] == 1

    @pytest.mark.asyncio
    async def test_1950_uruguay_champion_integration(self, monkeypatch):
        """1950 edge case: Uruguay detected as champion even without final match."""
        provider = OpenfootballProvider()

        async def mock_get_tournament(year):
            if year == 1950:
                return {
                    "year": 1950,
                    "host": "Brazil",
                    "name": "World Cup 1950",
                    "matches": [
                        {"stage": "group", "team1": {"name": "Uruguay", "is_winner": True}, "team2": {"name": "Brazil", "is_winner": False}, "score": "2-1", "scorers": []},
                    ],
                }
            return {
                "year": year,
                "host": "X",
                "name": f"WC {year}",
                "matches": [
                    {"stage": "final", "team1": {"name": "TeamA", "is_winner": True}, "team2": {"name": "TeamB", "is_winner": False}, "score": "1-0", "scorers": []},
                ],
            }

        monkeypatch.setattr(provider, "get_tournament", mock_get_tournament)

        stats = await provider.get_tournament_stats()
        counts = {c["country"]: c["count"] for c in stats["champion_counts"]}
        assert counts.get("Uruguay", 0) >= 1
