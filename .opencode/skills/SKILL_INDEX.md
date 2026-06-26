# Mundial 2026 — Skills Locales

Skills específicos para el desarrollo de Mundial 2026.

## Skills disponibles

### `copa-data-validate`
Valida que los endpoints de la API devuelven datos correctos y consistentes.

**Usar cuando:**
- Antes de correr tests del frontend
- Después de cambiar mapeo de datos en la API
- El frontend no muestra datos y querés descartar problema de API

**Comandos:**
```bash
curl -s "http://localhost:5173/api/tournament/groups" | python3 -c "..."
```

---

### `copa-playwright-test`
Genera tests E2E con Playwright para nuevas rutas y componentes.

**Usar cuando:**
- Agregaste una nueva ruta (`/routes/*.tsx`)
- Cambiaste comportamiento de una página existente
- Querés cubrir con tests antes de hacer un PR

**Comandos:**
```bash
pnpm test
pnpm test:ui
pnpm test:headed
```

---

### `copa-api-contract-check`
Verifica que los datos de la API coinciden con los tipos de TypeScript del frontend.

**Usar cuando:**
- El frontend no muestra datos pero la API responde
- Error de runtime en el navegador
- Después de cambiar estructura de respuesta de la API

**Verifica:**
- Campos requeridos
- Tipos de datos
- Case sensitivity (IDs, groups)
- Campos opcionales

---

### `copa-docker-rebuild`
Rebuildea containers cuando cambiás código y verifica que los cambios se aplicaron.

**Usar cuando:**
- Cambiaste código Python en `api/`
- Cambiaste `pyproject.toml` o dependencias
- El frontend muestra datos viejos o incorrectos

**Comandos:**
```bash
docker compose build api --no-cache && docker compose up -d api
docker logs 06-copa-2026-api-1 --tail 30
```

---

### `copa-fixture-data`
Genera y gestiona datos de prueba para matches, grupos y venues.

**Usar cuando:**
- Necesitás datos específicos para testear un caso
- Querés verificar cómo se comporta el frontend con ciertos datos
- Necesitás reproducir un bug con datos controlados

**Data sources:**
- wheniskickoff.com (oficial)
- openfootball (histórico)
- StatsBomb (eventos)

---

## Workflow típico

1. **Hacés un cambio en la API** → `copa-docker-rebuild`
2. **Verificás datos** → `copa-data-validate`
3. **Verificás frontend** → `copa-api-contract-check`
4. **Agregás/actualizás tests** → `copa-playwright-test`
5. **Necesitás datos específicos** → `copa-fixture-data`

## Bug fix común (ejemplo real)

**Problema:** Los grupos no se poblaban en el frontend.

**Diagnóstico:**
```bash
# Verificar groups
curl -s "http://localhost:5173/api/tournament/groups" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print([g['id'] for g in d['data'][:3]])"
# Output: ['a', 'b', 'c'] (lowercase)

# Verificar teams
curl -s "http://localhost:5173/api/tournament/teams" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(set(t['group'] for t in d['data'][:10]))"
# Output: {'A', 'B', 'C'} (uppercase)
```

**Fix:** Editar `api/routers/tournament.py:44`
```python
"group": t["group"].lower()  # Agregar .lower()
```

**Rebuild:** `copa-docker-rebuild`

**Verificar:** `copa-data-validate`

---

## Archivos clave

- `api/routers/tournament.py` - Mapeo de datos de la API
- `api/providers/wheniskickoff.py` - Provider de datos oficiales
- `web/src/lib/types.ts` - Tipos TypeScript
- `web/src/routes/Groups.tsx` - Página de grupos (ejemplo de bug fix)
- `web/tests/app.spec.ts` - Tests E2E
- `web/vite.config.ts` - Proxy `/api` → `:8000`

---

## Tips generales

- **Siempre verificar con curl antes de debuggear el frontend**
- **El proxy `/api` del Vite solo funciona dentro del contenedor**
- **La API cachea por 5 minutos datos externos**
- **Usar `--no-cache` en docker build para cambios de código**
- **Groups IDs son lowercase, team.group debe ser lowercase**