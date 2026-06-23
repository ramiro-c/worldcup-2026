# Match Enrichment Specification

## Purpose

Consolidate match + historical head-to-head data in a single endpoint so the match detail page shows past meetings inline without a separate API call or page navigation.

## Requirements

### Requirement: Enriched Match Endpoint

`GET /matches/{match_id}/enriched` MUST return match data from wheniskickoff and a computed H2H summary from openfootball in one response.

| Scenario | GIVEN | WHEN | THEN |
|----------|-------|------|------|
| H2H history exists | Valid `match_id` for Argentina vs Germany | Endpoint called | Full match object + `head_to_head` with `total_matches`, `team1_wins`, `team2_wins`, `draws`, `last_five` (last 5), `last_meeting` (most recent summary) |
| No history | Valid `match_id` for Cape Verde vs Curaçao | Endpoint called | H2H counts = 0, arrays empty; frontend SHOULD render "Sin enfrentamientos previos" muted |
| Invalid match_id | `match_id` = "99999" | Endpoint called | HTTP 404 with `detail` error body |
| Provider timeout | Valid `match_id`, openfootball unreachable | Endpoint called | Match data returned with `head_to_head: null`, no provider error propagated |

### Requirement: H2H Summary Computation

`summarize_h2h(matches, team1, team2)` MUST consume the raw array from `get_head_to_head` and produce a structured summary with canonical names.

| Scenario | GIVEN | WHEN | THEN |
|----------|-------|------|------|
| Established rivalry | 10 H2H matches Argentina vs Germany | `summarize_h2h` called | `total_matches` = 10; wins + draws = total; `last_five` = 5 most recent descending; `last_meeting` has date/score/stage/tournament; names are canonical |
| Draws and penalty wins | H2H matches with draws and penalty decisions | `summarize_h2h` called | Draws count tied full-time matches; wins reflect penalty-decided winner; entries include `has_extra_time` and `penalty_score` |
| Single match | Exactly 1 H2H match | `summarize_h2h` called | `last_five` = [that match]; `last_meeting` matches same entry |
| Empty history | Empty array | `summarize_h2h` called | All counts = 0; `last_five` = []; `last_meeting` = null |

### Requirement: Team Name Alias Resolution

Team names MUST resolve through `TEAM_ALIASES` before H2H lookup; canonical names used in response.

| Scenario | GIVEN | WHEN | THEN |
|----------|-------|------|------|
| Aliased team | Match with "USA" | Enriched endpoint processes names | `resolve_team_name("USA")` → "United States"; H2H query uses canonical; response uses canonical |
| 2026 newcomer | Match with Cape Verde Islands or Curaçao | Enriched endpoint processes names | `"cape verde islands"` → "Cape Verde"; `"curacao"` → "Curaçao"; response uses canonical form |
| Canonical pass-through | Name "Brazil" | `resolve_team_name` called | Returns input unchanged; H2H query uses original |

### Requirement: Non-blocking Frontend H2H Fetch

Frontend MUST fetch enriched data alongside existing match polling without blocking match detail render.

| Scenario | GIVEN | WHEN | THEN |
|----------|-------|------|------|
| H2H loads after data | User navigates to match detail | Page loads | Match renders without waiting for H2H; card appears once enriched responds; no loading spinner for H2H |
| Enriched fetch fails | Endpoint errors or times out | Frontend receives error | Match page renders without H2H card; no error toast/alert |
| "Ver historial completo" | H2H card rendered | User clicks link | Navigates to `/head-to-head/` historial page; link SHOULD pre-fill team names as query params |

### Requirement: 2026 Newcomer Alias Registration

The aliases `"cape verde islands" → "Cape Verde"` and `"curacao" → "Curaçao"` (and reasonable variants) MUST be registered in `TEAM_ALIASES` in `api/providers/aliases.py` before the enriched endpoint is deployed.

| Scenario | GIVEN | WHEN | THEN |
|----------|-------|------|------|
| Cape Verde resolves | openfootball has "Cape Verde" | `resolve_team_name("Cape Verde Islands")` called | Returns "Cape Verde" |
| Curaçao resolves | openfootball has "Curaçao" | `resolve_team_name("curacao")` called | Returns "Curaçao" |
| Unrelated team unchanged | openfootball has "Brazil" | Existing aliases checked | No alias for "brazil" exists; passes through unchanged |
