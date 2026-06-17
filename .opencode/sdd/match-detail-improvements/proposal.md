# Proposal: match-detail-improvements

## Intent

Match.tsx tiene bugs (TV incorrecta, phase cruda, polling inútil) y datos subutilizados (venue_city, phase, datetime_utc). Batch de fixes de bajo esfuerzo para alinear el detalle de partido con los datos reales de la API.

## Scope

### In Scope
- Remover sección TV de Match.tsx
- Optimizar backend `get_match()` para no traer 104 partidos
- Alinear polling de 30s → 60s
- Phase labels en español con `PHASE_LABELS` en constants.ts
- Mostrar ciudad del estadio ("MetLife Stadium, East Rutherford")
- Link al estadio → `/venues/{venue_id}`
- Countdown al kickoff con timer local `setInterval`
- Soporte para partidos TBD (home/away null)
- Agregar `venue_city`, `datetime_utc`, `phase` al mapper backend + types

### Out of Scope
- Eventos, stats, lineups, reloj — requieren nueva fuente de datos
- Página `/venues/:id` — proponer ruta mínima o linker a existing

## Capabilities

### New Capabilities
- `match-detail`: Page-level component for enriched match view with phase labels, venue city+link, countdown, TBD support

### Modified Capabilities
- None

## Approach

1. **Backend**: Agregar `venue_city`, `datetime_utc` a `map_matches()`. Usar `provider.get_match(id)` en `get_match()` endpoint.
2. **Types**: Agregar `phase`, `venue_city`, `datetime_utc` a `Match` interface.
3. **Constants**: Crear `web/src/lib/constants.ts` con `PHASE_LABELS` (español). Migrar `STAGE_LABELS` de HistoricalMatchDetail.
4. **Match.tsx**: Remover `getTv()` y sección TV. Usar `PHASE_LABELS`. Mostrar venue+ciudad con link. Countdown con `setInterval`. Handling de TBD.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `api/routers/tournament.py` | Modified | Optimizar `get_match()`, agregar `venue_city`/`datetime_utc` a mapper |
| `web/src/lib/types.ts` | Modified | Agregar `phase`, `venue_city`, `datetime_utc` a Match |
| `web/src/lib/constants.ts` | New | `PHASE_LABELS` español y `STAGE_LABELS` migrado |
| `web/src/routes/Match.tsx` | Modified | Remover TV, phase labels, venue ciudad+link, countdown, TBD |
| `web/src/routes/HistoricalMatchDetail.tsx` | Modified | Importar `STAGE_LABELS` desde constants |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| TBD matches (home/away null) rompen render | Medium | Manejar nulls en enrichedMatch + render condicional |
| Countdown drift si tab pierde foco | Low | Calcular diff fresh en cada tick, no acumular |
| Phase labels desactualizadas si API agrega fases | Low | Log + fallback al valor crudo |
| `/venues/:id` no existe como ruta | Med | Link a venues list con hash, o crear ruta mínima |

## Rollback Plan

Revert commits de Match.tsx si bugs de render. Backend optimization es safe (retorna misma estructura). Constants.ts es additive.

## Dependencies

- wheniskickoff API debe mantener campos `phase`, `venue_city`, `datetime_utc`

## Success Criteria

- [ ] Match.tsx no muestra TV section
- [ ] Match detail muestra "Octavos de Final" en vez de "round-of-16"
- [ ] Match detail muestra "Estadio MetLife, East Rutherford"
- [ ] Nombre del estadio es link clickable
- [ ] Partidos programados muestran countdown actualizado cada 60s
- [ ] Partidos TBD muestran "A definir" sin romper
- [ ] Polling rate es 60s (no 30s)
