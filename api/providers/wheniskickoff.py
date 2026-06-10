import time
from typing import Any
import httpx

BASE_URL = "https://wheniskickoff.com/data/v1"
CACHE_TTL = 300  # 5 minutes


class WheniskickoffProvider:
    def __init__(self):
        self._cache: dict[str, tuple[float, list[dict]]] = {}

    async def _fetch(self, endpoint: str) -> list[dict]:
        now = time.time()
        if endpoint in self._cache:
            ts, data = self._cache[endpoint]
            if now - ts < CACHE_TTL:
                return data

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(f"{BASE_URL}/{endpoint}", timeout=10)
                resp.raise_for_status()
                data = resp.json()["data"]
                self._cache[endpoint] = (now, data)
                return data
            except Exception:
                if endpoint in self._cache:
                    return self._cache[endpoint][1]
                return []

    async def get_groups(self) -> list[dict]:
        return await self._fetch("groups.json")

    async def get_teams(self) -> list[dict]:
        return await self._fetch("teams.json")

    async def get_venues(self) -> list[dict]:
        return await self._fetch("venues.json")

    async def get_matches(self) -> list[dict]:
        return await self._fetch("matches.json")

    async def get_tv(self) -> list[dict]:
        return await self._fetch("tv.json")
