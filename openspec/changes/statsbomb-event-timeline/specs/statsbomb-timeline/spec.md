# StatsBomb Timeline Specification

## Purpose

Enable users to explore StatsBomb event data (lineups, goals, cards, subs, shot locations) for historical WC matches. Degrades gracefully when coverage is unavailable.

## Requirements

### Requirement: StatsBomb Discovery

The system MUST discover StatsBomb coverage via 2-hop lookup (competitions → matches) on page mount. Must match tournament by year + host.

#### Scenario: Covered match — lookup succeeds

- GIVEN a historical match for year `2014`
- WHEN `HistoricalMatchDetail` mounts
- THEN fetch `/historical/competitions`, find competition `43` / season `3`
- AND fetch `/historical/matches?competition_id=43&season_id=3`
- AND match by date + team names, then load events + lineups

#### Scenario: Uncovered match — empty

- GIVEN a match not in StatsBomb (pre-1982)
- WHEN discovery resolves zero matches
- THEN StatsBomb section MUST NOT render
- AND show "Cobertura de StatsBomb no disponible para este partido"

### Requirement: Event Timeline

The system MUST render a minute-ordered timeline of goals, cards, and subs. Each event MUST show minute, type icon, player, and team.

#### Scenario: Mixed events

- GIVEN 2 goals, 1 yellow card, 1 substitution in events
- WHEN rendered
- THEN events MUST sort chronologically by minute
- AND each MUST show minute, icon (goal, card, sub), and player
- AND goals MUST link to the scoring team

#### Scenario: Partial events

- GIVEN goals loaded but no card data
- WHEN rendered
- THEN available events MUST display
- AND absent event types MUST NOT cause errors

### Requirement: Lineup Display

The system MUST display each team's starting XI and subs. MUST group by position (GK, DEF, MID, FWD) when available.

#### Scenario: Full lineups

- GIVEN lineups for both teams
- WHEN rendered
- THEN starting XI sorted by jersey number per team
- AND subs under "Suplentes"
- AND player names linkable to team page

#### Scenario: No position data

- GIVEN lineups with names only, no position fields
- WHEN rendered
- THEN players display as sorted list by jersey number
- AND MUST NOT fail from missing positions

### Requirement: Shot Map

When events contain shots with coordinates, the system SHOULD render an SVG shot map on a pitch outline. Goals MUST be visually distinct.

#### Scenario: Shots with coordinates

- GIVEN 2 goal shots + 3 non-goal shots with `(x,y)` coordinates
- WHEN rendered
- THEN each shot is a dot at its coordinate on the pitch SVG
- AND goal dots MUST differ in color from non-goal dots
- AND a legend MUST indicate the distinction

#### Scenario: No coordinates

- GIVEN events loaded but no shots have coordinate data
- WHEN the shot map would render
- THEN it MUST NOT render
- AND MUST NOT produce an error

### Requirement: Attribution

The StatsBomb section MUST show attribution text + link. MUST reuse the existing `Attribution` component.

#### Scenario: Attribution renders

- GIVEN any StatsBomb data is displayed
- THEN "Data by StatsBomb" with link to `https://statsbomb.com/` MUST appear below the section
- AND the StatsBomb logo MUST appear alongside

### Requirement: Error Handling

StatsBomb failures MUST NOT break the page. openfootball match data MUST render normally regardless of StatsBomb state.

#### Scenario: Provider 500

- GIVEN StatsBomb returns a 500 error
- WHEN the page loads
- THEN openfootball info MUST display normally
- AND the StatsBomb section MUST show a retry message + button

#### Scenario: Partial failure

- GIVEN events load but lineups return 404
- WHEN rendered
- THEN event timeline MUST display
- AND lineup section MUST show "Alineaciones no disponibles"
- AND page MUST NOT break
