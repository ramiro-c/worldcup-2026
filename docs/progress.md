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

### openfootball — Historical fixtures ✅

- [x] Repo exploration completa (23 mundiales, 1930–2026)
- [x] `OpenfootballParser` — parsea Football.TXT a dicts estructurados
  - [x] Grupos, partidos de grupo,淘汰, penales, goleadores
  - [x] Edge cases: golden goal, own goals, replays, HT scores
- [x] `OpenfootballProvider` con cache-Aside TTL 5 min
- [x] `GET /historical/tournaments`
- [x] `GET /historical/tournaments/{year}`
- [x] `GET /historical/head-to-head?team1=X&team2=Y`
- [x] Tests Bruno (3 files, 12 tests)

### StatsBomb — Historical events ✅

- [x] Repo exploration: 8 mundiales disponibles (1958–2022)
- [x] `StatsBombProvider` con cache-Aside TTL 5 min
  - [x] GET competitions, matches, events, lineups
- [x] `GET /historical/competitions`
- [x] `GET /historical/matches?competition=X&season=Y`
- [x] `GET /historical/matches/{match_id}/events`
- [x] `GET /historical/matches/{match_id}/lineups`
- [x] Tests Bruno (1 file, 3 tests)

### Docker ✅
- [x] docker-compose builds y corre api + web
- [x] CI=true para evitar pnpm TTY prompt en web

## Phase 3 — Web: Core views ✅

- [x] Home page with nav cards
- [x] Groups view (tabla de posiciones con puntos, DG, clasificación)
- [x] Fixtures view (filtro grupos/eliminatorias, VS, EN VIVO)
- [x] Placeholder de eliminatorias (listo para D3 cuando arranquen)

## Phase 4 — Web: Extended views ✅

- [x] Venues view (filtro por región, agrupado por país, Google Maps link)

## Phase 5 — Live data ⏳

- [ ] Polling wheniskickoff durante el torneo

## Phase 5 — Live data ⏳

- [ ] Polling wheniskickoff durante el torneo
