# Copa 2026 — API

FastAPI backend que sirve datos del Mundial 2026.

## Fuentes de datos

Fetch dinámico desde wheniskickoff API y raw GitHub URLs (openfootball, StatsBomb). No se almacena data en el repo.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |

## Desarrollo

```bash
uv run fastapi dev main.py --port 8000
```
