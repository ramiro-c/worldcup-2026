# TKT-010 — Ruta 404 para URLs inválidas

**Prioridad:** Media
**Status:** 🟡 Pendiente
**Dependencias:** Ninguna
**Colisiones:** Ninguna

## Descripción

No hay manejo de rutas inválidas. Si el usuario va a `/foobar` o `/historical/9999`, la app muestra página en blanco o error genérico. Agregar ruta `*` con página 404 amigable.

## Files

| Archivo | Cambio |
|---------|--------|
| `web/src/routes/NotFound.tsx` | **Crear** — página 404 con link a Home |
| `web/src/App.tsx` | Agregar ruta `*` al final del router |

## Notas

- Diseño simple: título "404", mensaje "Página no encontrada", link a Home
- Incluir ícono o ilustración opcional
- No modificar estructura del router existente