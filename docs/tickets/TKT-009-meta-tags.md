# TKT-009 — Meta tags dinámicos por ruta

**Prioridad:** Baja
**Status:** 🟡 Pendiente
**Dependencias:** Ninguna
**Colisiones:** Ninguna

## Descripción

Cada ruta debería tener `<title>` y `<meta description>` dinámicos para SEO y social sharing:
- Home → "Copa Mundial 2026 | Fixture, Grupos, Sedes"
- Grupos → "Grupos del Mundial 2026"
- Fixture → "Fixture del Mundial 2026"
- Historical → "Historial de Mundiales"
- `/historical/2022` → "Mundial 2022 — Qatar"
- `/team/Argentina` → "Argentina en Mundiales"
- `/historical/2022/final` → "Final 2022: Argentina vs Francia"

## Files

| Archivo | Cambio |
|---------|--------|
| `web/src/index.html` | Templates de title/meta por defecto |
| `web/src/routes/*.tsx` | Efectos `document.title` en cada ruta |

## Notas

- Usar `useEffect` con `document.title` en cada componente
- Opcional: `react-helmet-async` si hay muchas rutas
- No requiere build step, solo efectos