# Proposal: D3 Knockout Bracket

## Intent

Replace the placeholder Bracket page ("coming after groups") with a real D3-based knockout bracket. Users exploring the 2026 World Cup need to see the elimination tree — even as a preview before knockout matches start.

## Scope

### In Scope
- D3 dependency in `web/package.json`
- Bracket.tsx rewrite with D3 SVG visualization
- Tree layout: Round of 32 → Round of 16 → QF → SF → Final → Winner
- Crest, name, score per slot from wheniskickoff
- Interactive path-to-final highlight on hover
- Graceful pre-knockout state (TBD teams, no scores)
- `/api/bracket` endpoint serving structured bracket tree

### Out of Scope
- Historical overlay in bracket cells (Phase 2)
- Animated round transitions
- Printable/screenshot mode
- Click-through to match detail

## Capabilities

### New Capabilities
- `knockout-bracket`: D3 SVG bracket tree for 31 knockout matches with team info, scores, and path highlighting.

### Modified Capabilities
None — no existing specs.

## Approach

**API**: Add `/api/bracket` endpoint that structures wheniskickoff matches #73-104 into a bracket tree with winner-to-next-slot pointers.

**Frontend**: Install D3, rewrite Bracket.tsx with SVG render. Use D3 hierarchy layout for node positioning. Fetch from `/api/bracket`. Render crest + name + score per slot. Hover → CSS class toggle on ancestor/descendant nodes.

**States handled**: pre-knockout (all TBD), partial teams determined (post groups), scores live, scores final.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `web/package.json` | Modified | Add d3 dependency |
| `web/src/routes/Bracket.tsx` | Modified | Full D3 rewrite |
| `web/src/lib/types.ts` | Modified | Bracket types |
| `api/src/main.py` | Modified | `/api/bracket` endpoint |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| D3 bundle bloat | Low | Import specific modules |
| Undetermined teams | Medium | Graceful TDB slot rendering |
| wheniskickoff API drift | Low | Isolate parsing in API layer |

## Rollback Plan

Revert Bracket.tsx to placeholder, `pnpm remove d3`, remove `/api/bracket` endpoint. Single-commit revert.

## Dependencies

- D3 npm package (`pnpm add d3`)
- wheniskickoff API (already in use)
- Group stage match data to determine bracket qualifiers

## Success Criteria

- [ ] Bracket renders all 31 knockout matches as SVG tree
- [ ] Team crests display for determined teams, TBD for unknown
- [ ] Scores show correctly for completed matches
- [ ] Hover highlights the team's full path to final
- [ ] Placeholder renders before knockout stage starts
