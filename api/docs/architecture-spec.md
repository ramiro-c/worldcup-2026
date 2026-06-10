# Copa 2026 API — Architecture Specification

## Overview

Layered architecture separating domain logic from external data sources and HTTP concerns.

**Goal:** Isolate business logic from external API dependencies to enable:
- Clean unit testing of domain rules
- Swap data sources without business logic changes
- Multiple data source aggregation transparently

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        HTTP Layer                            │
│  Routers (controllers) — Request/Response handling          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  Services — Business logic, domain operations, orchestration│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Data Access Layer                       │
│  Repositories — Data fetching, source aggregation           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                      │
│  Providers — External API clients (HTTP calls only)         │
└─────────────────────────────────────────────────────────────┘
```

**Cross-cutting:**
- **Mappers** — Transform data between layers (raw → domain → response)
- **Models** — Pydantic schemas for validation and typing

---

## Layer Responsibilities

### 1. Routers (Controllers)

**Location:** `api/routers/`

**Responsibilities:**
- Define HTTP endpoints (routes, methods, status codes)
- Request validation (path params, query params, body)
- Response formatting (standardized envelope)
- Authentication/authorization hooks (future)
- Error handling (HTTP-level errors)

**Does NOT:**
- Business logic
- Data fetching
- Data transformation (delegates to mappers via services)

**Pattern:**
```python
# routers/tournament.py
router = APIRouter(prefix="/tournament", tags=["tournament"])

@router.get("/matches")
async def get_matches(service: TournamentService = Depends(get_tournament_service)):
    matches = await service.get_all_matches()
    return {"data": [MatchResponse.from_domain(m) for m in matches]}
```

---

### 2. Services

**Location:** `api/services/`

**Responsibilities:**
- **Business logic** — domain rules, computations, validations
- **Orchestration** — coordinate multiple repositories
- **Caching strategy** — decide WHAT to cache and WHEN
- **Error handling** — domain-level errors (not HTTP)
- **Data aggregation** — combine data from multiple sources

**Does NOT:**
- HTTP request/response handling
- Direct external API calls
- Knowledge of external API formats

**Interfaces:**
- Accept domain models from repositories
- Return domain models to routers
- Use mapper utilities for transformations

**Pattern:**
```python
# services/tournament.py
class TournamentService:
    def __init__(self, tournament_repo: ITournamentRepository):
        self.repo = tournament_repo
        self._cache: dict[str, tuple[float, list[Match]]] = {}

    async def get_all_matches(self) -> list[Match]:
        """Business logic: fetch matches, apply caching, compute derived fields"""
        return await self.repo.get_all_matches()

    async def get_match_by_id(self, match_id: str) -> Match | None:
        """Business logic: find match, compute venue region, etc."""
        match = await self.repo.get_match(match_id)
        if match:
            match = apply_venue_region(match)  # domain logic
        return match
```

**Caching ownership:**
- **Services** decide: TTL per operation, cache keys, invalidation rules
- **Repositories** just fetch — no caching logic

---

### 3. Repositories

**Location:** `api/repositories/`

**Responsibilities:**
- **Data fetching** — retrieve from one or multiple providers
- **Source aggregation** — unify data from multiple external APIs
- **Raw data normalization** — ensure consistent structure across sources
- **Repository pattern** — abstract away external API details

**Does NOT:**
- Business logic
- HTTP response handling
- Caching strategy (just fetch)

**Interfaces:**
- Define repository interfaces in `api/repositories/interfaces.py`
- Implement concrete repos that use providers
- Return raw dictionaries or simple data classes (not domain models)

**Pattern:**
```python
# repositories/tournament.py
class TournamentRepository(ITournamentRepository):
    def __init__(
        self,
        wheniskickoff: WheniskickoffProvider,
        openfootball: OpenfootballProvider | None = None,
    ):
        self.wk = wheniskickoff
        self.of = openfootball  # optional secondary source

    async def get_all_matches(self) -> list[dict]:
        """Fetch from primary source, optionally enrich from secondary"""
        raw = await self.wk.get_matches()
        return raw  # return raw, let service apply logic
