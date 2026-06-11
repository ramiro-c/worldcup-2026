# TKT-007 — Skeleton y RetryButton en Match.tsx

**Prioridad:** Media
**Status:** 🟡 Pendiente
**Dependencias:** TKT-001 (RetryButton compartido)
**Colisiones:** Ninguna

## Descripción

La ruta `Match.tsx` (partidos en vivo de la API wheniskickoff) no tiene skeleton loading ni retry button. Agregar ambos para consistencia con el resto de las rutas.

## Files

| Archivo | Cambio |
|---------|--------|
| `web/src/routes/Match.tsx` | Agregar skeleton states + RetryButton en error |

## Notas

- Usar `Skeleton` y `SkeletonCard` existentes
- Usar `RetryButton` de TKT-001
- No modificar `useAsync.ts` ni la llamada a la API