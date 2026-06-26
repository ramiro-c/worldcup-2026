# Progreso — Mundial 2026

## Phase 1 — Setup ✅

- [x] FastAPI skeleton (uv, health endpoint, CORS)
- [x] React + Vite + TypeScript + Tailwind v4 + React Router
- [x] Vite proxy config (/api → localhost:8000)
- [x] CLAUDE.md y README para root, api/, web/
- [x] docker-compose.yml (api + web)
- [x] Bruno tests: 6 requests, 25 tests

## Phase 2 — API: Data providers ✅

### wheniskickoff proxy ✅
- [x] `WheniskickoffProvider` con cache-aside TTL 5 min (60s para matches en vivo)
- [x] Endpoints: /tournament/{groups,teams,venues,matches,match/{id},tv}
- [x] Tests Bruno: 6 endpoints, 25 tests

### openfootball — Historical fixtures ✅

- [x] Repo exploration completa (23 mundiales, 1930–2026)
- [x] `OpenfootballParser` — parsea Football.TXT a dicts estructurados
  - [x] Grupos, partidos de grupo, eliminatorias, penales, goleadores
  - [x] Edge cases: golden goal, own goals, replays, HT scores
- [x] `OpenfootballProvider` con cache-aside TTL 5 min
- [x] `GET /historical/tournaments`
- [x] `GET /historical/tournaments/{year}`
- [x] `GET /historical/head-to-head?team1=X&team2=Y`
- [x] `GET /historical/teams/{teamName}/matches`
- [x] Team alias resolution (West Germany → Germany, USSR → Russia, etc.)
- [x] Tests Bruno (3 files, 12 tests)

### StatsBomb — Historical events ✅

- [x] Repo exploration: 8 mundiales disponibles (1958–2022)
- [x] `StatsBombProvider` con cache-aside TTL 5 min
  - [x] GET competitions, matches, events, lineups
- [x] `GET /historical/competitions`
- [x] `GET /historical/matches?competition=X&season=Y`
- [x] `GET /historical/matches/{match_id}/events`
- [x] `GET /historical/matches/{match_id}/lineups`
- [x] Tests Bruno (1 file, 3 tests)

### Provider architecture ✅
- [x] ABC interfaces en `providers/interfaces.py` (ITournamentDataProvider, IHistoricalDataProvider, IHeadToHeadProvider, ITeamDataProvider, IEventDataProvider)
- [x] `MemoryCache` con stale-while-revalidate
- [x] Data mappers en routers (map_groups, map_teams, map_venues, map_matches, map_match)

### Docker ✅
- [x] docker-compose builds y corre api + web
- [x] CI=true para evitar pnpm TTY prompt en web

## Phase 3 — Web: Core views ✅

- [x] Home page with NavGrid, hero, LiveWidget, preview sections
- [x] Groups view (tabla de posiciones con puntos, DG, clasificación)
- [x] Fixtures view (filtro grupos/eliminatorias, VS, EN VIVO)
- [x] Bracket placeholder (listo para D3 cuando arranquen)
- [x] Venues view (filtro por región, agrupado por país, Google Maps link)
- [x] Venue detail (`/venues/:venueId`) con mapa Leaflet

## Phase 4 — Web: Extended views ✅

- [x] Historical list + detail views (grupos + partidos por etapa)
- [x] Historical match detail page
- [x] Team page (`/team/:name`) con todos los partidos históricos
- [x] Head-to-head page (`/head-to-head/:team1/:team2`)
- [x] TV page (`/tv`) con filtro por país
- [x] Skeleton loading states en todas las rutas
- [x] RetryButton compartido en todos los estados de error
- [x] ErrorBoundary global + ErrorState compartido
- [x] Scroll-to-top automático en navegación
- [x] Empty state para torneos sin grupos (1930–1938)

## Architecture ✅

- [x] Migración a createBrowserRouter (React Router v6.4+)
- [x] useNavigation() para loading bar en tiempo real
- [x] Estructura de rutas anidadas con layout + Outlet
- [x] Breadcrumbs global en layout
- [x] PageTitle dinámico en layout

## UX ✅

- [x] Eliminado PageTransition (causaba flash de contenido)
- [x] LoadingBar animada en el tope del viewport (conectada a navegación real)
- [x] Footer sticky con atribuciones de fuentes
- [x] Match cards históricos linkeables a detalle
- [x] Nombres de equipo linkean a su página
- [x] RetryButton compartido en todos los errores
- [x] Responsive match cards en mobile (< 640px: layout vertical)
- [x] Mobile menu como overlay
- [x] i18n: toda la UI en español
- [x] NavGrid component extraído y reutilizable
- [x] LiveWidget con polling 60s para partidos en vivo

## Testing ✅

- [x] Vitest + jsdom + jest-dom matchers
- [x] Unit tests: Breadcrumbs, ErrorState, NavGrid
- [x] API tests: aliases, match 404 handling
- [x] Playwright e2e con retry configurado

## Deployment ⏳

- [x] Cloudflare Workers (API)
- [x] Render (web) con GitHub Actions auto-deploy
- [x] Cloudflare KV namespace para analytics
- [x] CORS configurado para ambos targets

## Documentation ✅

- [x] 10 tickets en docs/tickets/ (TKT-001 a TKT-010) — todos done
- [x] INDEX.md como tablero de estado
- [x] improvements.md con mejoras priorizadas

## Live data ⏳

- [ ] Polling wheniskickoff durante el torneo (LiveWidget ya tiene polling 60s, falta activar cuando empiece el torneo)
