"""Tests for the bracket tree builder and /bracket endpoint."""

from fastapi import FastAPI
from fastapi.testclient import TestClient
from routers.tournament import router, init_router, build_bracket_tree, BRACKET_ROUND_RANGES


def _make_match(num: int, home: str = "", away: str = "", home_score=None, away_score=None, status: str = "scheduled", home_name: str | None = None, away_name: str | None = None) -> dict:
    """Build a minimal wheniskickoff-like match dict."""
    m: dict = {
        "slug": f"match-{num}",
        "num": num,
        "home": home,
        "away": away,
        "status": status,
    }
    if home_score is not None:
        m["score_home"] = home_score
    if away_score is not None:
        m["score_away"] = away_score
    if home_name:
        m["home_name"] = home_name
    if away_name:
        m["away_name"] = away_name
    return m


def _all_tbd_matches() -> list[dict]:
    """Generate all 32 knockout matches (including #103 third place) with all teams TBD."""
    return [_make_match(num) for num in range(73, 105)]


def _partial_matches() -> list[dict]:
    """Generate data where Round of 32 teams are determined but later rounds are TBD."""
    matches = _all_tbd_matches()
    # Populate R32 (73-88) with team codes
    for i, num in enumerate(range(73, 89)):
        home_code = f"team{chr(65 + (i * 2) % 26)}"
        away_code = f"team{chr(65 + (i * 2 + 1) % 26)}"
        matches[num - 73] = _make_match(
            num,
            home=home_code,
            away=away_code,
            home_name=f"Team {home_code.upper()}",
            away_name=f"Team {away_code.upper()}",
        )
    return matches


def _live_scores() -> list[dict]:
    """Generate data with live/final scores on some matches."""
    matches = _partial_matches()
    # Set scores on R32 matches
    for num in range(73, 81):
        idx = num - 73
        matches[idx] = _make_match(
            num,
            home=f"team{chr(65 + (idx * 2) % 26)}",
            away=f"team{chr(65 + (idx * 2 + 1) % 26)}",
            home_score=2,
            away_score=1,
            status="final",
            home_name=f"Team {chr(65 + (idx * 2) % 26)}",
            away_name=f"Team {chr(65 + (idx * 2 + 1) % 26)}",
        )
    return matches


class TestBuildBracketTree:
    """Unit tests for build_bracket_tree()."""

    def test_all_tbd(self):
        """Pre-knockout: all teams are null, all scores null."""
        result = build_bracket_tree(_all_tbd_matches())
        assert len(result) == 5  # 5 rounds
        match_count = sum(len(r["matches"]) for r in result)
        assert match_count == 31  # 31 matches (excluding third-place #103)

        for round_data in result:
            for m in round_data["matches"]:
                assert m["home_team"] is None
                assert m["away_team"] is None
                assert m["home_score"] is None
                assert m["away_score"] is None
                assert m["status"] == "scheduled"

    def test_partial_teams(self):
        """Post-groups: R32 determined, later rounds null."""
        result = build_bracket_tree(_partial_matches())
        r32 = result[0]
        assert r32["name"] == "round_of_32"
        assert all(m["home_team"] is not None for m in r32["matches"])
        assert all(m["away_team"] is not None for m in r32["matches"])

        # Later rounds should still be TBD
        for round_data in result[1:]:
            for m in round_data["matches"]:
                assert m["home_team"] is None
                assert m["away_team"] is None

    def test_live_scores(self):
        """Live/final scores appear correctly."""
        result = build_bracket_tree(_live_scores())
        r32 = result[0]
        for m in r32["matches"][:8]:
            assert m["home_score"] == 2
            assert m["away_score"] == 1
            assert m["status"] == "final"

        # Remaining R32 matches (still TBD, no scores)
        for m in r32["matches"][8:]:
            assert m["home_score"] is None
            assert m["away_score"] is None
            assert m["status"] == "scheduled"

    def test_next_match_pointers(self):
        """Winner-to-next-slot pointers follow bracket structure."""
        result = build_bracket_tree(_partial_matches())
        r32 = result[0]
        r16 = result[1]

        # R32 slot 0 and slot 1 should both point to R16 slot 0
        assert r32["matches"][0]["next_match_id"] == r16["matches"][0]["id"]
        assert r32["matches"][1]["next_match_id"] == r16["matches"][0]["id"]

        # R32 slot 2 and slot 3 should point to R16 slot 1
        assert r32["matches"][2]["next_match_id"] == r16["matches"][1]["id"]
        assert r32["matches"][3]["next_match_id"] == r16["matches"][1]["id"]

    def test_final_has_no_next(self):
        """Final match has no next_match_id."""
        result = build_bracket_tree(_all_tbd_matches())
        final_round = [r for r in result if r["name"] == "final"]
        assert len(final_round) == 1
        final_match = final_round[0]["matches"][0]
        assert final_match["next_match_id"] is None

    def test_excludes_third_place(self):
        """Third place match (#103) is excluded from bracket."""
        result = build_bracket_tree(_all_tbd_matches())
        all_matches = [m for r in result for m in r["matches"]]
        # Third place is num 103 in wheniskickoff, excluded
        assert len(all_matches) == 31

    def test_team_crests(self):
        """Determined teams get a crest URL."""
        result = build_bracket_tree(_partial_matches())
        r32 = result[0]
        for m in r32["matches"]:
            assert m["home_crest"] is not None
            assert m["away_crest"] is not None
            assert m["home_crest"].startswith("https://")
            assert m["away_crest"].startswith("https://")


