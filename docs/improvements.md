# Mejoras pendientes

## Alta ✅

- [x] **Skeleton loading states** — reemplazados todos los `"Cargando..."` de texto plano por esqueletos CSS con `animate-pulse` que mantienen el layout estable mientras carga. Componente compartido en `web/src/components/Skeleton.tsx` con `Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonTable`.
- [x] **Match cards linkeables** — cada partido histórico linkea a `/historical/{year}/{matchId}` con una vista detalle dedicada (`HistoricalMatchDetail.tsx`). El ID se computa en el frontend como `{year}-{team1-slug}-vs-{team2-slug}`.

## Media

### Página de equipo (`/team/:id`)
Mostrar todos los partidos de una selección a través de los torneos (1930–2026).

**Endpoint existente:** `GET /historical/head-to-head?team1=X&team2=Y`

### Botón de reintentar en errores
Hoy las páginas muestran el error y se quedan estáticas. Agregar un botón "Reintentar" que re-ejecute la llamada.

**Archivos a modificar:** todos los `routes/*.tsx` con manejo de error.

### Torneos sin grupos (1930–1938)
Cuando el API devuelve `groups: []`, la página se ve vacía de grupos. Agregar mensaje "Sin datos de grupos para este torneo" en lugar de no renderizar nada.

**Archivo:** `web/src/routes/HistoricalTournament.tsx:70-94`

## Baja / Quality of life

### i18n parcial
Mezcla de español/inglés en labels. Ej: el historical usa `round_of_16` del API pero traduce a "Octavos". Unificar criterio.

### Responsive
Los match cards en mobile se apiñan con `justify-between`. Revisar breakpoints.

### Scroll position on navigation
Navegar a un torneo histórico largo (ej. 1930) no resetea scroll al tope. React Router no hace scroll-to-top por defecto. Agregar `ScrollRestoration` o un useEffect en `App.tsx`.

### LoadingBar timing
La `LoadingBar` actual (300ms) asume que el contenido carga rápido. Si una página tarda más (API lenta), la barra se completa antes de que termine. Ideal: conectar la barra al estado de carga real de la página (ej. vía un contexto global o `useNavigation` de React Router data APIs).

## Arquitectura / Deuda técnica

### Migrar a createBrowserRouter
Usar el data router de React Router v6.4+ permitiría:
- `useNavigation()` para tracking global de navegación (mejor loading bar)
- Carga de datos via loaders (menos boilerplate en cada ruta)
- Manejo de errores centralizado via errorElement

### Tests flaky
Los tests de Historical (`should navigate to Historical page`, `should display tournaments list`) fallan intermitentemente cuando corren en paralelo — race condition con el cache de la API. Solución: wrapper de fixture que precargue el cache, o test con retry.
