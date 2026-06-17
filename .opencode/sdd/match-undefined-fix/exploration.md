# Exploration: match-undefined-fix

## Current State

`/match/:id` accepts ANY string as `:id`. The route resolves the param, calls `getMatch(id)` which hits `GET /api/tournament/matches/:id` (FastAPI), which calls `provider.get_match(match_id)` on the wheniskickoff provider, which scans all matches and returns the first one whose `slug`, `num`, or `id` equals the requested id — or `None` if nothing matches.

When the provider returns `None`, the API still returns HTTP 200 with `{"data": null}` (not a 404). The frontend's `fetchApi` then resolves to `null`, `usePolling` sets `data: null`, and `Match.tsx` falls into the `if (!enrichedMatch)` branch — a 404 page saying **"Partido no encontrado"** with a hard `<Link to="/fixtures">` for the back action.

The ID format the API can return is **inconsistent**: `map_match` and `map_matches` in `tournament.py` compute `id = raw.get("slug", str(raw.get("num", "")))`. Matches without a `slug` end up with a numeric string id. The single-match lookup tolerates both formats, so the API is internally consistent — but **matches with neither `slug` nor `num` get id = `""`** (empty string), and the single-match endpoint doesn't validate the input.

Three real entry points exist for `/match/:id`:
- `web/src/routes/Home.tsx:61` — `<Link to={`/match/${match.id}`}>` on the upcoming-matches cards
- `web/src/routes/VenueDetail.tsx:165` — `<Link to={`/match/${m.id}`}>` on the venue's match list
- `web/src/components/LiveWidget.tsx:33` — `<Link to={`/match/${matchId}`}>` on live cards

`Fixtures.tsx` (lines 259-312) **does NOT link to matches at all** — the match card is a plain `<div>`, not a `<Link>`. So if a user is browsing the fixture list there is no entry into a match detail page from that view.

The "back" button in `Match.tsx` (lines 295-313, 261-266, 278-283) is always a `<Link to="/fixtures">` — it does not use `navigate(-1)` or browser history. Whether the user came from Home, Venues, LiveWidget, or typed the URL directly, "Volver al fixture" always sends them to `/fixtures`. That is the "back goes to another tab" behavior.

## Affected Areas

- `web/src/routes/Match.tsx:75` — `useParams<{ id: string }>()` accepts any string; no validation.
- `web/src/routes/Match.tsx:84-89` — `usePolling` polls `getMatch(id!, signal)` even if the id is obviously bad (e.g. empty, or matches a TBD pattern).
- `web/src/routes/Match.tsx:271-286` — The "404" / "Partido no encontrado" branch always links to `/fixtures` instead of using browser history.
- `web/src/routes/Match.tsx:295-313` — Main "Volver al fixture" is a hard route, not `navigate(-1)`.
- `web/src/lib/api.ts:32-34` — `getMatch` returns `Match | null`; callers must remember to check.
- `api/routers/tournament.py:298-301` — `/matches/{match_id}` returns 200 with `{"data": null}` instead of 404.
- `api/routers/tournament.py:222-266` (`map_match`) and `172-219` (`map_matches`) — id can resolve to `""` when `slug` and `num` are both missing.
- `api/providers/wheniskickoff.py:61-68` — `get_match` loops over ALL matches for every lookup. Performance issue and silent failures when `match_id` is empty (matches any match with empty slug/num/id).
- `web/src/routes/Fixtures.tsx:259-312` — match cards are not clickable; users have no way to enter a match detail from the main fixture list.
- `web/src/routes/Home.tsx:60-80`, `VenueDetail.tsx:163-189`, `LiveWidget.tsx:32-67` — all link to `/match/${match.id}` from in-memory data; safe in normal flow, broken for any user that types/refreshes/pastes a URL with a stale id.

## Approaches

### 1. Defense in depth — backend 404 + frontend history back + entry validation
**Backend** (api/routers/tournament.py):
- Make `get_match` raise `HTTPException(404)` when `provider.get_match` returns `None`.
- `fetchApi` in the web app already treats any non-2xx as an error, so this naturally surfaces a 404 to the UI.

