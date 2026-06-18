# TKT-009 — Meta tags dinámicos por ruta

**Prioridad:** Baja
**Status:** ✅ Done (parcial)
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
| `web/src/components/PageTitle.tsx` | **Crear** — componente compartido |
| `web/src/App.tsx` | Agregar `<PageTitle />` en layout global |
| `web/src/index.html` | Title por defecto "Copa 2026" |

## Notas

- `PageTitle.tsx` integrado globalmente en el layout (App.tsx)
- Cubre rutas estáticas: `/`, `/groups`, `/fixtures`, `/bracket`, `/venues`, `/historical`
- Title format: `"{title} | Copa Mundial 2026"`
- Rutas con parámetros (`/team/:name`, `/match/:id`, etc.) usan title genérico
- `<meta description>` actualizable dinámicamente (requiere tag en index.html para rutas parametrizadas)
