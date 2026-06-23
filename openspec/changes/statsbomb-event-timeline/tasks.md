# Tasks: StatsBomb Event Timeline

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~620 |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types, API fetchers, match helper | PR 1 | Foundation — base=`main` |
| 2 | StatsBombTimeline, Lineups, EventTimeline, ShotMap | PR 1 | Components — stacked on unit 1 |
| 3 | Integration into HistoricalMatchDetail + tests | PR 1 | Finalize — stacked on unit 2 |

## Phase 1: Foundation

- [ ] 1.1 Add StatsBomb types to `web/src/lib/types.ts`: `StatsBombCompetition`, `StatsBombEvent`, `StatsBombLineup`, `StatsBombShot`
- [ ] 1.2 Add `getHistoricalCompetitions()`, `getHistoricalMatchEvents()`, `getHistoricalMatchLineups()` to `web/src/lib/api.ts`
- [ ] 1.3 Create `matchByTeamsAndDate()` helper that matches an openfootball match to StatsBomb match by normalized team names + date

## Phase 2: Sub-Components

- [ ] 2.1 Create `web/src/components/statsbomb/Lineups.tsx` — starting XI + substitutes per team, grouped by position when available
- [ ] 2.2 Create `web/src/components/statsbomb/EventTimeline.tsx` — minute-ordered goals, cards, substitutions with type icons
- [ ] 2.3 Create `web/src/components/statsbomb/ShotMap.tsx` — SVG pitch outline with `<circle>` dots per shot; goals distinct from non-goals

## Phase 3: Container + Integration

- [ ] 3.1 Create `web/src/components/statsbomb/StatsBombTimeline.tsx` — container orchestrating 2-hop discovery, loading skeleton, error/retry, empty "no coverage" fallback
- [ ] 3.2 Integrate `<StatsBombTimeline>` into `HistoricalMatchDetail.tsx` below existing scorers section
- [ ] 3.3 Add inline StatsBomb attribution below the timeline section (reuse existing Attribution component or add a section-level reference)

## Phase 4: Testing

- [ ] 4.1 Unit tests for `matchByTeamsAndDate()` — team name normalization, date matching edge cases
- [ ] 4.2 Component tests for `StatsBombTimeline` — loading skeleton, empty state, error+retry, timeline render with mock data
- [ ] 4.3 Component tests for `ShotMap` — renders correct number of dots, goal vs non-goal colors
- [ ] 4.4 Component tests for `Lineups` — starting XI sorted, substitutes section, graceful fallback when no position data
- [ ] 4.5 Component tests for `EventTimeline` — events sort by minute, each type renders correct icon

## Phase 5: Cleanup

- [ ] 5.1 Verify all existing tests pass (`pnpm test` + `uv run pytest`)
- [ ] 5.2 Manual smoke test on a covered match (e.g., 2014 final) and an uncovered match (e.g., 1962 group stage)
