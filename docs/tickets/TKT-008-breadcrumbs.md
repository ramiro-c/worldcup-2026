# TKT-008 — Breadcrumbs en páginas anidadas

**Prioridad:** Baja
**Status:** 🟡 Pendiente
**Dependencias:** Ninguna
**Colisiones:** Ninguna

## Descripción

Falta breadcrumb trail en páginas anidadas para navegación jerárquica:
- `/historical/:year` → "Historial › 2022"
- `/historical/:year/:matchId` → "Historial › 2022 › Final"
- `/team/:teamName` → "Historial › Argentina"

## Files

| Archivo | Cambio |
|---------|--------|
| `web/src/components/Breadcrumbs.tsx` | **Crear** — componente compartido |
| `web/src/routes/HistoricalTournament.tsx` | Agregar `<Breadcrumbs>` |
| `web/src/routes/HistoricalMatchDetail.tsx` | Agregar `<Breadcrumbs>` |
| `web/src/routes/Team.tsx` | Agregar `<Breadcrumbs>` |

## Notas

- Componente simple que recibe `items: [{ label, to? }]`
- Separador `›` entre items
- Primer item siempre "Historial" (link a `/historical`)
- Último item sin link (página actual)