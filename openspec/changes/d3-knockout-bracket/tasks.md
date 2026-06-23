# Tasks: D3 Knockout Bracket

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 500–800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (API) → PR 2 (Frontend) → PR 3 (E2E) |
| Delivery strategy | exception-ok |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | API bracket endpoint + unit tests | PR 1 | Base: main. Backend only, testable standalone |
| 2 | D3 component, types, Bracket.tsx wiring | PR 2 | Base: main. Depends on PR 1 for endpoint |
| 3 | Playwright E2E tests | PR 3 | Base: main. Depends on PR 2 for D3 in DOM |

## Phase 1: API Backend

- [ ] 1.1 Add `build_bracket_tree()` in `api/routers/tournament.py` mapping wheniskickoff matches #73–#104 into `BracketRound[]` with `winner_next` pointers
- [ ] 1.2 Add `GET /bracket` endpoint returning structured tree; handle wheniskickoff errors → 503
- [ ] 1.3 Optionally expose `get_bracket` in `api/providers/interfaces.py` if pattern requires

## Phase 2: Frontend Foundation

- [ ] 2.1 Install `d3` in `web/package.json`
- [ ] 2.2 Add `BracketRound`, `BracketMatch`, `BracketSlot` types to `web/src/lib/types.ts`
- [ ] 2.3 Add `getBracket(): Promise<BracketRound[]>` to `web/src/lib/api.ts`

## Phase 3: D3 BracketTree Component

- [ ] 3.1 Create `BracketTree.tsx` with D3 `tree().nodeSize()` layout, SVG viewBox, left-to-right transform
- [ ] 3.2 Render round labels (R32, R16, QF, SF, Final) as column headers
- [ ] 3.3 Render match slots with crest (24px), 3-letter code, score (or dash for null)
- [ ] 3.4 Draw bezier connector lines between match → `next_match_id` slot
- [ ] 3.5 Pre-knockout state: dashed border + "TBD" for null teams, dash for scores
- [ ] 3.6 Hover handler: walk next-match chain → toggle `.highlight` / `opacity:0.3` via CSS data-attributes

## Phase 4: Integration

- [ ] 4.1 Rewrite `Bracket.tsx`: fetch hook → loading skeleton → error+retry → `BracketTree`

## Phase 5: Tests

- [ ] 5.1 Unit tests: `build_bracket_tree()` with all-TBD, partial teams, live scores, final scores
- [ ] 5.2 Unit tests: D3 hierarchy from bracket response produces correct 32-node count
- [ ] 5.3 E2E: SVG snapshot, hover team → verify `.highlight` class, loading skeleton visible, error+retry flow
