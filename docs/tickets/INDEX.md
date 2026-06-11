# Tickets — Copa 2026

Tablero de seguimiento para mejoras. Cada ticket es independiente por archivo, diseñado para agentes en paralelo sin colisiones.

## Estado

| Ticket | Título | Prioridad | Fileset | Estado |
|--------|--------|-----------|---------|--------|
| TKT-001 | Componente RetryButton compartido | Media | `components/`, `routes/` | 🟡 Pendiente |
| TKT-002 | Responsive match cards en mobile | Baja | `routes/` (MatchCard internos) | ✅ Done |
| TKT-003 | LoadingBar conectada a carga real | Baja | `LoadingBar.tsx`, `App.tsx` | 🟡 Pendiente |
| TKT-004 | i18n parcial — unificar español/inglés | Baja | `routes/*.tsx` (labels) | ✅ Done |
| TKT-005 | Migrar a createBrowserRouter | Deuda | `App.tsx`, `main.tsx` | 🟡 Pendiente |
| TKT-006 | Tests flaky — race condition en historical | Deuda | `tests/app.spec.ts` | 🟡 Pendiente |
| TKT-007 | Skeleton + RetryButton en Match.tsx | Media | `routes/Match.tsx` | 🟡 Pendiente |
| TKT-008 | Breadcrumbs en páginas anidadas | Baja | `components/`, `routes/` | 🟡 Pendiente |
| TKT-009 | Meta tags dinámicos por ruta | Baja | `routes/*.tsx`, `index.html` | 🟡 Pendiente |
| TKT-010 | Ruta 404 para URLs inválidas | Media | `routes/NotFound.tsx`, `App.tsx` | 🟡 Pendiente |

## Archivo fuente

`docs/improvements.md` — lista original de mejoras.

## Paralelismo seguro

| Grupo | Tickets | Motivo |
|-------|---------|--------|
| **A** | TKT-001, TKT-003, TKT-006 | Sin archivos compartidos |
| **B** | TKT-002, TKT-003, TKT-004 | Sin archivos compartidos |
| **C** | TKT-005 solo | Requiere `main.tsx` + `App.tsx` — colisiona con TKT-003 |

### Reglas

- Un agente por ticket
- Cada ticket declara `Files:` exactos — no tocar otros archivos
- Al terminar, actualizar estado en este INDEX.md
- Si dos tickets comparten un archivo, se ejecutan secuencialmente

## Hecho (ya en código, no requiere ticket)

- ✅ **Scroll position on navigation** — `App.tsx` ya hace `window.scrollTo(0, 0)` en cada ruta
- ✅ **Torneos sin grupos (1930–1938)** — `HistoricalTournament.tsx:148` ya muestra "Sin datos de grupos"
- ✅ **Página de equipo (`/team/:teamName`)** — Ruta y endpoint existen, listo
