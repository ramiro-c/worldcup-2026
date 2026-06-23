# Proposal: Enrichment Match Detail

## Intent

Eliminate the 2-click context switch from match detail to historial page. Show historical head-to-head data inline on the match detail page so users see past meetings without navigating away.

## Scope

### In Scope
- `GET /matches/{match_id}/enriched` endpoint (match + H2H in one call)
- H2H mapper function that summarizes raw openfootball head-to-head array
- `fetchMatchEnriched` in `web/src/lib/api.ts`
- Inline H2H card component (matches played, wins/draws, last 5 meetings, last meeting summary)
- Graceful empty state for teams with no history
- Alias additions for 2026 newcomers (Cape Verde Islands, Curaçao)

### Out of Scope
- No changes to existing /head-to-head historial page
- No StatsBomb event data on match detail
- No live polling of H2H data (fetch once, it's static)

## Capabilities

### New Capabilities
- `enriched-match-detail`: Combined match + head-to-head endpoint and inline H2H card for the match detail page.

### Modified Capabilities
None — no existing specs to modify.

## Approach

**API**: Add `GET /tournament/matches/{match_id}/enriched` to `api/routers/tournament.py`. Calls existing `get_match` for wheniskickoff data + `openfootball.get_head_to_head` for historical results. Create a `summarize_h2h(matches)` helper that returns: total matches, wins A, wins B, draws, last 5 meetings, last meeting summary. Handles teams with no history → empty state.

**Frontend**: Add `fetchMatchEnriched(id)` to `api.ts`. In `Match.tsx`, add a parallel fetch alongside existing match polling (non-blocking, no loading spinner on H2H). Render a compact H2H card below the score. Empty state shows "Sin enfrentamientos previos" with muted styling. Link "Ver historial completo" navigates to existing `/head-to-head/` page.

**Aliases**: Add `"cape verde islands": "Cape Verde"` and `"curacao": "Curaçao"` (and variants) to `TEAM_ALIASES` in `aliases.py` so H2H queries resolve correctly for 2026 debutants.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `api/routers/tournament.py` | Modified | New `/matches/{id}/enriched` endpoint + `summarize_h2h` |
| `web/src/lib/api.ts` | Modified | New `fetchMatchEnriched` function |
| `web/src/routes/Match.tsx` | Modified | Inline H2H card fetch + render |
| `api/providers/aliases.py` | Modified | Add 2026 newcomer aliases |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| openfootball slow for H2H across all years | Medium | Cache results, non-blocking frontend fetch |
| Team name mismatch after aliasing | Low | Add coverage via aliases; test with known edge cases |
| H2H card adds vertical scroll on mobile | Low | Keep card compact, scrollable container if needed |

## Rollback Plan

Revert three files: tournament.py endpoint, api.ts function, Match.tsx H2H block. Revert aliases.py if needed. Single-commit revert.

## Dependencies

- `openfootball.get_head_to_head` (already exists in `api/providers/openfootball.py`)
- `resolve_team_name` (already exists in `api/providers/aliases.py`)

## Success Criteria

- [ ] `/matches/{id}/enriched` returns match + H2H in single response
- [ ] H2H card renders below score with matches played, wins/draws, last 5 meetings
- [ ] Empty state renders cleanly for teams with no history
- [ ] "Ver historial completo" link navigates to existing historial page
- [ ] Cape Verde Islands and Curaçao alias lookups resolve correctly
