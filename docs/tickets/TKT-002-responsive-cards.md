# TKT-002 — Responsive match cards en mobile

**Prioridad:** Baja
**Status:** 🟡 Pendiente
**Dependencias:** Ninguna
**Colisiones:** Ninguna

## Descripción

Los match cards en mobile se apiñan con `justify-between`. Revisar breakpoints para que en pantallas chicas el score y los equipos no se superpongan.

## Files

| Archivo | Cambio |
|---------|--------|
| `web/src/routes/HistoricalTournament.tsx` | CSS/tailwind en `MatchCard` interno (función local) |
| `web/src/routes/Team.tsx` | CSS/tailwind en `MatchCard` interno |
| `web/src/routes/HistoricalMatchDetail.tsx` | CSS/tailwind en MatchDetail |

## Notas

- Solo tocar clases CSS/Tailwind, no estructura ni lógica
- Testear en viewport < 640px
- No modificar componentes compartidos
