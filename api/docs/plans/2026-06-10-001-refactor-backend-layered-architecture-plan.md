---
title: Backend Architecture Refactor — Layered Services with Domain Isolation
type: refactor
status: active
date: 2026-06-10
origin: api/docs/architecture-spec.md
---

# Backend Architecture Refactor — Layered Services with Domain Isolation

## Summary

Refactor the API backend from a flat router+provider structure into a layered architecture with routers, services, repositories, mappers, and domain models. Business logic moves from routers into services, data fetching moves to repositories, and transformation logic moves to mappers. Enables clean domain logic isolation and testability.

---

## Problem Frame

Current architecture mixes HTTP handling, business logic, data transformation, and external API calls in routers and providers. Hard to test domain rules in isolation. Want to separate business logic from external data source concerns.

---

## Requirements

- R1. Domain logic isolated in services layer — no HTTP or external API knowledge
- R2. Repositories abstract data sources — swap providers without business logic changes
- R3. Mappers handle all data transformations — pure functions, no logic
- R4. Routers handle only HTTP concerns — request/response handling, validation
- R5. Preserve existing API contracts — no breaking changes to frontend
- R6. Enable unit testing of business logic with mocked repositories

---

## Scope Boundaries

- No new features or endpoints added
- API response schemas remain unchanged (preserve frontend compatibility)
- Docker config and development workflow unchanged
- Provider HTTP logic preserved, just simplified (remove caching)
- Frontend web app unchanged
- Database not introduced — still stateless API proxy
### Deferred to Follow-Up Work

- Comprehensive unit test suite (will be created incrementally after refactoring)
- Performance optimization of caching strategy
- Monitoring/observability enhancements
- Additional data source providers

---

## Context & Research

### Relevant Code and Patterns

**Current structure (1423 total lines):**
- `api/main.py` (48 lines) — App bootstrap, provider injection
- `api/routers/tournament.py` (159 lines) — Endpoints + mapping logic
- `api/routers/historical.py` (50 lines) — Endpoints
- `api/providers/*.py` — External API clients with caching

**Existing patterns to preserve:**
- Provider interface pattern (`providers/interfaces.py`) — extend to repositories
- Dependency injection via `init_router()` — upgrade to FastAPI `Depends()`
- Cache-aside with TTL — move from providers to services
- Pydantic v2 for validation — continue using
- `httpx.AsyncClient` for external calls — continue using

**Files to refactor:**
- `api/routers/tournament.py` — contains `map_*` functions (business logic)
- `api/providers/wheniskickoff.py` — contains caching logic
- `api/providers/openfootball.py` — contains parsing logic (move to mappers)
- `api/providers/statsbomb.py` — OK as-is, just remove caching

### Institutional Learnings

None in `docs/solutions/` yet — this is the first major architecture refactor.

### External References

- FastAPI Dependency Injection: https://fastapi.tiangolo.com/tutorial/dependencies/
- Repository Pattern in Python: https://github.com/josean-dev/python-repository-pattern
- Clean Architecture for FastAPI: https://fastapi.tiangolo.com/tutorial/separate-path-operations/
- Pydantic v2 Models: https://docs.pydantic.dev/latest/

---

## Key Technical Decisions

- **Services own caching strategy**: Caching moves from providers to services. Services decide WHAT and WHEN to cache; repositories just fetch.
- **Repository interfaces per domain, not per provider**: One `ITournamentRepository` interface, implemented by concrete repos that may use multiple providers internally.
- **Mappers as pure functions**: No state, no dependencies — just transformation functions (raw → domain, domain → response).
- **Models split into domain and response**: Domain models (internal business entities) separate from response schemas (API contracts).
- **DI via FastAPI `Depends()`**: Replace custom `init_router()` with framework-native dependency injection.
- **Preserve provider layer**: Keep providers for HTTP isolation, but simplify to HTTP-only (no caching, no logic).

---

## Open Questions

