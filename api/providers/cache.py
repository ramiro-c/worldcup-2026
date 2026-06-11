from __future__ import annotations
import time
from typing import Any


class MemoryCache:
    """Cache en memoria con stale-while-revalidate y stats.

    - Sirve datos frescos si están dentro del TTL
    - Devuelve datos vencidos si el upstream falla (stale-while-revalidate)
    - Lleva contadores de hits, misses y stale-hits
    """

    def __init__(self, default_ttl: float = 300):
        self._default_ttl = default_ttl
        self._store: dict[str, tuple[float, Any]] = {}
        self._hits = 0
        self._misses = 0
        self._stale_hits = 0

    def get(self, key: str) -> tuple[bool, Any]:
        """Retorna (is_fresh, value).

        is_fresh=True  → dato dentro del TTL
        is_fresh=False → dato vencido pero disponible (stale)
        value=None     → no hay dato en caché
        """
        entry = self._store.get(key)
        if entry is None:
            self._misses += 1
            return False, None

        ts, value = entry
        if time.time() - ts < self._default_ttl:
            self._hits += 1
            return True, value

        self._stale_hits += 1
        return False, value

    def set(self, key: str, value: Any) -> None:
        self._store[key] = (time.time(), value)

    def clear(self, prefix: str | None = None) -> None:
        if prefix is None:
            self._store.clear()
        else:
            self._store = {k: v for k, v in self._store.items() if not k.startswith(prefix)}

    @property
    def stats(self) -> dict:
        total = self._hits + self._misses + self._stale_hits
        return {
            "hits": self._hits,
            "misses": self._misses,
            "stale_hits": self._stale_hits,
            "size": len(self._store),
            "hit_rate": round(self._hits / total, 3) if total else 0.0,
        }

    def size(self) -> int:
        return len(self._store)
