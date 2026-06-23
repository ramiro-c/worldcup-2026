# Tasks: Enrichment Match Detail

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~450 (all additive) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (size:exception) |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | API + frontend in one PR | PR 1 | Single PR; 800-line exception accepted by maintainer. All tasks below are phases within this PR. |

## Phase 1: Alias Registration

- [ ] 1.1 Add `"cape verde islands": "Cape Verde"` and variants to `TEAM_ALIASES` in `api/providers/aliases.py`
- [ ] 1.2 Add `"curacao": "Curaçao"` and variants to `TEAM_ALIASES` in `api/providers/aliases.py`

## Phase 2: API Endpoint

- [ ] 2.1 Add `summarize_h2h(matches, team1, team2)` helper in `api/routers/tournament.py` — returns `total_matches`, `team1_wins`, `team2_wins`, `draws`, `team1_goals`, `team2_goals`, `last_meetings`, `last_meeting`
- [ ] 2.2 Add `GET /tournament/matches/{match_id}/enriched` endpoint — calls `get_match` + `openfootball.get_head_to_head` + `summarize_h2h`, returns `{ match, head_to_head }`
- [ ] 2.3 Handle 404 when match_id not found; handle openfootball timeout gracefully returning `head_to_head: null`

## Phase 3: Frontend Types & Client

- [ ] 3.1 Add `HeadToHeadMeeting`, `HeadToHeadSummary`, and `EnrichedMatchResponse` types to `web/src/lib/types.ts`
- [ ] 3.2 Add `fetchMatchEnriched(id)` to `web/src/lib/api.ts`

## Phase 4: HeadToHeadCard Component

- [ ] 4.1 Create `web/src/components/HeadToHeadCard.tsx` — compact card showing total matches, team1/team2 wins, draws, last 5 meetings, last meeting summary
- [ ] 4.2 Render empty state ("Sin enfrentamientos previos", muted styling) when no history
- [ ] 4.3 Add "Ver historial completo" link pointing to `/head-to-head/{home}/{away}`

## Phase 5: Match.tsx Integration

- [ ] 5.1 Import `fetchMatchEnriched` and `useAsync` in `web/src/routes/Match.tsx`; add parallel one-shot fetch for enriched data
- [ ] 5.2 Replace existing "Historial" link with `HeadToHeadCard` rendered below score section
- [ ] 5.3 Ensure H2H fetch is non-blocking (no spinner, card appears once data arrives; error → no H2H card)

## Phase 6: Tests

- [ ] 6.1 Write unit tests for `summarize_h2h` — known fixture data, empty input, single match, draw/penalty cases
- [ ] 6.2 Write integration test for `/matches/{id}/enriched` — 200 with H2H, 404, no-history empty state, provider timeout
- [ ] 6.3 Write `HeadToHeadCard.test.tsx` — renders summary data, renders empty state, link navigates correctly
