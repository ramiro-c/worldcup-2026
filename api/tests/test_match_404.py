"""Integration tests for the match lookup endpoint returning 404."""

from fastapi import FastAPI
from fastapi.testclient import TestClient
from routers.tournament import router, init_router


class _MockProvider:
    """Mock provider that only has one match and rejects empty IDs."""

    async def get_match(self, match_id: str) -> dict | None:
        if not match_id or not match_id.strip():
            return None
        if match_id in ("existing-match",):
            return {
                "slug": "existing-match",
                "num": 1,
                "home": "slo",
                "away": "usa",
                "date": "2026-06-14",
                "status": "scheduled",
            }
        return None

    async def get_groups(self) -> list[dict]:
        return []

    async def get_teams(self) -> list[dict]:
        return []

    async def get_venues(self) -> list[dict]:
        return []

    async def get_matches(self) -> list[dict]:
        return [
            {
                "slug": "existing-match",
                "num": 1,
                "home": "slo",
                "away": "usa",
                "date": "2026-06-14",
                "status": "scheduled",
            }
        ]

    async def get_tv(self) -> list[dict]:
        return []


def _build_client() -> TestClient:
    app = FastAPI()
    init_router(_MockProvider())
    app.include_router(router)
    return TestClient(app)


class TestMatchNotFound:
    """GET /matches/{id} returns 404 for non-existent matches."""

    def test_nonexistent_match_returns_404(self):
        client = _build_client()
        response = client.get("/tournament/matches/nonexistent-slug")

        assert response.status_code == 404
        body = response.json()
        assert body["error"] == "Match not found"
        assert body["match_id"] == "nonexistent-slug"

    def test_nonexistent_numeric_id_returns_404(self):
        client = _build_client()
        response = client.get("/tournament/matches/99999")

        assert response.status_code == 404
        body = response.json()
        assert body["error"] == "Match not found"
        assert body["match_id"] == "99999"

    def test_existing_match_returns_200(self):
        client = _build_client()
        response = client.get("/tournament/matches/existing-match")

        assert response.status_code == 200
        body = response.json()
        assert "data" in body
        assert body["data"]["id"] == "existing-match"
