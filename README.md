# Copa 2026 — World Cup Companion

Web app companion para explorar la Copa del Mundo 2026 con fixture, grupos, bracket, sedes y contexto histórico.

## Datos

No se commitea data al repo. Todo se consume dinámicamente desde sus fuentes originales respetando cada licencia.

| Fuente | Licencia | Consumo |
|--------|----------|---------|
| [wheniskickoff.com API](https://wheniskickoff.com/data/v1/matches.json) | Fair use / propietaria permisiva. Atribución appreciated. Prohíbe scrapear para republicación masiva | API REST pública, CORS abierto, sin auth — fixture, grupos, sedes, TV |
| [openfootball/worldcup](https://github.com/openfootball/worldcup) | CC0 1.0 — permite todo, sin restricciones | GitHub raw URLs → parser en API |
| [StatsBomb Open Data](https://github.com/statsbomb/open-data) | Propietaria permisiva. Requiere atribución | GitHub raw URLs → API |
| [Reep Register](https://github.com/withqwerty/reep) | CC0 1.0 | API vía RapidAPI o CSVs |

Logos: se usan las crestas que provee wheniskickoff y flagcdn.com. Sin bundling de assets ajenos.

## Core features

### 1. Explorador del torneo
- Grupos con tabla de posiciones actualizable
- Fixture completo con fecha, hora, sede (convertida a huso local)
- Bracket eliminatorio interactivo: Round of 32 → Final
- Resultados en vivo durante el torneo

### 2. Mapa de sedes
- Las 16 sedes en México, USA y Canadá sobre mapa
- Filtro por región (Western / Central / Eastern)
- Info de cada estadio: capacidad, huso horario, partidos que alberga

### 3. Contexto histórico
- Al ver un partido: mostrar últimos enfrentamientos entre ambas selecciones en Mundiales pasados (StatsBomb)
- Performance histórica de cada selección: mejor resultado, goles, estadísticas globales
- "This fixture in World Cup history" — línea de tiempo de encuentros previos

### 4. Group state calculator
- Qué necesita cada equipo para clasificar según resultados actuales
- Posibles cruces de octavos según posiciones de grupo

## Stack

| Capa | Tecnología |
|------|-----------|
| **API** | FastAPI — sirve fixture, grupos, bracket, datos históricos |
| **Frontend** | React + TypeScript |
| **Visualizaciones** | Campos (cancha, mapas de tiro) + Leaflet/Mapbox (mapa sedes) + D3 (bracket) |
| **Live data** | wheniskickoff API + polling |
| **Identidad** | Reep Register para resolver team/player IDs |

## Estructura del proyecto

```
06-copa-2026/
├── api/                  # FastAPI
├── web/                  # React + Vite
└── README.md
```
