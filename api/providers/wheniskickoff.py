from typing import Any
import httpx
from providers.interfaces import ITournamentDataProvider
from providers.cache import MemoryCache

BASE_URL = "https://wheniskickoff.com/data/v1"


class WheniskickoffProvider(ITournamentDataProvider):
    def __init__(self):
        self._cache = MemoryCache(default_ttl=300)

    async def _fetch(self, endpoint: str) -> list[dict]:
        is_fresh, cached = self._cache.get(endpoint)
        if is_fresh:
            return cached

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(f"{BASE_URL}/{endpoint}", timeout=10)
                resp.raise_for_status()
                data = resp.json()["data"]
                self._cache.set(endpoint, data)
                return data
            except Exception:
                if cached is not None:
                    return cached
                return []

    async def get_groups(self) -> list[dict]:
        return await self._fetch("groups.json")

    async def get_teams(self) -> list[dict]:
        return await self._fetch("teams.json")

    async def get_venues(self) -> list[dict]:
        return await self._fetch("venues.json")

    async def get_matches(self) -> list[dict]:
        return await self._fetch("matches.json")

    async def get_match(self, match_id: str) -> dict | None:
        matches = await self.get_matches()
        for match in matches:
            if match.get("id") == match_id:
                return match
        return None

    async def get_tv(self) -> list[dict]:
        return await self._fetch("tv.json")
