# Proposal: Tournament Stats Dashboard

## Intent

23 World Cups of data sit in openfootball but there's no aggregate view. Users can't answer "which country has the most titles?" or "biggest win in history?" without mentally combining data across pages.

## Scope

### In Scope
- Backend: `GET /historical/tournament-stats` — precomputed aggregation across all tournaments
- Frontend: `Stats.tsx` — card dashboard with champion leaderboard, tournament records, visual indicators
- Nav link + route for `/stats`
- API client function + types
- 5-min stale-while-revalidate caching

### Out of Scope
- D3/Chart.js (CSS-only indicators)
- Per-match StatsBomb data on this page
- Export/download
- Per-player drill-down pages

## Capabilities

### New Capabilities
- `tournament-stats`: Aggregate historical World Cup statistics (champion counts, biggest wins, total goals, host records)

### Modified Capabilities
- None

## Approach

Add `get_tournament_stats()` to `OpenfootballProvider` — iterates all 23 tournaments, precomputes wins/margins/goals per tournament, caches result with 5-min TTL. New endpoint in `historical.py`. Frontend fetches via existing `fetchHistorical` pattern, renders Tailwind card grid.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `api/providers/openfootball.py` | Modified | Add aggregation method |
| `api/routers/historical.py` | Modified | New endpoint |
| `api/providers/interfaces.py` | Modified | New interface |
| `web/src/routes/Stats.tsx` | New | Dashboard component |
| `web/src/components/Navigation.tsx` | Modified | Add "Estadísticas" link |
| `web/src/main.tsx` | Modified | Add `/stats` route |
| `web/src/lib/api.ts` | Modified | New fetch function |
| `web/src/lib/types.ts` | Modified | New types |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Aggregation too slow (scans all tournaments) | Med | 5-min TTL on parsed cache; skip tournaments on error |
| Parser misses edge cases in old formats | Low | Per-tournament try/except — skip, don't crash |

## Rollback Plan

Revert `historical.py` additions, remove `Stats.tsx` + nav link + route, revert types/api.

## Dependencies

None — all data from existing openfootball provider.

## Success Criteria

- [ ] `GET /historical/tournament-stats` returns champion counts, biggest wins, total goals, host records
- [ ] Stats page renders without loading skeleton — shows data or clear empty state
- [ ] Champion leaderboard matches known results (Brazil 5, Germany 4, Italy 4, Argentina 3)
- [ ] Navigation link visible on both desktop and mobile, routes to `/stats`
