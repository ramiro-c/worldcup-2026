from typing import Any
import httpx
from providers.interfaces import IEventDataProvider
from providers.cache import MemoryCache

BASE_URL = "https://raw.githubusercontent.com/statsbomb/open-data/master"


class StatsBombProvider(IEventDataProvider):
    def __init__(self):
        self._cache = MemoryCache(default_ttl=300)

    async def _fetch(self, path: str) -> Any:
        is_fresh, cached = self._cache.get(path)
        if is_fresh:
            return cached

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(f"{BASE_URL}/{path}", timeout=10)
                resp.raise_for_status()
                data = resp.json()
                self._cache.set(path, data)
                return data
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    self._cache.set(path, [])
                    return []
                if cached is not None:
                    return cached
                return []
            except Exception:
                if cached is not None:
                    return cached
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
