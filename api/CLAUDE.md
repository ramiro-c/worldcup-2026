# Copa 2026 API — Conventions

FastAPI app proxy que cachea datos de fuentes externas y los sirve al frontend.

## Development

```bash
uv run fastapi dev main.py --port 8000
```

## Structure

```
api/
├── main.py              → app, CORS, router includes
├── routers/             → endpoint modules
├── providers/           → data source fetchers (wheniskickoff, openfootball, statsbomb)
├── models/              → Pydantic schemas
├── pyproject.toml
└── uv.lock
```

## Patterns

- **Routers** en `routers/`, cada fuente o dominio tiene el suyo
- **Providers** encapsulan la lógica de fetch + parse de cada fuente externa
- Errores de fuentes externas se cachean con TTL, no se rompe el endpoint
- Usar `httpx.AsyncClient` para requests externas
- Pydantic v2 para validación de schemas
