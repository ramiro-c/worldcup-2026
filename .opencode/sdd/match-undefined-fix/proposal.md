# Proposal: match-undefined-fix

## Intent

Three bugs make match navigation broken: (1) backend returns HTTP 200 with null instead of 404 for non-existent matches; (2) back button uses hardcoded `/fixtures` instead of browser history; (3) fixture cards are unclickable plain `<div>`s, blocking match detail from the main list. Users see "Undefined" and get sent to wrong pages.

## Scope

### In Scope
- Backend returns HTTP 404 when `get_match` finds no match
- Match.tsx uses `navigate(-1)` with `/fixtures` fallback for all back buttons
- Fixtures.tsx wraps match cards in `<Link to={`/match/${match.id}`}>`
- Match.tsx validates match ID before fetch (rejects empty/invalid)
- Loading state prevents 404 flash on initial render

### Out of Scope
- Historical match ID collisions (empty slug + num) — separate concern
- Polling optimization — current 60s interval is acceptable

## Capabilities

### New Capabilities
- None (bug fixes, no new spec-level capability)

### Modified Capabilities
- None (behavior changes are fixes, not spec contract changes)

## Approach

Defense in depth across three layers. **Backend**: `get_match` raises `HTTPException(404)` when provider returns `None`. `fetchApi` treats non-2xx as error, surfacing 404 to the UI. **Frontend navigation**: replace `<Link to="/fixtures">` in Match.tsx (lines 261, 279, 296) with `navigate(-1)` and `/fixtures` fallback when history stack is shallow. **Entry points**: wrap Fixtures cards in `<Link>`, add `useEffect` guard that redirects empty/invalid IDs before fetch.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `api/routers/tournament.py` | Modified | 404 response when match not found |
| `api/providers/wheniskickoff.py` | Modified | Validate match_id before scanning |
| `web/src/routes/Match.tsx` | Modified | navigate(-1), ID validation, loading state |
| `web/src/routes/Fixtures.tsx` | Modified | Wrap cards in Link |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Polling abort race on redirect | Low | usePolling aborts on unmount; guard fires before fetch |
| Stale shared URLs hit 404 | Low | navigate(-1) with /fixtures fallback is correct UX |
| API contract change for get_match | Low | Only client is this web app |

## Rollback Plan

Frontend navigation and Fixtures changes are additive — revert Match.tsx and Fixtures.tsx if bugs. Backend 404 change is safe (no caller depends on 200-with-null).

## Dependencies

None.

## Success Criteria

- [ ] Backend returns HTTP 404 for non-existent match IDs
- [ ] Back button navigates to previous page (fallback: /fixtures)
- [ ] Fixtures cards are clickable and link to /match/:id
- [ ] Empty/invalid IDs redirect to /fixtures before fetch
- [ ] Loading state shown during fetch, no "not found" flash
