# Tickets — Mundial 2026

Tablero de seguimiento para mejoras. Cada ticket es independiente por archivo, diseñado para agentes en paralelo sin colisiones.

## Estado

| Ticket | Título | Prioridad | Fileset | Estado |
|--------|--------|-----------|---------|--------|
| TKT-001 | Componente RetryButton compartido | Media | `components/`, `routes/` | ✅ Done |
| TKT-002 | Responsive match cards en mobile | Baja | `routes/` (MatchCard internos) | ✅ Done |
| TKT-003 | LoadingBar conectada a carga real | Baja | `LoadingBar.tsx`, `App.tsx`, `useAsync.ts` | ✅ Done (vía TKT-005) |
| TKT-004 | i18n parcial — unificar español/inglés | Baja | `routes/*.tsx` (labels) | ✅ Done |
| TKT-005 | Migrar a createBrowserRouter | Deuda | `App.tsx`, `main.tsx` | ✅ Done |
| TKT-006 | Tests flaky — race condition en historical | Deuda | `tests/app.spec.ts` | ✅ Done |
| TKT-007 | Skeleton + RetryButton en Match.tsx | Media | `routes/Match.tsx` | ✅ Done |
| TKT-008 | Breadcrumbs en páginas anidadas | Baja | `components/`, `routes/` | ✅ Done |
| TKT-009 | Meta tags dinámicos por ruta | Baja | `PageTitle.tsx`, `App.tsx`, `index.html` | ✅ Done |
| TKT-010 | Ruta 404 para URLs inválidas | Media | `routes/NotFound.tsx`, `App.tsx` | ✅ Done |

## Hecho (no requiere ticket)

- ✅ **Scroll position on navigation** — `App.tsx` ya hace `window.scrollTo(0, 0)` en cada ruta
- ✅ **Torneos sin grupos (1930–1938)** — `HistoricalTournament.tsx` ya muestra "Sin datos de grupos"
- ✅ **Página de equipo (`/team/:teamName`)** — Ruta y endpoint existen, listo
- ✅ **TV route (`/tv`)** — Página dedicada con filtro por país
- ✅ **Head-to-head (`/head-to-head/:team1/:team2`)** — Ruta y endpoint funcionando
- ✅ **NavGrid en Home** — Componente extraído, reutilizable
- ✅ **Venue detail (`/venues/:venueId`)** — Con mapa Leaflet
- ✅ **LiveWidget** — Polling de partidos en vivo con auto-refresh
- ✅ **ErrorBoundary** — Class component que envuelve todas las rutas
- ✅ **ErrorState** — Componente compartido de error con retry + link al inicio
- ✅ **PageTitle** — Title dinámico por ruta (layout global)
