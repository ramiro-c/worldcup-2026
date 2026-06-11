# TKT-002 — Responsive match cards en mobile

**Prioridad:** Baja
**Status:** ✅ Done
**Dependencias:** Ninguna
**Colisiones:** Ninguna

## Descripción

Los match cards en mobile se apiñan con `justify-between`. Revisar breakpoints para que en pantallas chicas el score y los equipos no se superpongan.

## Files

| Archivo | Estado |
|---------|--------|
| `web/src/routes/HistoricalTournament.tsx` | ✅ `flex-col sm:flex-row`, gap responsive |
| `web/src/routes/Team.tsx` | ✅ `flex-col sm:flex-row`, gap responsive |
| `web/src/routes/HistoricalMatchDetail.tsx` | ✅ `flex-col sm:flex-row`, layout vertical en mobile |

## Notas

- Mobile (< 640px): equipos se stackean verticalmente con score centrado
- Desktop: layout horizontal original
- Score con `min-w-[80px]` para evitar colapso
