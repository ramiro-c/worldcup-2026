# TKT-006 — Tests flaky en historical

**Prioridad:** Deuda técnica
**Status:** 🟡 Pendiente
**Dependencias:** Ninguna
**Colisiones:** Ninguna

## Descripción

Los tests de Historical (`should navigate to Historical page`, `should display tournaments list`) fallan intermitentemente cuando corren en paralelo — race condition con el cache de la API. Solución: wrapper de fixture que precargue el cache, o test con retry.

## Files

| Archivo | Cambio |
|---------|--------|
| `web/tests/app.spec.ts` | Agregar fixture con cache warmup o retry |

## Notas

- Solo tocar archivo de tests
- No modificar lógica de producción
