# Design: Tournament Stats Dashboard

## Technical Approach

Add `get_tournament_stats()` to `OpenfootballProvider` that scans all 23 tournament years, aggregates champion counts / biggest wins / total goals / host records, and caches the result with 5-min TTL. New `ITournamentStatsProvider` interface. Frontend renders a Tailwind card grid at `/stats`.

## Architecture Decisions

### Decision: Aggregation strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Runtime scan with result cache | Follows existing `get_head_to_head` pattern; reuses per-tournament parsed cache (~instant on subsequent calls). First call costs 23 scans. | **Selected** |
| Precompute / background job | Adds cron/db dependency. No infra for it today. Over-engineered for 23 items. | Rejected |

**Rationale**: `get_tournament()` already caches parsed data per-year with 5-min TTL. Scanning 23 tournaments is the established pattern (see `get_head_to_head`, `get_team_matches`). The aggregate result gets its own cache key so repeated calls avoid re-scanning within the TTL.

### Decision: Champion detection

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Parse "final" stage matches | Simple but misses 1950 (no final match) | **Selected** — with fallback |
| Parse entire knockout bracket | More accurate but complex | Over-engineered |

**Rationale**: 1950 had no final (decided by final group). We detect it separately by picking the top team in the final group standings. For all other tournaments, the match with `stage == "final"` yields the champion via `team.is_winner`.

### Decision: New interface vs extending

| Option | Tradeoff | Decision |
|--------|----------|----------|
| New `ITournamentStatsProvider` | Follows existing granular interface pattern. `OpenfootballProvider` implements it. | **Selected** |
| Add to `IHistoricalDataProvider` | Works, but mixes concerns (tournament list vs statistics) | Rejected |

### Decision: UI layout

Card grid with three sections — champion leaderboard, tournament records, host champions. No charts per scope. Follows the Tailwind card pattern already in use (see `Bracket.tsx` cards).

## Data Flow

```
GET /historical/tournament-stats
  → historical_router.get_tournament_stats()
    → provider.get_tournament_stats()
      → check _parsed_cache["tournament_stats"] — return if fresh
      → for year in YEAR_DIR_MAP:
          get_tournament(year) — hits per-tournament parsed cache
          aggregate: champion, biggest_win, goals, host_record
      → store in _parsed_cache["tournament_stats"] with 5-min TTL
      → return aggregated dict
    → wrap in {"data": result}
  → Stats.tsx fetches via getTournamentStats()
    → renders card sections
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `api/providers/interfaces.py` | Modify | Add `ITournamentStatsProvider` ABC with `get_tournament_stats()` |
| `api/providers/openfootball.py` | Modify | Implement `get_tournament_stats()` — scan 23 tournaments, aggregate, cache |
| `api/routers/historical.py` | Modify | Add `GET /tournament-stats` endpoint; wire new provider type |
| `api/main.py` | Modify | No change needed — provider already wired; type annotation extends automatically |
| `web/src/lib/types.ts` | Modify | Add `TournamentStats` / `ChampionCount` / `BiggestWin` / `HostRecord` types |
| `web/src/lib/api.ts` | Modify | Add `getTournamentStats()` using `fetchHistorical` |
| `web/src/routes/Stats.tsx` | Create | Dashboard component — cards for champion counts, records, hosts |
| `web/src/components/Navigation.tsx` | Modify | Add `{to: "/stats", label: "Estadísticas"}` after Historial |
| `web/src/main.tsx` | Modify | Import `Stats`, add `{path: "stats", element: wrapBoundary(<Stats />)}` |

## Interfaces / Contracts

```python
class ITournamentStatsProvider(ABC):
    @abstractmethod
    async def get_tournament_stats(self) -> dict:
        """Returns: {
            "champion_counts": [{"country": str, "count": int}, ...],
            "biggest_wins": [{"year": int, "team1": str, "team2": str,
                              "score": str, "margin": int}, ...],
            "total_goals": {"overall": int, "avg_per_tournament": float},
            "host_records": [{"year": int, "host": str, "champion": str}, ...]
        }"""
```

```typescript
export interface TournamentStats {
  champion_counts: Array<{ country: string; count: number }>;
  biggest_wins: Array<{
    year: number; team1: string; team2: string;
    score: string; margin: number; stage: string;
  }>;
  total_goals: { overall: number; avg_per_tournament: number };
  host_records: Array<{ year: number; host: string; champion: string }>;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Champion detection for known years | Verify Brazil 5, Germany 4, Italy 4, Argentina 3 |
| Unit | Biggest win calculation | 1954 Hungary 9-0 Korea, 1982 Hungary 10-1 El Salvador |
| Unit | 1950 edge case (no final match) | Verify Uruguay detected as champion |
| E2E | `GET /historical/tournament-stats` returns wrapped data | Call endpoint, assert response shape |
| E2E | Stats page renders cards | Load `/stats`, verify champion leaderboard visible |

## Migration / Rollout

No migration required. New endpoint and route only — no existing consumers affected.

## Open Questions

- [ ] 1950 champion detection: does openfootball's data include the decisive Uruguay vs Brazil match in a way the parser captures as "final"? If not, fallback logic needed.
