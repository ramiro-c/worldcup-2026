# TKT-008 — Breadcrumbs en páginas anidadas

**Prioridad:** Baja
**Status:** ✅ Done
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
| `web/src/App.tsx` | Agregar `<Breadcrumbs />` en layout global |

## Notas

- Componente integrado globalmente en el layout (App.tsx), aplica a todas las rutas
- Manejo de parámetros de ruta (salta segmentos como `:name`, `:id`)
- Separador `›` entre items
- Último item sin link (página actual)
