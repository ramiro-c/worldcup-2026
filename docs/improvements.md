# Mejoras — Copa 2026

> Cada mejora tiene su ticket individual en `docs/tickets/` con archivos mapeados y tracking de estado. Usar `docs/tickets/INDEX.md` como tablero.

## Alta ✅

- [x] **Skeleton loading states** — reemplazados todos los `"Cargando..."` de texto plano por esqueletos CSS con `animate-pulse` que mantienen el layout estable mientras carga. Componente compartido en `web/src/components/Skeleton.tsx` con `Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonTable`.
- [x] **Match cards linkeables** — cada partido histórico linkea a `/historical/{year}/{matchId}` con una vista detalle dedicada (`HistoricalMatchDetail.tsx`). El ID se computa en el frontend como `{year}-{team1-slug}-vs-{team2-slug}`.

## Media ✅

- [x] **Página de equipo (`/team/:teamName`)** — Ruta, componente y endpoint `GET /historical/teams/{teamName}/matches` funcionando.
- [x] **Torneos sin grupos (1930–1938)** — `HistoricalTournament.tsx` ya muestra "Sin datos de grupos para este torneo".
- [x] **Responsive match cards en mobile** — Layout vertical en < 640px, horizontal en sm+.
- [x] **RetryButton compartido** — Componente `RetryButton.tsx` creado y adoptado en todas las rutas principales.
- [x] **Skeleton + RetryButton en Match.tsx** — Partidos en vivo con loading states y retry.
- [x] **Ruta 404** — `NotFound.tsx` con catch-all `*` route.

## Baja ✅

- [x] **LoadingBar conectada a navegación real** — `useNavigation()` de React Router, sin timer fijo.
- [x] **i18n parcial — español** — Toda la UI unificada en español.
- [x] **Breadcrumbs** — Componente global en layout, manejo de parámetros de ruta.
- [x] **Meta tags dinámicos** — `PageTitle.tsx` con title por ruta integrado en layout.

## Deuda técnica ✅

- [x] **Migración a createBrowserRouter** — React Router v6.4+ data router con rutas anidadas.
- [x] **Tests flaky** — Retry configurado en suite de tests.

## Hecho (no requiere ticket)

- [x] **Scroll position on navigation** — `window.scrollTo(0, 0)` en cada cambio de ruta
- [x] **TV route (`/tv`)** — Página dedicada con filtro por país (select en vez de chips)
- [x] **Head-to-head (`/head-to-head/:team1/:team2`)** — Historial entre dos equipos
- [x] **NavGrid en Home** — Grid de navegación con cards
- [x] **Venue detail (`/venues/:venueId`)** — Mapa Leaflet por sede
- [x] **LiveWidget** — Polling de partidos en vivo (60s)
- [x] **ErrorBoundary** — Wrapper global para errores de render
- [x] **ErrorState** — Componente compartido con retry + link al inicio
- [x] **PageTitle** — Title dinámico por ruta
- [x] **Team alias resolution** — Resuelve variantes históricas (West Germany → Germany, etc.)
