# Tournament Stats Specification

## Purpose

Aggregate historical World Cup statistics across all 23 tournaments — champion counts, biggest wins, top scorers, host records — surfaced via API and rendered as a card-grid dashboard.

## Requirements

### Requirement: Tournament Stats Endpoint

The system MUST expose `GET /historical/tournament-stats` returning precomputed aggregate statistics across all World Cup tournaments.

#### Scenario: Successful aggregation
- GIVEN all 23 tournaments are available in the openfootball data
- WHEN the client calls `GET /historical/tournament-stats`
- THEN the response has status 200
- AND the body contains `champion_counts`, `biggest_wins`, `total_goals`, `host_records`, and `top_scorers`

#### Scenario: Partial provider failure
- GIVEN one tournament (e.g. 1930) fails to parse
- WHEN the client calls `GET /historical/tournament-stats`
- THEN the response has status 200
- AND the failed tournament is skipped
- AND a `skipped_tournaments` field lists the skipped years

### Requirement: Response Structure

The response MUST include champion counts grouped by country, largest margins of victory with tournament context, total goals across all tournaments, host performance (semifinal appearance), and all-time top scorers.

#### Scenario: Champion leaderboard ordered correctly
- GIVEN the aggregated stats response
- WHEN inspecting `champion_counts`
- THEN Brazil has 5, Germany has 4, Italy has 4, Argentina has 3
- AND entries are sorted by count descending

#### Scenario: Top scorers listed with goal counts
- GIVEN the aggregated stats response
- WHEN inspecting `top_scorers`
- THEN each entry includes `player`, `goals`, and `tournaments`
- AND entries are sorted by goals descending

### Requirement: Caching

The system SHOULD cache the aggregated result with a 5-minute TTL and use stale-while-revalidate for concurrent requests.

#### Scenario: Cache hit returns fresh data
- GIVEN the cache was populated within the last 5 minutes
- WHEN a request arrives
- THEN the cached result is returned directly
- AND no aggregation re-computation occurs

#### Scenario: Stale cache serves while revalidating
- GIVEN the cache is between 5 and 10 minutes old
- WHEN a request arrives
- THEN the stale cached result is returned immediately
- AND a background revalidation starts

### Requirement: Stats Page

The frontend MUST render the stats data as a Tailwind card grid with sections for champion leaderboard, tournament records, and host performance.

#### Scenario: Cards render with data
- GIVEN `/stats` is loaded
- WHEN the API responds with valid stats data
- THEN a champion leaderboard card is visible with flag and count
- AND a "Biggest Wins" card shows top-5 margins
- AND a host performance card shows host years and results

#### Scenario: Empty state on fetch failure
- GIVEN `/stats` is loaded
- WHEN the API returns an error or empty data
- THEN a clear message "Estadísticas no disponibles" is displayed
- AND no loading skeleton is shown after 5 seconds

### Requirement: Navigation

The system MUST include an "Estadísticas" link in the navigation bar and route `/stats` to the Stats component.

#### Scenario: Nav link visible
- GIVEN the user is on any page
- WHEN the navigation bar is rendered
- THEN an "Estadísticas" link is visible on desktop and mobile

#### Scenario: Route resolves
- GIVEN the user clicks "Estadísticas"
- WHEN the URL changes to `/stats`
- THEN the Stats component renders
