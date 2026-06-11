# Mejoras — Copa 2026

> Cada mejora tiene su ticket individual en `docs/tickets/` con archivos mapeados y tracking de estado. Usar `docs/tickets/INDEX.md` como tablero.

## Alta ✅

- [x] **Skeleton loading states** — reemplazados todos los `"Cargando..."` de texto plano por esqueletos CSS con `animate-pulse` que mantienen el layout estable mientras carga. Componente compartido en `web/src/components/Skeleton.tsx` con `Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonTable`.
- [x] **Match cards linkeables** — cada partido histórico linkea a `/historical/{year}/{matchId}` con una vista detalle dedicada (`HistoricalMatchDetail.tsx`). El ID se computa en el frontend como `{year}-{team1-slug}-vs-{team2-slug}`.

## Media ✅ (ya en código)

- [x] **Página de equipo (`/team/:teamName`)** — Ruta, componente y endpoint `GET /historical/teams/{teamName}/matches` funcionando.
- [x] **Torneos sin grupos (1930–1938)** — `HistoricalTournament.tsx:148` ya muestra "Sin datos de grupos para este torneo".

## Pendientes

### TKT-001 — RetryButton compartido
Crear componente `<RetryButton />` y reemplazar el patrón duplicado en todas las rutas.
→ [Ver ticket](tickets/TKT-001-retry-button.md)

### TKT-002 — Responsive match cards
Ajustar breakpoints en match cards para mobile.
→ [Ver ticket](tickets/TKT-002-responsive-cards.md)

### TKT-003 — LoadingBar timing
Conectar la barra de carga al estado real en vez de timer fijo.
→ [Ver ticket](tickets/TKT-003-loadingbar-timing.md)

### TKT-004 — i18n parcial
Unificar español/inglés en labels de UI.
→ [Ver ticket](tickets/TKT-004-i18n.md)

### TKT-005 — Migrar a createBrowserRouter
Refactor a data router de React Router v6.4+.
→ [Ver ticket](tickets/TKT-005-router-migration.md)

### TKT-006 — Tests flaky
Fix race condition en tests de historical.
→ [Ver ticket](tickets/TKT-006-flaky-tests.md)

## Hecho (no requiere ticket)

- [x] **Scroll position on navigation** — `App.tsx` ya hace `window.scrollTo(0, 0)` en cada ruta
