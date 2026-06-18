# Data Providers

## wheniskickoff

**Source:** `https://wheniskickoff.com/data/v1/` (API REST pública)

**Rol:** Torneo actual (Mundial 2026). Fuente primaria para el fixture en vivo.

**Datos que expone:**

| Endpoint | Contenido |
|----------|-----------|
| `groups` | Grupos con lista de equipos por grupo |
| `teams` | Equipos con código, grupo y URL de escudo |
| `venues` | Sedes con nombre, ciudad, país, capacidad |
| `matches` | Todos los partidos con fecha, hora, equipos, sede, grupo/ronda |
| `match/{id}` | Detalle de un partido individual |
| `tv` | Canales de TV por país (transformado a lista plana) |

**Proxy cachea** con TTL 5 min (60s para matches en vivo), con fallback a stale en caso de error.

---

## openfootball

**Source:** `https://raw.githubusercontent.com/openfootball/worldcup/master/` (repositorio GitHub CC0, archivos `.txt`)

**Rol:** Historial completo de todos los Mundiales (23 torneos, 1930–2026). Parseo de archivos `cup.txt` y `cup_finals.txt`.

**Datos que expone:**

| Endpoint | Contenido |
|----------|-----------|
| `tournaments` | Lista de torneos disponibles (año, nombre, host) |
| `tournaments/{year}` | Grupos + partidos de un torneo específico |
| `head-to-head` | Todos los partidos históricos entre dos equipos |
| `teams/{teamName}/matches` | Partidos históricos de un equipo |

**Cobertura:** 23 mundiales, todos completos con:
- Partidos de grupo y eliminatorias
- Resultados HT, tiempos extra, penales
- Goleadores por partido (cuando están en el source)
- Golden goal, own goals, replays

**Parser** (`OpenfootballParser`) traduce texto plano estructurado a dicts.

**Team aliases** (`providers/aliases.py`) resuelve variantes históricas: West Germany → Germany, USSR → Russia, Czechoslovakia → Czech Republic, Yugoslavia → Serbia, etc.

---

## StatsBomb

**Source:** `https://raw.githubusercontent.com/statsbomb/open-data/master/` (repositorio GitHub open-data, atribución requerida)

**Rol:** Datos de eventos detallados de mundiales seleccionados (8 torneos: 1958, 1962, 1966, 1974, 2018, 2022 parcial, más ediciones Women's).

**Datos que expone:**

| Endpoint | Contenido |
|----------|-----------|
| `competitions` | Competiciones disponibles (torneos + temporadas) |
| `matches?competition_id=X&season_id=Y` | Partidos de una competición |
| `matches/{id}/events` | Evento por evento (pases, tiros, tackles, etc.) |
| `matches/{id}/lineups` | Alineaciones iniciales y suplentes |

**Diferencia clave vs openfootball:** StatsBomb tiene datos *evento por evento* (no solo resultados). Ideal para análisis táctico, mapas de pases, xG, etc. Cobertura limitada a 8 mundiales masculinos.

---

## Resumen

| Provider | Ámbito | Formato | Tipo de datos |
|----------|--------|---------|---------------|
| wheniskickoff | 2026 (en vivo) | JSON | Fixture, grupos, sedes, TV |
| openfootball | 1930–2026 (histórico) | TXT parseado | Resultados, goleadores, grupos |
| StatsBomb | 1958–2022 (8 mundiales) | JSON | Eventos detalle, alineaciones |

---

## Arquitectura de cache

**Sin DB local.** La app usa cache en memoria con patrón cache-aside:

```
Cliente → BE → ¿está en cache?
              ├─ Sí → retorna
              └─ No → fetch proveedor → guarda en cache → retorna
```

### Motor

**`MemoryCache`** (`providers/cache.py`):
- TTL por endpoint (300s default, 60s para matches en vivo)
- Stale-while-revalidate: si el upstream falla, retorna dato stale
- Stats de hit/miss/stale-hit
- Sin persistencia — se pierde al reiniciar

### Interfaces

ABC interfaces en `providers/interfaces.py`:
- `ITournamentDataProvider` — wheniskickoff
- `IHistoricalDataProvider` — openfootball
- `IHeadToHeadProvider` — openfootball
- `ITeamDataProvider` — openfootball
- `IEventDataProvider` — StatsBomb

### Estrategia de actualización

- **Matches en vivo**: polling 60s durante el torneo
- **Fixture**: cache 5 min, stale fallback
- **Histórico**: cache 5 min, no cambia (datos estáticos)
