# TKT-001 — Componente RetryButton compartido

**Prioridad:** Media
**Status:** 🟡 Pendiente
**Dependencias:** Ninguna
**Colisiones:** Ninguna (archivos exclusivos)

## Descripción

Hoy el patrón de "Reintentar" está duplicado en varias rutas (Team.tsx, HistoricalTournament.tsx). Crear un componente compartido `<RetryButton onRetry={refetch} message="..." />` y aplicarlo donde falte.

## Files

| Archivo | Cambio |
|---------|--------|
| `web/src/components/RetryButton.tsx` | **Crear** — componente compartido |
| `web/src/routes/Team.tsx` | Usar `RetryButton` (ya existe el botón, reemplazar) |
| `web/src/routes/HistoricalTournament.tsx` | Usar `RetryButton` (ya existe) |
| `web/src/routes/Groups.tsx` | Agregar `RetryButton` si no tiene |
| `web/src/routes/Fixtures.tsx` | Agregar `RetryButton` si no tiene |
| `web/src/routes/Venues.tsx` | Agregar `RetryButton` si no tiene |
| `web/src/routes/Bracket.tsx` | Agregar `RetryButton` si no tiene |
| `web/src/routes/Match.tsx` | Agregar `RetryButton` si no tiene |
| `web/src/routes/Historical.tsx` | Agregar `RetryButton` si no tiene |

## Notas

- NO modificar `useAsync.ts` — ya expone `refetch`
- El componente debe ser simple: botón con estilo consistente + texto opcional
- No tocar otros componentes ni lógica
