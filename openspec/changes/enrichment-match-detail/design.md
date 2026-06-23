# Design: Enrichment Match Detail

## Technical Approach

Add a unified `GET /tournament/matches/{match_id}/enriched` endpoint that returns the existing match object plus a `head_to_head` summary computed from openfootball historical data. On the frontend, add a parallel one-shot fetch (no polling) alongside the existing match polling, and render a compact `HeadToHeadCard` component below the score section.

## Architecture Decisions

### Decision: Single endpoint vs separate fetches

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Single [/enriched]** | One endpoint, clean API; match data in response is redundant with polled data (~100 bytes overhead once) | ✅ **Chosen** — simpler API surface, single call warms cache |
| Separate `/matches/{id}/h2h` | No redundancy, but another endpoint to maintain | Rejected — over-engineering for marginal gain |

Frontend uses `useAsync` (one-shot) for the enriched call and extracts only the `head_to_head` field. Match data continues to poll via existing `usePolling`/`getMatch`.

### Decision: Where alias resolution lives

Alias resolution stays inside `OpenfootballProvider.get_head_to_head` (already calls `resolve_team_name` for both team names and historical match names). The enriched endpoint receives team names from wheniskickoff data (`home_name`/`away_name` in `map_match`), which are already in a format compatible with openfootball's naming. No additional alias logic needed in `tournament.py`.

### Decision: Enriched response structure

The `head_to_head` field is a **summary object** (not raw match array) computed by a `summarize_h2h` helper that takes the raw historical matches + the two team names and produces a digest suitable for a card component.

### Decision: H2H card as separate component

New `web/src/components/HeadToHeadCard.tsx` — avoids bloating `Match.tsx`, testable in isolation. Rendered conditionally below the score section and above venue details.

### Decision: Caching strategy for enriched endpoint

No additional cache layer. `OpenfootballProvider` already caches each parsed tournament with `MemoryCache` (300s TTL). The first `GET /enriched` call warms the per-year cache; subsequent calls within 5 min are instant. H2H data is static by nature.

## Data Flow

    Browser                          FastAPI                        Openfootball GitHub
      │                                │                                │
      ├─ usePolling for match ──────►  │  GET /matches/{id} ───────────►│ (wheniskickoff)
      │  (60s interval, live only)    │  ◄──── match JSON ──────────────│
      │                                │                                │
      ├─ useAsync for H2H ──────────► │  GET /matches/{id}/enriched     │
      │  (once on mount)              │    ├─ get_match(id)             │ (wheniskickoff)
      │                               │    ├─ get_head_to_head(n1, n2) │
      │                               │    ├─ summarize_h2h()          │
      │                               │    └─ { match + h2h_summary }  │
      │  ◄── { match, head_to_head } ─│                                │
      │                                │                                │
      ├─ Merge h2h into enrichedMatch  │                                │
      │  (useMemo)                     │                                │
      └─ Render HeadToHeadCard ──────► │                                │

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `api/routers/tournament.py` | Modify | New `GET /matches/{match_id}/enriched` endpoint + `summarize_h2h()` helper |
| `api/providers/aliases.py` | Modify | Add aliases for Cape Verde Islands, Curaçao |
| `web/src/lib/api.ts` | Modify | New `fetchMatchEnriched(id)` function |
| `web/src/lib/types.ts` | Modify | New `HeadToHeadSummary` type |
| `web/src/components/HeadToHeadCard.tsx` | Create | Inline H2H card component |
| `web/src/routes/Match.tsx` | Modify | Parallel fetch + render HeadToHeadCard |

## Interfaces / Contracts

**Response shape** (`GET /tournament/matches/{match_id}/enriched`):

```python
# summarize_h2h(matches: list[dict], team1: str, team2: str) -> dict
{
    "total_matches": 12,
    "team1_wins": 5,    # home team wins in their meetings
    "team2_wins": 4,    # away team wins
    "draws": 3,
    "team1_goals": 15,
    "team2_goals": 12,
    "last_meetings": [
        {
            "year": 2022,
            "stage": "final",
            "score": "3-3",
            "winner": "Argentina",  # None if draw
            "penalty_score": "4-2"
        }
    ],
    "last_meeting": { ... }  # most recent (also included in last_meetings[0])
}
```

**TypeScript type**:

```typescript
interface HeadToHeadSummary {
  total_matches: number;
  team1_wins: number;
  team2_wins: number;
  draws: number;
  team1_goals: number;
  team2_goals: number;
  last_meetings: Array<{
    year: number;
    stage: string;
    score: string;
    winner: string | null;
    penalty_score?: string;
  }>;
  last_meeting: (typeof last_meetings)[0] | null;
}
```

Empty state: all counts are `0`, `last_meetings` is `[]`, `last_meeting` is `null`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `summarize_h2h` with known fixture data | Verify win/draw counts, last_meetings dedup, empty input |
| Unit | `HeadToHeadCard` renders summary + empty state | Vitest + render test |
| E2E | Navigate to a match page, H2H card appears | Browser test (agent-browser) |

## Migration / Rollout

No migration required. New endpoint is additive — existing `GET /matches/{id}` unchanged. Frontend deploys once, new card appears where data is available.

## Open Questions

- [ ] None — scope is well-defined in proposal, patterns are established in codebase.
