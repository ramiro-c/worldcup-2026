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

### openfootball (histórico) ⏳
- [ ] Provider que fetchea raw de GitHub
- [ ] Parseo de cup.txt, cup_finals.txt, cup_stadiums.csv
- [ ] Endpoints: /historical/...

### StatsBomb (eventos) ⏳
- [ ] Provider que fetchea raw de GitHub
- [ ] Parseo de eventos de Mundiales pasados
- [ ] Endpoints: /historical/...

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
