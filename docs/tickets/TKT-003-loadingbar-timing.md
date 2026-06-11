# TKT-003 — LoadingBar conectada a carga real

**Prioridad:** Baja
**Status:** 🟡 Pendiente
**Dependencias:** Ninguna
**Colisiones:** Con TKT-005 (ambos tocan `App.tsx`)

## Descripción

La `LoadingBar` actual usa un timer fijo de 350ms. Si una página tarda más, la barra se completa antes. Conectarla al estado de carga real de la página.

## Files

| Archivo | Cambio |
|---------|--------|
| `web/src/components/LoadingBar.tsx` | Refactor para recibir estado de carga externo |
| `web/src/App.tsx` | Integrar estado global de carga |

## Notas

- Opción simple: usar `useNavigation()` de React Router (requiere migrar a data router → TKT-005)
- Opción alternativa: contexto global `LoadingContext` que cada ruta setea
- Si TKT-005 está pendiente, ir por `LoadingContext`
- No modificar `useAsync.ts` ni rutas individuales