**Frontend** (web/src/routes/Match.tsx):
- Replace the "Volver al fixture" / "Volver al inicio" hard links with `navigate(-1)` (with a sane fallback route when the history stack is shallow).
- The 404 branch in Match.tsx also becomes "go back" instead of "go to /fixtures".
- Add a `useEffect` guard: if `id` is empty, missing, or fails a simple regex (e.g. contains `..`, has invalid chars), redirect immediately to `/` (or `/fixtures`) with a toast.

**Match entry from Fixtures** (web/src/routes/Fixtures.tsx:259-312):
- Wrap each match card in `<Link to={`/match/${match.id}`}>` so the primary fixture list is the canonical entry, removing the need for users to navigate via Home → card.

- Pros: Hits all three user complaints in one pass. Backend 404 is the cleanest contract; frontend `navigate(-1)` is the conventional web back behavior. Entry-point unification removes the "wrong place" feeling for normal flows.
- Cons: Three separate touch points; needs careful testing of polling abort on redirect.
- Effort: **Medium** (1-2 hours: backend change + Match.tsx refactor + Fixtures link wrapping + small tests).

### 2. Frontend-only: soft validate, hard link to back
- Add a regex/format check on `id` in `Match.tsx`; if invalid, redirect.
- Replace `<Link to="/fixtures">` with `useNavigate` + `navigate(-1)` and a fallback `to="/"` if `location.key === "default"`.
- Do **not** change the API (it still returns 200 + null). Fixtures stays unlinked.

- Pros: Smaller blast radius, no API contract change, no risk of breaking the live polling client.
- Cons: Doesn't address the "API returns 200 for a 404" smell. Doesn't fix the missing entry point in Fixtures. URL is technically still reachable, just with a guard.
- Effort: **Low** (~30 min).

### 3. Link preflight — only render links to valid match IDs
- In Home, VenueDetail, LiveWidget, fetch the match list, then only render the link if `match.id` is truthy and matches a regex. Otherwise render a non-clickable card.
- Keep the 404 page in Match.tsx for direct URL entry / shared links.

- Pros: Eliminates the "shouldn't allow entering" complaint for the normal in-app flow. Zero backend change.
- Cons: Doesn't help users who type, share, or bookmark URLs. Doesn't fix the wrong-back-button. Allows direct URL hits to still render the 404.
- Effort: **Low** (~20 min, but spread across 3 files).

## Recommendation

**Approach 1** — defense in depth. It's the only option that addresses all three user complaints in one pass:
- The "match doesn't exist" UI now returns a real HTTP 404, which makes monitoring/debugging easier and aligns the contract with the rendered state.
- `navigate(-1)` with a sensible default fixes the "back goes to another tab" issue, which is a UX defect in any web app.
- Wrapping the Fixtures cards in `<Link>` adds the canonical entry point the user expected and removes the inconsistency where the most prominent match list is unclickable.

Backend 404 + frontend history back + Fixtures links is a small, well-scoped change that any future maintainer will thank you for. Total effort is medium but the changes are mechanical.

## Risks

- **Polling lifecycle on redirect**: `usePolling` must abort the in-flight request when the component unmounts; it does (see `usePolling.ts:69-77`), but the redirect effect needs to be ordered before the first fetch to avoid a wasted request. Add the guard in a `useEffect` with `id` in deps, not in render.
- **Stale shared URLs**: With approach 1, users who shared a URL from a match that's since been removed (e.g. a knockout match that never happened) will hit the 404 page. The `navigate(-1)` back behavior is the right answer because they likely came from a notification/email with no back stack — must have a sane default (`/fixtures` or `/`).
- **API contract change for `get_match`**: Any external client that relied on the 200-with-null shape will break. Currently the only client is this web app, but worth a heads-up.
- **Empty-string id collision**: If a match in the wheniskickoff source has neither `slug` nor `num`, `map_match` returns `id: ""`. The single-match endpoint can then match any other such match. A `slug`/`num` required check on the backend would close this. Low priority but worth a follow-up.

## Ready for Proposal

**Yes.** The investigation surfaces three concrete fixes the user already asked for:

1. Backend 404 on missing match (api/routers/tournament.py).
2. Browser-history back from Match.tsx (both the main back button and the 404 branch).
3. Clickable match cards in Fixtures.tsx.

A follow-up ticket can tackle the empty-id edge case and the match id validation in Match.tsx if desired. The orchestrator should propose these as a single change named `match-undefined-fix` (or similar) and ask the user to confirm the entry-point unification (Fixtures links) is in scope.