```

---

### 4. Providers (Infrastructure)

**Location:** `api/providers/` (existing, simplified)

**Responsibilities:**
- **HTTP communication** — external API calls only
- **Basic parsing** — JSON → Python dicts
- **Error handling** — network errors, HTTP errors
- **Credential management** — API keys, tokens (future)

**Does NOT:**
- Business logic
- Caching (remove current cache logic)
- Data transformation

**Pattern:**
```python
# providers/wheniskickoff.py
class WheniskickoffProvider:
    async def get_matches(self) -> list[dict]:
        """Raw HTTP call → JSON response"""
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{BASE_URL}/matches.json")
            resp.raise_for_status()
            return resp.json()["data"]  # no transformation
```

**Note:** Current providers have caching — this moves to services.

---

### 5. Mappers

**Location:** `api/mappers/`

**Responsibilities:**
- **Raw → Domain** — transform provider/repository output to domain models
- **Domain → Response** — transform domain models to API response format
- **Utilities** — shared transformation logic (venue coords, region mapping)

**Does NOT:**
- Business logic (only pure transformations)
- State management

**Pattern:**
```python
# mappers/tournament.py
def raw_match_to_domain(raw: dict) -> Match:
    """Transform raw API response to domain model"""
    return Match(
        id=raw.get("slug", str(raw.get("num"))),
        home_team=raw["home"].lower(),
        away_team=raw["away"].lower(),
        venue_id=raw["venue"],
        datetime=parse_datetime(raw["date"], raw.get("time_utc", "")),
    )

def domain_match_to_response(match: Match, venue_region: str) -> MatchResponse:
    """Transform domain model to API response"""
    return MatchResponse(
        id=match.id,
        home_team=match.home_team,
        away_team=match.away_team,
        venue=match.venue_id,
        region=venue_region,
        status="scheduled",
    )
```

---

### 6. Models

**Location:** `api/models/`

**Responsibilities:**
- **Domain models** — business entities (Match, Team, Venue, Tournament)
- **Response schemas** — API response validation (Pydantic v2)
- **Value objects** — immutable domain primitives

**Pattern:**
```python
# models/tournament.py
class Match(BaseModel):
    id: str
    home_team: str
    away_team: str
    venue_id: str
    datetime: datetime
    group: str | None = None
    round: str | None = None

class MatchResponse(BaseModel):
    id: str
    home_team: str
    away_team: str
    home_team_name: str
    away_team_name: str
    venue: str
    venue_name: str
    date: str
    time: str
    status: Literal["scheduled", "live", "finished"]
    group: str | None
    round: str | None
```

---

## Dependency Injection

**Location:** `api/main.py` + `api/di.py`

Use FastAPI's `Depends()` for clean DI:

```python
# di.py
def get_tournament_service() -> TournamentService:
    repo = TournamentRepository(
        wheniskickoff=WheniskickoffProvider(),
    )
    return TournamentService(repo)

def get_historical_service() -> HistoricalService:
    repo = HistoricalRepository(
        openfootball=OpenfootballProvider(),
        statsbomb=StatsBombProvider(),
    )
    return HistoricalService(repo)
```

```python
# main.py
app = FastAPI()

@app.get("/tournament/matches")
async def get_matches(service: TournamentService = Depends(get_tournament_service)):
    ...
```

---

## Interfaces

### Repository Interfaces

```python
# repositories/interfaces.py
class ITournamentRepository(ABC):
    @abstractmethod
    async def get_all_matches(self) -> list[dict]:
        pass

    @abstractmethod
    async def get_match(self, match_id: str) -> dict | None:
        pass

    @abstractmethod
    async def get_all_teams(self) -> list[dict]:
        pass

    @abstractmethod
    async def get_all_venues(self) -> list[dict]:
        pass
```

### Service Interfaces (optional)

Use interfaces for services if you need multiple implementations (e.g., for testing or feature flags). Otherwise, concrete classes are fine.

---

## Data Flow Examples

### Example 1: Get All Matches

```
GET /tournament/matches
    ↓
TournamentRouter.get_matches()
    ↓
TournamentService.get_all_matches()
    ↓
TournamentRepository.get_all_matches()
    ↓
WheniskickoffProvider.get_matches()  →  HTTP call
    ↓
Raw dict list  →  Mapper  →  Domain model list
    ↓
Service applies business logic (caching, enrichment)
    ↓
Domain model list  →  Mapper  →  Response schema list
    ↓
{"data": [...]}
```

### Example 2: Get Match with Head-to-Head

```
GET /tournament/matches/argentina-vs-france?include_h2h=true
    ↓
TournamentRouter.get_match()
    ↓
