# Design: D3 Knockout Bracket

## Technical Approach

Backend builds a structured bracket tree from wheniskickoff knockout matches (`phase` not "group") and serves it via `GET /api/bracket`. Frontend renders a left-to-right SVG bracket using D3 hierarchy for node positioning. Hover on a team highlights its full path to the final via data-attribute chain walk.

## Architecture Decisions

### Backend bracket endpoint vs frontend computation
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Frontend infers structure from flat matches | Duplicates bracket logic, fragile to API changes | ✅ **Backend builds tree** |
| Backend serves structured tree | Single source of truth, endpoint reuse | API owns knockout knowledge; frontend just renders |

### D3 import strategy
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Individual modules (`d3-selection`, `d3-hierarchy`, `d3-shape`) | Saves ~8KB gzipped, manual version mgmt | ✅ **Full `d3` package** |
| Full `d3` | Simpler install, Vite tree-shakes unused | Vite + Rollup tree-shake unused D3 exports. If bundle bloat surfaces, audit with `vite-bundle-visualizer` and switch to submodules. |

### SVG layout for 32-team bracket
| Option | Tradeoff | Decision |
|--------|----------|----------|
| D3 hierarchy + custom separation | Handles 5+ rounds automatically | ✅ **D3 tree layout** |
| Manual coordinate math | Simple but brittle for round count changes | D3 `tree().nodeSize([h, v])` positions nodes; mapping to left-to-right by swapping x/y. Supports any tournament size. |

### Interactive highlight approach
| Option | Tradeoff | Decision |
|--------|----------|----------|
| React state + re-render | Full component re-render on every hover | ❌ |
| CSS + data attributes | O(1) selectors, no re-render | ✅ **data-attr chain** |
| D3 event redraw | Tight coupling to D3 lifecycle | Match groups annotated with `data-match-id` and `data-next-match-id`. Hover → walk next-match chain → toggle `.highlight` CSS class on each node. |

## Data Flow

```
wheniskickoff JSON → WheniskickoffProvider.get_matches()
                         │
                    /api/bracket endpoint
                    filter phase != "group"
                    group by round, build winner pointers
                         │
                    Bracket.tsx (fetch + loading/error)
                         │
                    BracketTree.tsx (D3 SVG)
                    hierarchy layout → match cells → connector paths
                         │
                    hover handler → data-match-id walk → .highlight
```

## Bracket Data Structure

Backend response shape:

```typescript
interface BracketRound {
  name: string;        // "round_of_32" | "round_of_16" | "quarter_final" | ...
  label: string;       // "Octavos de Final" | ...
  matches: BracketMatch[];
}

interface BracketMatch {
  id: string;
  round: string;
  slot: number;                // position within round (0-indexed)
  home_team: string | null;    // null = TBD
  away_team: string | null;
  home_team_name: string | null;
  away_team_name: string | null;
  home_crest: string | null;
  away_crest: string | null;
  home_score: number | null;
  away_score: number | null;
  status: string;
  next_match_id: string | null; // null for final winner
}
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `web/package.json` | Modify | Add `d3` dependency |
| `web/src/lib/types.ts` | Modify | Add `BracketRound`, `BracketMatch` interfaces |
| `web/src/lib/api.ts` | Modify | Add `getBracket()` function |
| `web/src/components/BracketTree.tsx` | Create | D3 SVG bracket renderer component |
| `web/src/routes/Bracket.tsx` | Modify | Wire up BracketTree with fetch + states |
| `api/routers/tournament.py` | Modify | Add `GET /bracket` endpoint + `build_bracket_tree()` |
| `api/providers/interfaces.py` | Modify | (optional) Add `get_bracket` to interface if needed |

## Interfaces / Contracts

```typescript
// web/src/lib/api.ts
export async function getBracket(): Promise<BracketRound[]>

// web/src/components/BracketTree.tsx
interface BracketTreeProps {
  rounds: BracketRound[];
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `build_bracket_tree()` logic | Test edge cases: all TBD, partial teams, live scores, final scores |
| Unit | D3 tree construction | Test hierarchy from bracket response renders correct node count |
| E2E | Bracket page | Playwright: snapshot SVG, hover team → verify highlight class |

## State Handling

Three states from single `/api/bracket` response:
- **Pre-knockout**: all teams = null → render slot names "TBD" with muted styling
- **Partial**: some teams known + scores null → full slot with crest, no score
- **Live/Final**: teams + scores present → full slot with crest + score

No progressive loading needed — endpoint returns the complete structure at every state.

## Migration / Rollout

No migration required. `/api/bracket` is a new endpoint; old Bracket route is replaced atomically within a single deploy.

## Open Questions

- [ ] Does wheniskickoff's `phase` field reliably distinguish all knockout rounds, or do we need match number ranges (#73-104) as a fallback?
- [ ] D3 hierarchy placement: confirm separation constant for 32-team density fits SVG viewport
