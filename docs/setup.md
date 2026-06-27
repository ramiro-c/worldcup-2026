# Setup — Mundial 2026

Guía para levantar el proyecto en desarrollo local.

## Prerrequisitos

| Herramienta | Versión mínima | Para qué |
|-------------|---------------|----------|
| [uv](https://docs.astral.sh/uv/) | 0.5+ | Gestor de paquetes y entorno Python |
| [pnpm](https://pnpm.io/) | 9+ | Gestor de paquetes Node |
| Node.js | 20+ | Runtime del frontend |
| Python | 3.11+ | Runtime de la API |

Verificar instalación:

```bash
uv --version
pnpm --version
node --version
python3 --version
```

## Clonar e instalar

```bash
git clone https://github.com/ramiro-c/worldcup-2026.git
cd worldcup-2026

# API
cd api && uv sync && cd ..

# Web
cd web && pnpm install && cd ..
```

Las dependencias de la API están en `api/pyproject.toml` y las de Web en `web/package.json`. No se necesita configurar nada extra — los datos del Mundial se consumen dinámicamente de APIs externas.

## Variables de entorno

La API no requiere variables de entorno. El frontend tiene una opcional:

```bash
cp web/.env.example web/.env
# En desarrollo local, dejar VITE_API_URL vacío (el proxy de Vite redirige solo)
```

## Levantar en desarrollo

Necesitás dos terminales (o usá Docker más abajo).

### Terminal 1 — API (puerto 8000)

```bash
cd api
uv run fastapi dev main.py --port 8000
```

La API queda en `http://localhost:8000`. Endpoints disponibles en `/docs`.

### Terminal 2 — Web (puerto 5173)

```bash
cd web
pnpm dev
```

El frontend queda en `http://localhost:5173`. Las requests a `/api` se proxean automáticamente a la API por configuración de Vite.

## Docker

Si preferís levantar todo con un solo comando:

```bash
docker compose up --build
```

Esto levanta API en `:8000` y Web en `:5173` con hot reload en ambos. Para rebuild de un solo servicio:

```bash
docker compose restart api   # solo la API
docker compose restart web   # solo el frontend
```

## Tests

```bash
# API (unit + integración)
cd api && uv run pytest

# Web unit (Vitest + Testing Library)
cd web && pnpm test:unit

# Web E2E (Playwright — requiere dev server corriendo)
cd web && pnpm test
```

Para correr un archivo de tests específico:

```bash
# API
cd api && uv run pytest tests/test_bracket.py -v

# Web unit
cd web && npx vitest run BracketRoundView

# Web E2E
cd web && npx playwright test tests/app.spec.ts
```

## Type check y lint

```bash
cd web
npx tsc --noEmit        # type check
npx eslint src/         # lint
```

## Build de producción

```bash
cd web && pnpm build   # output en web/dist/
```

La API se deploya en Render, el frontend en Cloudflare Pages. El deploy es automático al pushear a `main`.