### Resolved During Planning

- **Q: Create `di.py` or inline in `main.py`?** Inline for now — only 2-3 services, avoid premature abstraction.
- **Q: Repository interfaces worth it?** Yes — enables swapping implementations and cleaner testing.
- **Q: Pydantic for domain models or dataclasses?** Pydantic — already in use, provides validation, minimal learning curve.

### Deferred to Implementation

- **Q: Exact service method names?** Will determine during refactoring based on domain operations.
- **Q: Mapper module structure per domain or shared?** Start with per-domain (`mappers/tournament.py`, `mappers/historical.py`), refactor if duplication emerges.
- **Q: Keep provider interfaces ABC?** Yes — provides clear contract for testing and swapping.

---

## Output Structure

    api/
    ├── main.py                        # App, middleware, router includes, DI registration
    ├── di.py                          # Dependency factories (service constructors)
    ├── routers/
    │   ├── tournament.py              # HTTP endpoints only (no logic, no transforms)
    │   ├── historical.py
    │   └── __init__.py
    ├── services/
    │   ├── tournament.py              # Business logic, caching strategy
    │   ├── historical.py
    │   └── __init__.py
    ├── repositories/
    │   ├── interfaces.py              # ABC interfaces for repos
    │   ├── tournament.py              # Data access, aggregation
    │   ├── historical.py
    │   └── __init__.py
    ├── mappers/
    │   ├── tournament.py              # Raw ↔ Domain ↔ Response transforms
    │   ├── historical.py
    │   └── __init__.py
    ├── models/
    │   ├── tournament.py              # Domain models (Pydantic)
    │   ├── historical.py
    │   └── __init__.py
    ├── providers/
    │   ├── __init__.py
    │   ├── interfaces.py              # Provider interfaces (keep existing)
    │   ├── wheniskickoff.py           # Simplified: HTTP only
    │   ├── openfootball.py            # Simplified: HTTP + parsing
    │   └── statsbomb.py               # Simplified: HTTP only
    └── tests/                         # (future — not part of this refactor)
        ├── services/
        ├── repositories/
        └── mappers/

---

## Implementation Units

### U1. Create Project Structure

**Goal:** Create new directory structure and update imports

**Requirements:** R1, R2, R3, R4

**Dependencies:** None

**Files:**
- Create: `api/services/__init__.py`
- Create: `api/repositories/__init__.py`
- Create: `api/mappers/__init__.py`
- Create: `api/models/__init__.py`

**Approach:**
1. Create empty directories with `__init__.py` files
2. Update existing imports in `main.py` and routers to account for new structure
3. No code changes yet — just structure

**Patterns to follow:**
- Follow existing import style (`import routers.tournament as tournament_module`)

**Test scenarios:**
- Happy path: Application starts without import errors

**Verification:**
- `uv run fastapi dev main.py --port 8000` starts successfully
- `GET /health` returns 200

---

### U2. Define Domain Models

**Goal:** Create Pydantic domain models for core entities

**Requirements:** R1, R6

**Dependencies:** U1

**Files:**
- Create: `api/models/tournament.py`
- Create: `api/models/historical.py`

**Approach:**
1. Extract current response shapes from router `map_*` functions
2. Define domain models (Match, Team, Venue, Group, Tournament, etc.)
3. Define response models (separate from domain for API versioning flexibility)
4. Use Pydantic v2 syntax with appropriate types

**Domain models needed:**
- `Match` — id, home_team, away_team, venue_id, datetime, group, round, status
- `Team` — id, name, code, group, crest_url
- `Venue` — id, name, city, country, capacity, coordinates, region
- `Group` — id, name, teams
- `Tournament` — year, name, host, matches

**Patterns to follow:**
- Existing implicit schemas in router responses
- Pydantic v2 validation patterns from codebase

**Test scenarios:**
- Happy path: Models validate correctly from dict data
- Edge case: Models handle None/null optional fields gracefully
- Error path: Models reject invalid data types (e.g., string for integer field)

