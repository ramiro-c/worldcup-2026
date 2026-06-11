# Copa 2026 — World Cup Companion

Seguí el Mundial 2026 en vivo: grupos, fixture, cuadro eliminatorio, mapa de sedes y contexto histórico de cada selección.

## Funcionalidades

**Explorador del torneo** — Grupos con tabla actualizable, fixture completo con hora local, cuadro eliminatorio Round of 32 → Final, y resultados en vivo.

**Mapa de sedes** — Las 16 sedes en México, USA y Canadá sobre mapa, con filtro por región y detalle de cada estadio (capacidad, huso, partidos).

**Contexto histórico** — Al ver un partido, mostramos los últimos enfrentamientos en Mundiales pasados. Performance histórica de cada selección: mejor resultado, goles, estadísticas globales. "Este partido en la historia de los Mundiales" con línea de tiempo de encuentros previos.

**Calculadora de clasificación** — Qué necesita cada equipo para clasificar según resultados actuales, y posibles cruces de octavos.

## Stack

| Capa | Tecnología |
|------|-----------|
| API | FastAPI |
| Frontend | React + TypeScript + Vite |
| CSS | Tailwind CSS v4 |
| Mapas | Leaflet |
| Bracket | D3 |

## Atribuciones

Toda la data se consume dinámicamente sin commitear nada al repo. Las atribuciones requeridas se muestran en el footer de la app.

| Fuente | Licencia |
|--------|----------|
| [wheniskickoff API](https://wheniskickoff.com/data/v1/matches.json) — fixture, grupos, sedes, TV | Fair use. Atribución appreciated. |
| [OpenFootball World Cup](https://github.com/openfootball/worldcup) — datos históricos | CC0 1.0 |
| [StatsBomb Open Data](https://github.com/statsbomb/open-data) — eventos históricos | Propietaria permisiva. Requiere atribución + logo al publicar análisis. |
| [Reep Register](https://github.com/withqwerty/reep) | CC0 1.0 |

Crestas de selecciones servidas por wheniskickoff, banderas por flagcdn.com.

## Desarrollo

```
/
├── api/    → FastAPI
└── web/    → React + Vite
```
