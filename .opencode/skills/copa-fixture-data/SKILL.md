# Copa Fixture Data

Genera y gestiona datos de prueba para matches, grupos y venues.

## Cuándo usar

- Necesitás datos específicos para testear un caso
- Querés verificar cómo se comporta el frontend con ciertos datos
- Necesitás reproducir un bug con datos controlados
- Querés agregar datos históricos o simulados

## Data sources actuales

1. **wheniskickoff.com** - Datos oficiales del Mundial 2026
   - `https://wheniskickoff.com/data/v1/groups.json`
   - `https://wheniskickoff.com/data/v1/teams.json`
   - `https://wheniskickoff.com/data/v1/matches.json`
   - `https://wheniskickoff.com/data/v1/venues.json`

2. **openfootball** - Datos históricos (raw GitHub)
   - CC0 licensed
   - MUndo a World Cup data

3. **StatsBomb** - Eventos históricos (raw GitHub)
   - Requiere atribución

## Endpoints para testear

```bash
# Ver grupos actuales
curl -s "http://localhost:5173/api/tournament/groups" | python3 -m json.tool

# Ver equipos de un grupo específico
curl -s "http://localhost:5173/api/tournament/teams" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print([t for t in d['data'] if t['group']=='a'])"

# Ver matches de Argentina
curl -s "http://localhost:5173/api/tournament/matches" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print([m for m in d['data'] if 'arg' in m.get('home_team','') or 'arg' in m.get('away_team','')])"
```

## Generar datos de prueba

### Agregar match manualmente

1. Editar `api/providers/wheniskickoff.py` y agregar override:

```python
async def get_matches(self) -> list[dict]:
    matches = await self._fetch("matches.json")
    
    # Agregar match de prueba
    matches.append({
        "slug": "arg-vs-bra-test",
        "num": 999,
        "home": "ARG",
        "away": "BRA",
        "home_name": "Argentina",
        "away_name": "Brazil",
        "venue": "azteca",
        "date": "2026-07-19",
        "time_utc": "20:00",
        "group": "a",  # o None si es eliminatorias
    })
    
    return matches
```

2. Rebuild: `docker compose build api --no-cache && docker compose up -d api`

3. Verificar: `curl localhost:5173/api/tournament/matches | python3 -c "import sys,json; d=json.load(sys.stdin); print([m for m in d['data'] if m['id']=='arg-vs-bra-test'])"`

### Verificar datos de un grupo

```bash
# Ver qué equipos están en el grupo A
curl -s "http://localhost:5173/api/tournament/groups" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); g=[x for x in d['data'] if x['id']=='a'][0]; print('Grupo A:', g['teams'])"

# Ver standings del grupo A
curl -s "http://localhost:5173/api/tournament/teams" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('Equipos en A:', [t['name'] for t in d['data'] if t['group']=='a'])"
```

## Casos de test comunes

1. **Grupo vacío** - Verificar que el frontend maneja groups sin teams
2. **Match sin score** - status = "scheduled", home_score/away_score undefined
3. **Match en vivo** - status = "live", scores presentes
4. **Match finalizado** - status = "finished", scores + penalty opcional
5. **Team sin crest** - URL inválida, verificar fallback
6. **Venue sin coordenadas** - lat/lon = 0.0

## Data validation

```bash
# Verificar todos los groups tienen 4 equipos
curl -s "http://localhost:5173/api/tournament/groups" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); bad=[g for g in d['data'] if len(g['teams'])!=4]; print('Grupos != 4 equipos:', bad if bad else 'OK')"

# Verificar todos los teams tienen group válido
curl -s "http://localhost:5173/api/tournament/teams" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); groups=set(g['id'] for g in json.load(open('/dev/stdin'))['data']); teams=set(t['group'] for t in d['data']); print('Teams con group inválido:', teams - groups if (teams - groups) else 'OK')"
```

## Fix data issues

- **Teams sin group**: editar `api/routers/tournament.py:44`, agregar `.lower()`
- **Groups sin teams**: verificar endpoint de wheniskickoff.com
- **Matches sin venue**: editar `map_matches()` y agregar default
- **Crest URLs rotas**: verificar team code en `map_teams()`