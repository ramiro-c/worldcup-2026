# TKT-005 — Migrar a createBrowserRouter

**Prioridad:** Deuda técnica
**Status:** 🟡 Pendiente
**Dependencias:** Ninguna
**Colisiones:** Con TKT-003 (ambos tocan `App.tsx`)

## Descripción

Migrar de `<BrowserRouter>` + `<Routes>` a `createBrowserRouter` de React Router v6.4+. Esto habilita:
- `useNavigation()` para loading bar real (mejor que TKT-003 approach manual)
- Carga de datos vía loaders
- Manejo de errores centralizado vía `errorElement`

## Files

| Archivo | Cambio |
|---------|--------|
| `web/src/main.tsx` | Usar `RouterProvider` con `createBrowserRouter` |
| `web/src/App.tsx` | Reemplazar `Routes` por layout + outlet |

## Notas

- Refactor significativo: toda la estructura de rutas cambia
- Hacer este ANTES que TKT-003 para evitar colisiones en App.tsx
- Documentar migración si es muy grande
