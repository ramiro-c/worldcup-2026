# Knockout Bracket Specification

## Purpose

Render the 2026 World Cup elimination tree — Round of 32 through Final — as an interactive D3 SVG bracket. Handles pre-knockout (all TBD), partial determination, live scores, and final results.

## Requirements

### Requirement: Bracket Data Endpoint

The API **MUST** expose a `GET /api/bracket` endpoint returning a structured tree of all 31 knockout matches (IDs #73–#104 from wheniskickoff) with winner-to-next-slot pointers.

| Field | Type | Description |
|-------|------|-------------|
| `round` | string | `round_of_32`, `round_of_16`, `quarter_final`, `semi_final`, `final` |
| `slot` | number | Ordinal position within round (1-indexed) |
| `team_a`, `team_b` | object \| null | `{name, code, crest}` or `null` (TBD) |
| `score_a`, `score_b` | number \| null | Goals or `null` |
| `winner_next` | string | Target slot identifier (e.g. `round_of_16/slot_1` team_a) |

#### Scenario: Bracket tree for all 31 matches

- GIVEN wheniskickoff returns match data for IDs #73–#104
- WHEN GET /api/bracket
- THEN response contains 31 nodes across 5 rounds
- AND each node has `round`, `slot`, `winner_next` fields

#### Scenario: Pre-knockout state (all teams TBD)

- GIVEN no group stage matches have completed
- WHEN GET /api/bracket
- THEN every `team_a` and `team_b` is `null`
- AND every `score_a` and `score_b` is `null`

#### Scenario: Partial qualification (post Groups of 16)

- GIVEN group stage has determined 16 qualified teams
- WHEN GET /api/bracket
- THEN Round of 32 slots show determined teams with crest and code
- AND later rounds still show `null` for undetermined slots

#### Scenario: wheniskickoff API failure

- GIVEN wheniskickoff returns 5xx or times out
- WHEN GET /api/bracket
- THEN response is 503 with `{"error": "provider_unavailable"}`

### Requirement: SVG Bracket Rendering

The bracket **MUST** render as a responsive D3 SVG tree using `d3-hierarchy` layout.

| Element | Required | Detail |
|---------|----------|--------|
| Round labels | Yes | `R32`, `R16`, `QF`, `SF`, `Final` column headers |
| Match slots | Yes | Horizontal bars with crest (24px), 3-letter code, score |
| Connector lines | Yes | Bezier curves linking match → next-round slot |
| Winner slot | Yes | Single cell at bottom for champion |

#### Scenario: Full bracket renders all 31 slots

- GIVEN bracket data is loaded
- WHEN the component renders
- THEN SVG contains 31 match slot groups + 1 winner slot
- AND connector lines join winner of each match to the correct next-round slot

#### Scenario: Bracket fits viewport

- GIVEN viewport width is 1024px or larger
- WHEN the bracket renders
- THEN no horizontal scrollbar appears (SVG viewBox scales dynamically)

#### Scenario: TBD slot rendering

- GIVEN a match slot has `team_a: null`
- WHEN the slot renders
- THEN it displays a dashed border with "TBD" text
- AND score area shows a dash (`—`) instead of a number

### Requirement: Path-to-Final Highlighting

The bracket **MUST** highlight a team's full elimination path on hover over any slot containing a determined team.

#### Scenario: Hover highlights ancestor path

- GIVEN the bracket shows Argentina in semi-final slot
- WHEN user hovers over Argentina's semi-final slot
- THEN Argentina's slot gets `opacity: 1` with accent stroke
- AND ALL ancestor nodes on Argentina's path to the final are highlighted
- AND sibling branches get `opacity: 0.3`

#### Scenario: Hover on TBD slot does nothing

- GIVEN a slot with `team_a: null`
- WHEN user hovers over it
- THEN no highlight class is toggled
- AND no opacity change occurs on any slot

### Requirement: Progressive Reveal

The bracket **MUST** react to data changes when new matches resolve — scores update, TBD slots become determined teams, and successor slots populate.

#### Scenario: Score updates on live match

- GIVEN a Round of 32 match is in progress with score 1–0
- WHEN the bracket refetches and scores change to 2–0
- THEN the slot display updates to show 2–0 in both team A and B positions

#### Scenario: Team determined populates successor

- GIVEN Round of 32 slot 1 has `team_a: Argentina` with a winner
- WHEN the Round of 16 slot 1 refreshes
- THEN the new team name appears in the next round slot with its crest and code
- AND the connector line from the winning slot to the recipient slot is complete

### Requirement: Error and Loading States

The bracket **SHOULD** display a loading skeleton while fetching. It **MUST** show an error message with a retry button on API failure (non-503 network errors).

#### Scenario: Loading skeleton

- GIVEN the bracket is fetching data
- WHEN the component mounts
- THEN a pulsing placeholder matching bracket dimensions is shown
- AND no SVG render occurs until data arrives

#### Scenario: API error with retry

- GIVEN the fetch fails with a network error
- WHEN the error state renders
- THEN an error message "No se pudo cargar el cuadro eliminatorio" is shown
- AND a "Reintentar" button calls GET /api/bracket again
