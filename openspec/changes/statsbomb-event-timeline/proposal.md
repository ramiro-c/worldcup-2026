# Proposal: StatsBomb Event Timeline

## Intent

The historical match detail page currently shows only openfootball data (score, scorers). StatsBomb provides rich event-level coverage for 8 World Cup tournaments — lineups, goals, cards, subs, shot coordinates — but this data is never surfaced to users. Add a frontend integration so users can explore match events beyond the scoreline for StatsBomb-covered matches.

## Scope

### In Scope
- Frontend API client functions for StatsBomb endpoints (competitions, matches, events, lineups)
- HistoricalMatchDetail.tsx: StatsBomb discovery (2-hop lookup), lineups section, event timeline (goals/cards/subs by minute), basic shot map
- Empty state: "StatsBomb coverage not available" when match is not found
- Attribution: StatsBomb logo + link (already exists in Attribution.tsx)

### Out of Scope
- 360 freeze frame rendering
- xG visualizations
- openfootball page changes
- Backend changes (endpoints exist)

## Capabilities

### New Capabilities
- `statsbomb-event-timeline`: Match event timeline, lineups, and shot map from StatsBomb data, rendered inside the historical match detail page for covered matches

### Modified Capabilities
- None — first capability spec for this project

## Approach

1. Add `getHistoricalCompetitions()`, `getMatchEvents()`, `getMatchLineups()` to `lib/api.ts`
2. In `HistoricalMatchDetail.tsx`, on mount: fetch competitions → find match's competition/season → fetch events + lineups
3. Render lineups (starting XI + subs per team), event timeline (minute-ordered: goals, cards, subs), and a simple SVG shot map for goal locations
4. Cache results per match in component state; show skeleton while loading
5. Fall back to "StatsBomb coverage not available" if 2-hop lookup returns empty

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `web/src/lib/api.ts` | Modified | Add StatsBomb API functions |
| `web/src/routes/HistoricalMatchDetail.tsx` | Modified | Add StatsBomb timeline section |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|-------------|
| 2-hop lookup latency (2 sequential fetches) | Low | Provider has 5-min cache; frontend shows skeletons |

## Rollback Plan

Remove the StatsBomb section from `HistoricalMatchDetail.tsx` and the new API functions from `lib/api.ts`.

## Dependencies

- StatsBomb endpoints in `api/routers/historical.py` (already exist)
- `api/providers/statsbomb.py` caching layer (already exists)

## Success Criteria

- [ ] Historical match with StatsBomb coverage shows lineups, event timeline, and shot map
- [ ] Historical match without StatsBomb coverage shows "coverage not available" notice
- [ ] All existing tests pass (pytest + vitest + playwright)
