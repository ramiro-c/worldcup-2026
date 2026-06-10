# Progreso — Copa 2026

## Phase 1 — Setup ✅

- [x] FastAPI skeleton (uv, health endpoint, CORS)
- [x] React + Vite + TypeScript + Tailwind v4 + React Router
- [x] Vite proxy config (/api → localhost:8000)
- [x] CLAUDE.md y README para root, api/, web/
- [x] docker-compose.yml (api + web)
- [x] Bruno tests: 6 requests, 25 tests

## Phase 2 — API: Data providers

### wheniskickoff proxy ✅
- [x] `WheniskickoffProvider` con cache-Aside TTL 5 min
- [x] Endpoints: /tournament/{groups,teams,venues,matches,tv}
- [x] Tests Bruno: 6 endpoints, 25 tests

### openfootball — Historical fixtures ⏳

#### A. Repo exploration
- [ ] Fetch repo tree de openfootball/worldcup (años disponibles)
- [ ] Identificar formato de cup.txt, cup_finals.txt
- [ ] Mapear estructura de datos a modelos Pydantic

#### B. Parser
- [ ] `OpenfootballParser` — parsea TXT a dicts estructurados
  - [ ] Parsear header del torneo (año, nombre)
  - [ ] Parsear grupos
  - [ ] Parsear partidos de grupo (fecha, equipos, resultado)
  - [ ] Parsear partidos de淘汰 (fase, equipos, resultado, penales)
- [ ] Manejar edge cases: goles, penales, alineaciones, tarjetas

#### C. Provider + Cache
- [ ] `OpenfootballProvider` — fetchea raw de GitHub URLs
- [ ] Cache-Aside con TTL (mismo patrón que wheniskickoff)
- [ ] Fallback a cache si falla fetch

#### D. Endpoints
- [ ] `GET /historical/tournaments` — lista de mundiales disponibles
- [ ] `GET /historical/tournaments/{year}` — fixture completo de ese año
- [ ] `GET /historical/head-to-head?team1=X&team2=Y` — historial entre 2 selecciones
- [ ] Tests Bruno

### StatsBomb — Historical events ⏳

#### A. Repo exploration
- [ ] Fetch competitions.json → filtrar World Cups
- [ ] Identificar match_ids de mundiales
- [ ] Mapear estructura de matches, events, lineups

#### B. Provider
- [ ] `StatsBombProvider` — fetchea raw de GitHub URLs
  - [ ] GET competitions
  - [ ] GET matches por competición
  - [ ] GET events por match_id
  - [ ] GET lineups por match_id
- [ ] Cache-Aside con TTL

#### C. Endpoints
- [ ] `GET /historical/competitions` — competiciones disponibles
- [ ] `GET /historical/matches?competition=X&season=Y` — partidos
- [ ] `GET /historical/matches/{match_id}/events` — eventos de un partido
- [ ] `GET /historical/matches/{match_id}/lineups` — alineaciones
- [ ] Tests Bruno

## Phase 3 — Web: Core views ⏳

- [ ] Groups view (tabla de posiciones)
- [ ] Fixtures view (lista de partidos por fecha)
- [ ] Bracket eliminatorio (D3)

## Phase 4 — Web: Extended views ⏳

- [ ] Mapa de sedes (Leaflet)
- [ ] Match detail + historial de enfrentamientos
- [ ] Group state calculator

## Phase 5 — Live data ⏳

- [ ] Polling wheniskickoff durante el torneo