**Verification:**
- Model classes can be imported without errors
- Sample data instantiates models correctly

---

### U3. Create Repository Interfaces and Implementations

**Goal:** Abstract data access behind repository pattern

**Requirements:** R2, R4

**Dependencies:** U1, U2

**Files:**
- Create: `api/repositories/interfaces.py`
- Create: `api/repositories/tournament.py`
- Create: `api/repositories/historical.py`

**Approach:**
1. Define abstract interfaces (`ITournamentRepository`, `IHistoricalRepository`)
2. Implement concrete repositories that use providers internally
3. Repositories return raw dicts — let services apply domain logic
4. Keep provider composition internal to repositories

**Interface methods:**
- `ITournamentRepository`: `get_groups()`, `get_teams()`, `get_venues()`, `get_matches()`, `get_match(match_id)`, `get_tv()`
- `IHistoricalRepository`: `get_tournaments()`, `get_tournament(year)`, `get_head_to_head(team1, team2)`

**Patterns to follow:**
- Existing provider interface pattern in `providers/interfaces.py`
- Use `@abstractmethod` decorators for interface methods

**Test scenarios:**
- Happy path: Repository methods return data from providers
- Integration: Repository aggregates multiple provider calls transparently
- Error path: Repository handles provider failures gracefully (returns empty or raises domain exception)

**Verification:**
- Repository classes can be instantiated with providers
- Repository methods delegate to providers correctly

---

### U4. Create Mappers

**Goal:** Extract transformation logic into pure mapper functions

**Requirements:** R3, R5

**Dependencies:** U2

**Files:**
- Create: `api/mappers/tournament.py`
- Create: `api/mappers/historical.py`
- Modify: `api/models/tournament.py` (add response models)
- Modify: `api/models/historical.py` (add response models)

**Approach:**
1. Extract `map_*` functions from `routers/tournament.py`
2. Convert to mapper functions: raw dict → domain model → response model
3. Keep venue coordinate lookups and region mapping in mappers (domain knowledge)
4. Make all mapper functions pure (no state, no side effects)

**Mapper functions:**
- `raw_match_to_domain()` — transform provider response to domain Match
- `domain_match_to_response()` — transform domain to API response
- `raw_venue_to_domain()` — add region mapping and coordinates
- Similar for teams, groups, historical data

**Patterns to follow:**
- Existing `map_*` function logic from routers
- Pure function pattern — inputs → outputs, no external state

**Test scenarios:**
- Happy path: Mapper transforms raw data to correct domain model structure
- Happy path: Mapper applies venue region mapping correctly
- Edge case: Mapper handles missing optional fields (e.g., no time_utc)
- Error path: Mapper rejects malformed input data with clear error

**Verification:**
- Mapper functions can be imported and called independently
- Mapper output matches existing API response shapes (backward compatible)

---

### U5. Create Services

**Goal:** Move business logic and caching to services layer

**Requirements:** R1, R2, R4, R6

**Dependencies:** U2, U3, U4

**Files:**
- Create: `api/services/tournament.py`
- Create: `api/services/historical.py`

**Approach:**
1. Create service classes that accept repository dependencies
2. Move caching logic from providers to services (cache-aside with TTL)
3. Services orchestrate: fetch from repo → apply domain logic → return domain models
4. Services expose same conceptual methods as current providers

**Service methods:**
- `TournamentService.get_groups()` — cached, domain logic
- `TournamentService.get_matches()` — cached, applies venue region enrichment
- `TournamentService.get_match_with_details(match_id)` — orchestration example

**Caching pattern:**
```python
class TournamentService:
    def __init__(self, repo: ITournamentRepository):
        self.repo = repo
        self._cache: dict[str, tuple[float, Any]] = {}

    async def get_matches(self) -> list[Match]:
        now = time.time()
        if "matches" in self._cache:
            ts, data = self._cache["matches"]
            if now - ts < TTL:
                return data
        raw = await self.repo.get_matches()
        mapped = [mapper.raw_match_to_domain(m) for m in raw]
        self._cache["matches"] = (now, mapped)
        return mapped
```

