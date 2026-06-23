# Tasks: Tournament Stats Dashboard

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~275-350 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | exception-ok |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full backend + frontend + tests | PR 1 | Single PR to main |

## Phase 1: Backend — Provider Interface

- [ ] 1.1 Add `ITournamentStatsProvider` ABC in `api/providers/interfaces.py` with `get_tournament_stats()`
- [ ] 1.2 Add `ITournamentStatsProvider` to `OpenfootballProvider` class declaration

## Phase 2: Backend — Aggregation Logic

- [ ] 2.1 Implement `get_tournament_stats()` — scan `YEAR_DIR_MAP`, aggregate champion counts
- [ ] 2.2 Add biggest-win detection (margin calc, keep top-5)
- [ ] 2.3 Add total goals accumulator + host record tracker (host + outcome)
- [ ] 2.4 Add 1950 champion fallback via final group standings
- [ ] 2.5 Cache result with 5-min TTL in `_parsed_cache`, stale-while-revalidate

## Phase 3: Backend — Endpoint

- [ ] 3.1 Add `GET /tournament-stats` handler in `api/routers/historical.py`
- [ ] 3.2 Wire `ITournamentStatsProvider` dependency; wrap in `{"data": ...}`

## Phase 4: Frontend — Types & API

- [ ] 4.1 Add `TournamentStats`, `ChampionCount`, `BiggestWin`, `HostRecord` in `web/src/lib/types.ts`
- [ ] 4.2 Add `getTournamentStats()` in `web/src/lib/api.ts` using `fetchHistorical()`

## Phase 5: Frontend — Stats Page

- [ ] 5.1 Create `web/src/routes/Stats.tsx` — champion leaderboard card (flag + count, top-10)
- [ ] 5.2 Add biggest wins card (top-5 margins, year + teams + score)
- [ ] 5.3 Add host records card (year, host, champion result)
- [ ] 5.4 Handle loading skeleton + error state ("Estadísticas no disponibles")

## Phase 6: Frontend — Navigation & Route

- [ ] 6.1 Add `{to: "/stats", label: "Estadísticas"}` entry in `Navigation.tsx`
- [ ] 6.2 Import `Stats` + add `{path: "stats", element: <Stats />}` in `main.tsx`

## Phase 7: Testing

- [ ] 7.1 Unit test: champion detection — Brazil 5, Germany 4, Italy 4, Argentina 3
- [ ] 7.2 Unit test: biggest win — 1954 Hungary 9-0 Korea, 1982 Hungary 10-1 El Salvador
- [ ] 7.3 Unit test: 1950 edge case — Uruguay champion without final match
- [ ] 7.4 Unit test: partial failure — one tournament skip doesn't crash
- [ ] 7.5 E2E: `GET /historical/tournament-stats`, assert response shape + champion counts
- [ ] 7.6 Frontend: render test for Stats page with mock data + empty/error state