TournamentService.get_match_with_h2h(match_id)
    ├─→ TournamentRepository.get_match(match_id)  →  Match data
    └─→ HistoricalRepository.get_head_to_head("ARG", "FRA")  →  H2H data
    ↓
Service combines match + H2H, applies caching
    ↓
Response with nested H2H
```

---

## Migration Strategy

### Phase 1: Create New Structure

1. Create directories: `services/`, `repositories/`, `models/`, `mappers/`
2. Define Pydantic models for domain entities
3. Create repository interfaces

### Phase 2: Extract Providers

1. Remove caching logic from providers (move to services)
2. Simplify providers to HTTP-only
3. Update provider methods to return raw data

### Phase 3: Build Repositories

1. Implement repositories using providers
2. Add repository interfaces
3. Test repository layer in isolation

### Phase 4: Extract Services

1. Move `map_*` functions from routers to mappers
2. Move business logic from routers to services
3. Services use repositories, return domain models

### Phase 5: Clean Up Routers

1. Routers delegate to services
2. Remove all transformation logic
3. Routers only handle HTTP concerns

### Phase 6: Wire Up DI

1. Create `di.py` with dependency factories
2. Update `main.py` to use DI
3. Update routers to use `Depends()`

---

## Testing Strategy

### Unit Tests

```python
# tests/services/test_tournament.py
async def test_get_match_applies_venue_region():
    mock_repo = MockRepository()
    service = TournamentService(mock_repo)

    match = await service.get_match("argentina-vs-france")

    assert match.venue_region == "Central"  # business logic applied
```

### Integration Tests

```python
# tests/repositories/test_tournament_repository.py
async def test_repository_aggregates_sources():
    repo = TournamentRepository(
        wheniskickoff=WheniskickoffProvider(),
        openfootball=OpenfootballProvider(),
    )

    matches = await repo.get_all_matches()

    assert len(matches) > 0
```

### Contract Tests

Test that providers return expected structure:

```python
# tests/providers/test_wheniskickoff.py
async def test_matches_response_structure():
    provider = WheniskickoffProvider()
    matches = await provider.get_matches()

    assert all("home" in m and "away" in m for m in matches)
```

---

## File Structure

```
api/
├── main.py                        # App, middleware, router includes
├── di.py                          # Dependency injection factories
├── routers/
│   ├── __init__.py
│   ├── tournament.py              # HTTP endpoints
│   └── historical.py
├── services/
│   ├── __init__.py
│   ├── tournament.py              # Business logic
│   └── historical.py
├── repositories/
│   ├── __init__.py
│   ├── interfaces.py              # ABC interfaces
│   ├── tournament.py              # Data access
│   └── historical.py
├── mappers/
│   ├── __init__.py
│   ├── tournament.py              # Transformations
│   └── historical.py
├── models/
│   ├── __init__.py
│   ├── tournament.py              # Domain models (Pydantic)
│   └── historical.py
├── providers/
│   ├── __init__.py
│   ├── interfaces.py              # Provider interfaces (keep)
│   ├── wheniskickoff.py           # HTTP client
│   ├── openfootball.py
│   └── statsbomb.py
├── exceptions.py                  # Domain exceptions
└── tests/
    ├── services/
    ├── repositories/
    ├── providers/
    └── mappers/
```

---

## Benefits

| Benefit | How |
|---------|-----|
| **Domain logic isolation** | Services have no HTTP or external API knowledge |
| **Testable** | Mock repositories, test services with pure unit tests |
| **Swap data sources** | Change providers without touching business logic |
| **Clear caching** | Services own strategy, repositories own fetch |
| **Single responsibility** | Each layer does one thing well |
| **Team-friendly** | Clear boundaries for parallel work |

---

## Trade-offs

| Trade-off | Mitigation |
|-----------|------------|
| More files | Clear organization, each file is smaller |
| More abstraction | Worth it for domain isolation (your goal C) |
| Initial refactoring cost | Do incrementally, one module at a time |
| DI boilerplate | Use simple factories, avoid complex containers |

---

## Next Steps

1. **Review this spec** — validate the architecture matches your needs
2. **Plan migration** — decide: all-at-once or incremental module-by-module
3. **Start with one endpoint** — e.g., `/tournament/matches` as proof of concept
4. **Iterate** — adjust based on learnings

---

## Questions?

Before implementation, clarify:
- Do you want repository interfaces or concrete implementations only?
- Should caching stay in services or move to a separate cache layer?
- Any specific business logic you want to isolate first?