class _MockOkProvider:
    """Provider returning full bracket data."""

    async def get_matches(self) -> list[dict]:
        return _partial_matches()

    async def get_groups(self) -> list[dict]: return []
    async def get_teams(self) -> list[dict]: return []
    async def get_venues(self) -> list[dict]: return []
    async def get_match(self, _: str) -> dict | None: return None
    async def get_tv(self) -> list[dict]: return []


class _MockErrorProvider:
    """Provider that raises on get_matches."""

    async def get_matches(self) -> list[dict]:
        msg = "wheniskickoff unavailable"
        raise RuntimeError(msg)

    async def get_groups(self) -> list[dict]: return []
    async def get_teams(self) -> list[dict]: return []
    async def get_venues(self) -> list[dict]: return []
    async def get_match(self, _: str) -> dict | None: return None
    async def get_tv(self) -> list[dict]: return []


def _build_client(provider) -> TestClient:
    app = FastAPI()
    init_router(provider)
    app.include_router(router)
    return TestClient(app)


class TestBracketEndpoint:
    """Integration tests for GET /bracket."""

    def test_returns_bracket_tree(self):
        client = _build_client(_MockOkProvider())
        response = client.get("/tournament/bracket")
        assert response.status_code == 200
        body = response.json()
        assert "data" in body
        rounds = body["data"]
        assert len(rounds) == 5
        assert all("name" in r and "label" in r and "matches" in r for r in rounds)
        # Round names
        names = [r["name"] for r in rounds]
        assert names == ["round_of_32", "round_of_16", "quarter_final", "semi_final", "final"]

    def test_503_on_provider_error(self):
        client = _build_client(_MockErrorProvider())
        response = client.get("/tournament/bracket")
        assert response.status_code == 503
        body = response.json()
        assert body["error"] == "provider_unavailable"

    def test_match_structure(self):
        client = _build_client(_MockOkProvider())
        response = client.get("/tournament/bracket")
        rounds = response.json()["data"]
        for r in rounds:
            for m in r["matches"]:
                assert "id" in m
                assert "round" in m
                assert "slot" in m
                assert "home_team" in m
                assert "away_team" in m
                assert "home_team_name" in m
                assert "away_team_name" in m
                assert "home_crest" in m
                assert "away_crest" in m
                assert "home_score" in m
                assert "away_score" in m
                assert "status" in m
                assert "next_match_id" in m
