# Copa Data Validation

Valida que los endpoints de la API devuelven datos correctos y consistentes.

## Cuándo usar

- Antes de correr tests del frontend
- Después de cambiar mapeo de datos en la API
- Para verificar consistencia (lowercase/uppercase, IDs, formats)
- Cuando el frontend no muestra datos y querés descartar problema de API

## Qué valida

1. **Endpoints disponibles**
   - `/tournament/groups`
   - `/tournament/teams`
   - `/tournament/matches`
   - `/tournament/venues`

2. **Consistencia de datos**
   - IDs en lowercase (groups, teams)
   - team.group coincide con group.id (case-sensitive)
   - team codes en lowercase en groups.teams[]
   - URLs de crests válidas

3. **Estructura de respuesta**
   - Formato `{ data: [...] }`
   - Campos requeridos presentes

## Comandos

```bash
# Validar todo
curl -s "http://localhost:5173/api/tournament/groups" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Groups:', len(d.get('data',[])), 'IDs:', [g['id'] for g in d['data'][:3]])"

# Checkear teams
curl -s "http://localhost:5173/api/tournament/teams" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Teams:', len(d.get('data',[])), 'Groups únicos:', set(t['group'] for t in d['data']))"

# Checkear matches
curl -s "http://localhost:5173/api/tournament/matches" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Matches:', len(d.get('data',[])), 'Con group:', sum(1 for m in d.get('data',[]) if m.get('group')))"
```

## Red flags

- `KeyError: 'data'` → API no está devolviendo formato esperado
- Groups en uppercase (`A`, `B`) vs teams.group en lowercase (`a`, `b`) → no van a matchear
- `404 Not Found` → API no está corriendo o proxy del Vite mal configurado

## Fix común

Si teams.group no es lowercase, editar `api/routers/tournament.py:44`:

```python
"group": t["group"].lower(),  # Asegurar lowercase
```

Luego rebuild del container:

```bash
cd /Users/ramiro/Desktop/personal/06-copa-2026
docker compose build api --no-cache && docker compose up -d api
```