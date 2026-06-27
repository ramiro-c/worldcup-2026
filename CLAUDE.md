# Mundial 2026 — World Cup Companion

Web app para explorar el Mundial 2026 con fixture, grupos, cuadro eliminatorio, sedes y contexto histórico.

## Stack

| Capa | Tecnología |
|------|-----------|
| API | FastAPI + httpx (proxy de datos) |
| Frontend | React 19 + TypeScript + Vite |
| CSS | Tailwind CSS v4 |
| Mapas | Leaflet |
| Bracket | React + Tailwind |

## Estructura

```
/
├── api/       → FastAPI
├── web/       → React + Vite
└── README.md
```

## Data sources

Toda la data se consume dinámicamente sin commitear nada al repo:

- **wheniskickoff API** — fixture, grupos, sedes, TV del Mundial 2026 (API REST pública, CORS abierto)
- **openfootball** — datos históricos vía raw GitHub URLs (CC0)
- **StatsBomb** — eventos históricos vía raw GitHub URLs (atribución requerida)

## Convenciones

- Commits directamente a main (desarrollo rápido, sin feature branches ni PRs)
- Monorepo: cambios en API y web dentro del mismo commit cuando se tocan ambos
- Commits en español
- Sin data commiteada — todo fetch dinámico
