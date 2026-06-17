# Copa 2026 — Web

Frontend React + TypeScript + Vite para explorar el Mundial 2026.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- React Router
- Leaflet (mapa sedes)
- D3 (cuadro eliminatorio)
- Vitest + Testing Library (unit tests)
- Playwright (E2E tests)

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Home con widget en vivo, próximos partidos y sedes |
| `/groups` | Grupos y tabla de posiciones |
| `/fixtures` | Fixture completo con filtros |
| `/bracket` | Cuadro eliminatorio |
| `/venues` | Mapa y lista de sedes |
| `/venues/:id` | Detalle de sede |
| `/match/:id` | Detalle de partido |
| `/historical` | Mundiales desde 1930 |
| `/historical/:year` | Detalle de Mundial histórico |
| `/team/:name` | Stats y partidos históricos de un equipo |
| `/head-to-head/:team1/:team2` | Enfrentamientos entre equipos |
| `/tv` | Canales de TV por país |

## Desarrollo

```bash
pnpm dev
```

Proxy configurado: `/api` → `localhost:8000`.

## Tests

```bash
# E2E
pnpm test

# Unit
pnpm test:unit
```
