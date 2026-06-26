# Mundial 2026 — World Cup Companion

🔗 [worldcup-2026.rami992009.workers.dev](https://worldcup-2026.rami992009.workers.dev)

Seguí el Mundial 2026: grupos, fixture, cuadro eliminatorio, mapa de sedes, canales de TV y contexto histórico de cada selección.

## Funcionalidades

**Explorador del torneo** — Grupos con tabla, fixture completo con hora local, cuadro eliminatorio Round of 32 → Final, y widget en vivo.

**Mapa de sedes** — Las 16 sedes en México, USA y Canadá sobre mapa, con filtro por región y detalle de cada estadio (capacidad, huso, partidos).

**Contexto histórico** — Al ver un partido, mostramos los últimos enfrentamientos en Mundiales pasados. Performance histórica de cada selección con stats (victorias, empates, derrotas, goles). Navegación head-to-head entre equipos.

**Canales de TV** — Guía de canales por país para ver los partidos, filtrable por país.

## Stack

| Capa | Tecnología |
|------|-----------|
| API | FastAPI + httpx |
| Frontend | React 19 + TypeScript + Vite |
| CSS | Tailwind CSS v4 |
| Mapas | Leaflet |
| Bracket | D3 |
| Tests | Playwright (E2E) + Vitest (unit) |

## Atribuciones

Toda la data se consume dinámicamente sin commitear nada al repo. Las atribuciones requeridas se muestran en el footer de la app.

| Fuente | Licencia |
|--------|----------|
| [wheniskickoff API](https://wheniskickoff.com/data/v1/matches.json) — fixture, grupos, sedes, TV | Fair use. Atribución appreciated. |
| [OpenFootball World Cup](https://github.com/openfootball/worldcup) — datos históricos | CC0 1.0 |
| [StatsBomb Open Data](https://github.com/statsbomb/open-data) — eventos históricos | Propietaria permisiva. Requiere atribución + logo al publicar análisis. |
| [Reep Register](https://github.com/withqwerty/reep) | CC0 1.0 |

Crestas de selecciones servidas por wheniskickoff, banderas por flagcdn.com.

## Desarrollo

```
/
├── api/    → FastAPI (puerto 8000)
└── web/    → React + Vite (puerto 5173)
```

**API:**
```bash
cd api
uv run fastapi dev main.py --port 8000
```

**Web:**
```bash
cd web
pnpm dev
```

**Tests:**
```bash
# E2E
cd web && pnpm test

# Unit
cd web && pnpm test:unit

# API
cd api && uv run pytest
```