**Patterns to follow:**
- Existing cache-aside pattern from providers (move to services)
- Dependency injection constructor pattern

**Test scenarios:**
- Happy path: Service method returns domain models from repository
- Edge case: Cache hit returns cached data without calling repository
- Edge case: Cache miss fetches from repository and caches result
- Integration: Service applies domain logic (e.g., venue region mapping) correctly
- Error path: Service handles repository exceptions gracefully

**Verification:**
- Service classes can be instantiated with mocked repositories
- Service methods return properly typed domain models
- Caching behavior works correctly (TTL honored)

---

### U6. Update Routers

**Goal:** Simplify routers to HTTP handling only, delegate to services

**Requirements:** R4, R5

**Dependencies:** U2, U4, U5

**Files:**
- Modify: `api/routers/tournament.py`
- Modify: `api/routers/historical.py`

**Approach:**
1. Remove `map_*` functions from routers (now in mappers)
2. Remove provider dependency injection via `init_router()`
3. Use FastAPI `Depends()` to inject services
4. Call service methods and map domain → response
5. Return standardized response envelope

**Router endpoint pattern:**
```python
router = APIRouter(prefix="/tournament", tags=["tournament"])

@router.get("/matches")
async def get_matches(service: TournamentService = Depends(get_tournament_service)):
    matches = await service.get_matches()
    response = [mapper.domain_match_to_response(m) for m in matches]
    return {"data": response}
```

**Patterns to follow:**
- FastAPI `Depends()` pattern for DI
- Existing response envelope pattern (`{"data": ...}`)

**Test scenarios:**
- Happy path: Endpoint returns HTTP 200 with expected response shape
- Error path: Service exception handled and returns appropriate HTTP error
- Integration: Router dependency injection resolves service correctly

**Verification:**
- `uv run fastapi dev main.py --port 8000` starts successfully
- Bruno tests pass with same response shapes as before
- No `map_*` functions remain in router files

---

### U7. Wire Up Dependency Injection

**Goal:** Configure FastAPI dependency injection for services

**Requirements:** R1, R2

**Dependencies:** U3, U5, U6

**Files:**
- Create: `api/di.py`
- Modify: `api/main.py`

**Approach:**
1. Create `di.py` with dependency factory functions
2. Update `main.py` to include DI configuration
3. Register service dependencies (repositories → providers)
4. Remove `init_router()` pattern — use `Depends()` throughout

**DI factory pattern:**
```python
# di.py
def get_tournament_repo() -> ITournamentRepository:
    return TournamentRepository(wheniskickoff=WheniskickoffProvider())

def get_tournament_service(repo: ITournamentRepository = Depends(get_tournament_repo)):
    return TournamentService(repo)
```

**Patterns to follow:**
- FastAPI DI documentation examples
- Existing constructor injection pattern

**Test scenarios:**
- Happy path: DI resolves complete dependency chain (provider → repo → service)
- Integration: Service receives correctly configured repository instance
- Error path: Missing provider raises clear error

**Verification:**
- `uv run fastapi dev main.py --port 8000` starts without DI errors
- Bruno tests pass (endpoints resolve dependencies correctly)

---

### U8. Simplify Providers

**Goal:** Remove caching logic from providers, keep HTTP-only

**Requirements:** R2, R4

**Dependencies:** U3, U5

**Files:**
- Modify: `api/providers/wheniskickoff.py`
- Modify: `api/providers/openfootball.py`
- Modify: `api/providers/statsbomb.py`

**Approach:**
1. Remove `_cache` attributes and cache-aside logic
2. Simplify to pure HTTP calls + basic parsing
3. Keep error handling (HTTP errors, timeouts)
4. Return raw JSON responses for repositories to interpret

