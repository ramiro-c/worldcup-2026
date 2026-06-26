# Mundial 2026 — API

FastAPI backend que sirve datos del Mundial 2026.

## Fuentes de datos

Fetch dinámico desde wheniskickoff API y raw GitHub URLs (openfootball, StatsBomb). No se almacena data en el repo.

## Endpoints

### Tournament (2026)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/tournament/groups` | Grupos del Mundial 2026 |
| GET | `/tournament/teams` | Equipos participantes |
| GET | `/tournament/venues` | Sedes del torneo |
| GET | `/tournament/matches` | Fixture completo |
| GET | `/tournament/matches/{id}` | Detalle de partido |
| GET | `/tournament/matches/{id}/events` | Eventos del partido |
| GET | `/tournament/matches/{id}/lineups` | Formaciones del partido |
| GET | `/tournament/tv` | Canales de TV por país |
| GET | `/tournament/competitions` | Competiciones disponibles |

### Historical

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/historical/tournaments` | Lista de Mundiales desde 1930 |
| GET | `/historical/tournaments/{year}` | Detalle de un Mundial específico |
| GET | `/historical/teams/{name}/matches` | Partidos históricos de un equipo |
| GET | `/historical/head-to-head` | Enfrentamientos entre dos equipos |

## Desarrollo

```bash
uv run fastapi dev main.py --port 8000
```

## Tests

```bash
uv run pytest
```
