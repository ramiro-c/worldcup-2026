# Design: StatsBomb Event Timeline

## Technical Approach

Frontend-only integration. The API already proxies all StatsBomb endpoints (`/historical/competitions`, `/matches/{id}/events`, `/matches/{id}/lineups`) with 5-min memory cache. The frontend handles the 2-hop discovery (competitions → matches → events/lineups), renders a timeline section inside `HistoricalMatchDetail.tsx`, and falls back gracefully when StatsBomb has no coverage for a match.

No backend changes. No new data dependencies.

## Architecture Decisions

### Decision: Frontend-only aggregation

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Backend aggregation endpoint | Centralizes 2-hop logic, cleaner frontend, but adds endpoint maintenance | Rejected — endpoints already exist, 3 sequential fetches with backend cache is fast enough, and the logic is purely presentational |
| Frontend chained fetches | Couples discovery logic to the component, but zero backend changes | **Chosen** — matches the existing pattern (frontend owns composition) |

### Decision: Component split (container + sub-components)

**Choice**: Create a `StatsBombTimeline` container component that owns all discovery state, delegating rendering to `Lineups`, `EventTimeline`, and `ShotMap` sub-components.

**Alternatives**: Inline everything in `HistoricalMatchDetail.tsx`.

**Rationale**: The 2-hop discovery + event parsing is ~100 lines. Inlining it would bloat the route file. Sub-components are independently testable. Follows existing pattern — `web/src/components/` for shared UI.

### Decision: SVG for shot map

**Choice**: Inline SVG pitch with `<circle>` elements for shot locations.

**Alternatives**: Canvas (faster for many dots, but overkill), D3 (heavy dependency for 10-30 dots), Leaflet (misuse of map API).

**Rationale**: SVG is declarative, needs zero dependencies, and matches Tailwind styling (fills, strokes). Pitch is a static rectangle — not worth a library.

### Decision: Match matching by team + date

**Choice**: After fetching StatsBomb matches for the season, match by comparing normalized team names and date against the openfootball match data.

**Rationale**: StatsBomb and openfootball use different match ID schemes. Team names are close enough (e.g., "Argentina" matches both) with normalization (lowercase, trimmed). Date comparison is a secondary filter for safety.

## Data Flow

```
HistoricalMatchDetail (year, matchId)
  │
  ├─ fetchHistoricalTournament(year)  ← existing, openfootball
  │
  └─ <StatsBombTimeline year={year} match={openfootballMatch}>
       │
       ├─ 1. GET /historical/competitions
       │     → find competition_id=43 (World Cup) + season_id matching year
       │
       ├─ 2. GET /historical/matches?competition_id=43&season_id={year}
       │     → find match by team names + date match
       │     → if not found → render "coverage not available"
       │
       ├─ 3. GET /historical/matches/{statsbomb_match_id}/events
       │     → parse into timeline (goals, cards, subs, shots)
       │
       └─ 3. GET /historical/matches/{statsbomb_match_id}/lineups
             → parse into starting XI + substitutes per team
```

All fetches use `fetchHistorical()` from `lib/api.ts` (same pattern as existing historical endpoints).

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `web/src/lib/types.ts` | Modify | Add `StatsBombCompetition`, `StatsBombEvent`, `StatsBombLineup`, `StatsBombShot` types |
| `web/src/lib/api.ts` | Modify | Add `getHistoricalCompetitions()`, `getHistoricalMatchEvents()`, `getHistoricalMatchLineups()` |
| `web/src/components/statsbomb/StatsBombTimeline.tsx` | Create | Container: 2-hop discovery, loading/empty/timeline states |
| `web/src/components/statsbomb/Lineups.tsx` | Create | Starting XI + subs grid per team |
| `web/src/components/statsbomb/EventTimeline.tsx` | Create | Minute-ordered events (goal, card, substitution) |
| `web/src/components/statsbomb/ShotMap.tsx` | Create | SVG pitch with shot dots (goal / saved / blocked / off target) |
| `web/src/routes/HistoricalMatchDetail.tsx` | Modify | Import and render `<StatsBombTimeline>` below existing scorers section |

## Interfaces / Contracts

```typescript
// Added to lib/types.ts
interface StatsBombCompetition {
  competition_id: number;
  season_id: number;
  competition_name: string;
  season_name: string;
}

interface StatsBombEvent {
  id: string;
  minute: number;
  type: "Goal" | "Card" | "Substitution" | "Shot";
  team: string;
  player: string;
  card_type?: "Yellow" | "Red";
  substitution?: { player_off: string; player_on: string };
  shot?: { x: number; y: number; outcome: "Goal" | "Saved" | "Blocked" | "Off Target" };
}

interface StatsBombLineup {
  team: string;
  starting_xi: { player: string; jersey_number: number; position: string }[];
  substitutes: { player: string; jersey_number: number }[];
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `matchByTeamsAndDate()` helper | Pure function, test team name normalization, date matching edge cases |
| Unit | Event parsing (raw StatsBomb JSON → timeline items) | Known match event files, assert expected timeline output |
| Component | `StatsBombTimeline` loading/empty/error states | Mock fetchHistorical, assert skeleton / "no coverage" / error fallback render |
| Component | `ShotMap` with mock shot data | Render SVG, assert circles match input coordinates + outcomes |
| E2E | Full 2-hop flow on a covered match | Playwright: navigate to a known covered match, assert timeline renders |

## Migration / Rollout

No data migration required. New feature is additive — existing UI is unchanged. Rollback: remove the `<StatsBombTimeline>` import and sub-components.

## Open Questions

- [ ] Confirm StatsBomb competition_id for Men's World Cup (expected: 43) and whether we need to handle Women's World Cup (expected: 72)
- [ ] Team name mismatch tolerance: normalize "USA" / "United States" / "United States of America" — need to check a few matches
