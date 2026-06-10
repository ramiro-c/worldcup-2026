import time
from typing import Any
import httpx
from providers.interfaces import IEventDataProvider

BASE_URL = "https://raw.githubusercontent.com/statsbomb/open-data/master"
CACHE_TTL = 300


class StatsBombProvider(IEventDataProvider):
    def __init__(self):
        self._cache: dict[str, tuple[float, Any]] = {}

    async def _fetch(self, path: str) -> Any:
        now = time.time()
        if path in self._cache:
            ts, data = self._cache[path]
            if now - ts < CACHE_TTL:
                return data

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(f"{BASE_URL}/{path}", timeout=10)
                resp.raise_for_status()
                data = resp.json()
                self._cache[path] = (now, data)
                return data
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    self._cache[path] = (now, [])
                    return []
                if path in self._cache:
                    return self._cache[path][1]
                return []
            except Exception:
                if path in self._cache:
                    return self._cache[path][1]
                return []

    async def get_competitions(self) -> list[dict]:
        return await self._fetch("data/competitions.json")

    async def get_matches(self, competition_id: int, season_id: int) -> list[dict]:
        return await self._fetch(f"data/matches/{competition_id}/{season_id}.json")

    async def get_events(self, match_id: int) -> list[dict]:
        return await self._fetch(f"data/events/{match_id}.json")

    async def get_lineups(self, match_id: int) -> list[dict]:
        return await self._fetch(f"data/lineups/{match_id}.json")

    async def get_three_sixty(self, match_id: int) -> list[dict]:
        return await self._fetch(f"data/three-sixty/{match_id}.json")
