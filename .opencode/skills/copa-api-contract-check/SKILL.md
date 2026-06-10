# Copa API Contract Check

Verifica que los datos de la API coinciden con los tipos de TypeScript del frontend.

## Cuándo usar

- El frontend no muestra datos pero la API responde
- Error de runtime en el navegador
- Después de cambiar estructura de respuesta de la API
- Antes de mergear cambios que tocan API + frontend

## Qué verifica

1. **Campos requeridos** - Que lo que usa el frontend existe en la respuesta
2. **Tipos de datos** - Que strings/numbers/arrays coinciden
3. **Case sensitivity** - Que IDs y references usan mismo case
4. **Campos opcionales** - Que el frontend maneja undefined correctamente

## Comandos de verificación

```bash
# Ver campos de teams response
curl -s "http://localhost:5173/api/tournament/teams" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); t=d['data'][0]; print('Campos:', list(t.keys()))"

# Ver campos de groups response  
curl -s "http://localhost:5173/api/tournament/groups" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); g=d['data'][0]; print('Campos:', list(g.keys()))"

# Ver consistency team.group vs group.id
curl -s "http://localhost:5173/api/tournament/teams" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('team.groups:', set(t['group'] for t in d['data'][:10]))"
curl -s "http://localhost:5173/api/tournament/groups" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('group.ids:', [g['id'] for g in d['data'][:5]])"
```

## Tipos TypeScript (`web/src/lib/types.ts`)

```typescript
interface Team {
  id: string;        // team code lowercase
  name: string;
  code: string;      // team code original (uppercase)
  crest: string;     // URL
  group: string;     // grupo lowercase (a, b, c...)
}

interface Group {
  id: string;        // lowercase (a, b, c...)
  name: string;      // "Group A", "Group B"...
  teams: string[];   // team codes en lowercase
}

interface Match {
  id: string;
  home_team: string;     // team id lowercase
  away_team: string;     // team id lowercase
  home_team_name?: string;
  away_team_name?: string;
  venue: string;
  date: string;
  time: string;
  status: string;
  home_score?: number;
  away_score?: number;
  group?: string;        // lowercase si es fase de grupos
  round?: string;        // si es eliminatorias
}
```

## Mismatches comunes

1. **Case mismatch** (BUG más común)
   - API devuelve `group: "A"` pero frontend espera `group: "a"`
   - Fix: `t["group"].lower()` en `api/routers/tournament.py:44`

2. **Campo missing**
   - API no devuelve `home_team_name` pero frontend lo usa
   - Fix: agregar mapeo en `map_matches()` o hacer optional en TypeScript

3. **Array vs string**
   - `groups.teams` es array de strings, frontend filtra como si fueran objects
   - Fix: verificar `web/src/routes/Groups.tsx` cómo usa `teams`

##.debugging workflow

1. **Verificar API responde** - `curl` al endpoint
2. **Verificar campos** - comparar con `types.ts`
3. **Verificar frontend** - consola del navegador si hay errores
4. **Verificar proxy** - `curl` a `localhost:5173/api/...` no a `:8000`