**Provider pattern:**
```python
class WheniskickoffProvider:
    async def get_matches(self) -> list[dict]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{BASE_URL}/matches.json")
            resp.raise_for_status()
            return resp.json()["data"]
```

**Patterns to follow:**
- Existing HTTP call pattern with `httpx.AsyncClient`
- Keep timeout handling and error recovery

**Test scenarios:**
- Happy path: Provider fetches data from HTTP endpoint
- Error path: HTTP 404/500 handled gracefully (returns empty or raises)
- Integration: Provider returns expected JSON structure

**Verification:**
- Providers fetch data successfully during Bruno tests
- No cache-related code remains in provider files
- Providers are simpler (fewer lines than before)

---

### U9. Final Cleanup and Verification

**Goal:** Remove dead code, verify all endpoints work, ensure backward compatibility

**Requirements:** R5

**Dependencies:** U6, U7, U8

**Files:**
- Modify: `api/main.py` (final cleanup)
- Modify: All refactored files (remove dead code)

**Approach:**
1. Remove unused imports from all files
2. Remove `init_router()` functions from routers
3. Verify Bruno tests pass for all 25 tournament + 15 historical tests
4. Check API response shapes match original (no breaking changes)
5. Update architecture comment in `api/CLAUDE.md`

**Patterns to follow:**
- Keep code clean — remove commented-out code, unused imports
- Verify backward compatibility before considering done

**Test scenarios:**
- Regression: All Bruno tests from Phase 2 still pass
- Integration: Swagger docs show all endpoints correctly
- Performance: Response times comparable to pre-refactor (no N+1 issues)

**Verification:**
- `uv run fastapi dev main.py --port 8000` starts without warnings
- Bruno test suite: 25/25 tournament tests pass, 15/15 historical tests pass
- No dead code remains (grep for unused functions/classes)
- `api/CLAUDE.md` reflects new architecture pattern

---

## System-Wide Impact

- **Interaction graph:** Services → Repositories → Providers chain adds one more hop, but each layer is simpler and more testable
- **Error propagation:** Exceptions from providers flow up through repositories to services; routers handle HTTP error translation
- **API surface parity:** Response shapes preserved exactly — no frontend changes needed
- **Integration coverage:** Bruno test suite provides regression safety net
- **Unchanged invariants:** External API contracts, caching TTL (5 min), HTTP client usage, Pydantic validation

---

## Risks & Dependencies

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking API response shape | Low | High | Run full Bruno test suite before considering done; compare response shapes side-by-side |
| Circular imports | Medium | Medium | Follow clear import order: models → mappers → providers → repositories → services → routers |
| DI configuration errors | Medium | Medium | Test `main.py` startup after U7; use explicit type hints |
| Caching behavior changes | Low | Medium | Verify cache TTL (300s) still honored; test cache hit/miss behavior |
| Over-engineering | Medium | Low | Stay focused on domain isolation goal; avoid speculative abstractions |

---

## Documentation / Operational Notes

- **Update `api/CLAUDE.md`**: Replace structure diagram with new layered architecture, update patterns section
- **Architecture decision record**: Consider adding `docs/adr/layered-architecture.md` documenting why this pattern was chosen
- **Team onboarding**: New developers should understand layer responsibilities — consider adding `api/docs/architecture-spec.md` reference

---

## Sources & References

- **Origin document:** [api/docs/architecture-spec.md](file:///Users/ramiro/Desktop/personal/06-copa-2026/api/docs/architecture-spec.md)
- **FastAPI DI docs:** https://fastapi.tiangolo.com/tutorial/dependencies/
- **Repository pattern reference:** https://github.com/josean-dev/python-repository-pattern
- **Existing code:** Current `api/` structure as baseline

---

## Progress Tracking

<!-- Implementation progress will be tracked by ce-work via git commits. -->