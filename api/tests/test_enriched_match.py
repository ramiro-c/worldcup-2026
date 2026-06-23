"""Integration tests for the enriched match endpoint."""

from fastapi import FastAPI
from fastapi.testclient import TestClient
from routers.tournament import router, init_router
from providers.interfaces import IHeadToHeadProvider


class _MockProvider:
    """Mock tournament provider."""

    async def get_groups(self) -> list[dict]:
        return []

    async def get_teams(self) -> list[dict]:
        return []

    async def get_venues(self) -> list[dict]:
        return []

    async def get_matches(self) -> list[dict]:
        return []

    async def get_match(self, match_id: str) -> dict | None:
        if match_id == "arg-vs-ger":
            return {
                "slug": "arg-vs-ger",
                "num": 1,
                "home": "arg",
                "away": "ger",
                "home_name": "Argentina",
                "away_name": "Germany",
                "date": "2026-07-15",
                "status": "scheduled",
                "venue": "metlife",
                "venue_name": "MetLife Stadium",
                "venue_city": "East Rutherford, NJ",
                "datetime_utc": "2026-07-15T20:00:00Z",
                "phase": "final",
            }
        if match_id == "cpv-vs-cuw":
            return {
                "slug": "cpv-vs-cuw",
                "num": 2,
                "home": "cpv",
                "away": "cuw",
                "home_name": "Cape Verde Islands",
                "away_name": "Curaçao",
                "date": "2026-06-14",
                "status": "scheduled",
            }
        return None

    async def get_tv(self) -> list[dict]:
        return []


class _MockH2HProvider(IHeadToHeadProvider):
    """Mock head-to-head provider with controllable data."""

    def __init__(self):
        self._matches: list[dict] = []
        self._should_fail = False

    def set_matches(self, matches: list[dict]):
        self._matches = matches

    def set_fail(self, should_fail: bool):
        self._should_fail = should_fail

    async def get_head_to_head(self, team1: str, team2: str) -> list[dict]:
        if self._should_fail:
            raise TimeoutError("Provider timeout")
        return self._matches


def _build_client(h2h_provider: _MockH2HProvider | None = None) -> TestClient:
    app = FastAPI()
    init_router(_MockProvider(), h2h_provider)
    app.include_router(router)
    return TestClient(app)


def _make_h2h_match(
    team1: str, team2: str, score: str, stage: str = "group", date: str | None = None,
) -> dict:
    return {
        "team1": {"name": team1, "is_winner": False},
        "team2": {"name": team2, "is_winner": False},
        "score": score,
        "stage": stage,
        "penalty_score": None,
        "date": date,
        "venue": "Some Stadium",
        "has_extra_time": False,
        "scorers": [],
    }


class TestEnrichedMatch200:
    """GET /matches/{id}/enriched returns 200 with match + H2H."""

    def test_returns_match_and_h2h_data(self):
        h2h = _MockH2HProvider()
        h2h.set_matches([
            _make_h2h_match("Argentina", "Germany", "3-1", stage="final", date="18 Dec 2022"),
            _make_h2h_match("Germany", "Argentina", "4-0", stage="quarter_final", date="3 Jul 2010"),
        ])
        client = _build_client(h2h)

        response = client.get("/tournament/matches/arg-vs-ger/enriched")

        assert response.status_code == 200
        body = response.json()
        assert "data" in body
        assert body["data"]["match"]["id"] == "arg-vs-ger"
        assert body["data"]["head_to_head"] is not None
        assert body["data"]["head_to_head"]["total_matches"] == 2
        assert body["data"]["head_to_head"]["team1_wins"] == 1
        assert body["data"]["head_to_head"]["team2_wins"] == 1

    def test_no_history_returns_empty_summary(self):
        h2h = _MockH2HProvider()
        h2h.set_matches([])
        client = _build_client(h2h)

        response = client.get("/tournament/matches/cpv-vs-cuw/enriched")

        assert response.status_code == 200
        body = response.json()
        assert body["data"]["head_to_head"]["total_matches"] == 0
        assert body["data"]["head_to_head"]["last_meeting"] is None

    def test_no_h2h_provider_returns_null(self):
        client = _build_client(None)

        response = client.get("/tournament/matches/arg-vs-ger/enriched")

        assert response.status_code == 200
        body = response.json()
        assert body["data"]["match"]["id"] == "arg-vs-ger"
        assert body["data"]["head_to_head"] is None


class TestEnrichedMatch404:
    """GET /matches/{id}/enriched returns 404 for non-existent matches."""

    def test_nonexistent_match_returns_404(self):
        client = _build_client(_MockH2HProvider())
        response = client.get("/tournament/matches/nonexistent/enriched")

        assert response.status_code == 404
        body = response.json()
        assert body["error"] == "Match not found"
        assert body["match_id"] == "nonexistent"

    def test_invalid_id_returns_404(self):
        client = _build_client(_MockH2HProvider())
        response = client.get("/tournament/matches/99999/enriched")

        assert response.status_code == 404


class TestEnrichedMatchProviderTimeout:
    """Provider timeout returns match data with head_to_head: null."""

    def test_provider_timeout_returns_null_h2h(self):
        h2h = _MockH2HProvider()
        h2h.set_fail(True)
        client = _build_client(h2h)

        response = client.get("/tournament/matches/arg-vs-ger/enriched")

        assert response.status_code == 200
        body = response.json()
        assert body["data"]["match"]["id"] == "arg-vs-ger"
        assert body["data"]["head_to_head"] is None
