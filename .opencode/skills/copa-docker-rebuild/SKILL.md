# Copa Docker Rebuild

Rebuildea containers cuando cambiás código y verifica que los cambios se aplicaron.

## Cuándo usar

- Cambiaste código Python en `api/`
- Cambiaste `pyproject.toml` o dependencias
- El frontend muestra datos viejos o incorrectos
- Necesitás verificar que un fix se aplicó

## Comandos

```bash
# Rebuild API (cambiaste código Python)
cd /Users/ramiro/Desktop/personal/06-copa-2026
docker compose build api --no-cache && docker compose up -d api

# Rebuild Web (cambiaste código React/Vite)
docker compose build web --no-cache && docker compose up -d web

# Rebuild todo
docker compose build --no-cache && docker compose up -d

# Ver logs
docker logs 06-copa-2026-api-1 --tail 30
docker logs 06-copa-2026-web-1 --tail 30

# Ver si están corriendo
docker compose ps
```

## Verificar cambios aplicados

```bash
# Esperar 3 segundos que arranque y verificar
sleep 3 && curl -s "http://localhost:5173/api/tournament/teams" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('Teams count:', len(d['data']), 'Sample group:', d['data'][0]['group'])"

# Verificar API health
curl -s "http://localhost:8000/health"

# Ver logs de error
docker logs 06-copa-2026-api-1 2>&1 | grep -i error
```

## Problemas comunes

1. **404 en `/api/tournament/teams`**
   - Causa: API no está corriendo o proxy del Vite mal configurado
   - Fix: `docker compose restart api` y verificar logs

2. **Datos viejos después de cambiar código**
   - Causa: Container no se rebuildeo
   - Fix: `docker compose build api --no-cache` (el `--no-cache` es clave)

3. **CORS errors en el navegador**
   - Causa: API no está corriendo, frontend llama directo a `:8000`
   - Fix: Verificar `docker compose ps` y que el proxy `/api` en `vite.config.ts` apunte a `host.docker.internal:8000`

4. **Cache de wheniskickoff.com**
   - Causa: Provider cachea por 5 minutos (CACHE_TTL)
   - Fix: Restart del container o esperar 5 minutos

## Debug workflow

1. `docker compose ps` - verificar containers corriendo
2. `curl localhost:8000/health` - verificar API responde
3. `curl localhost:5173/api/tournament/teams` - verificar proxy funciona
4. `docker logs 06-copa-2026-api-1 --tail 50` - verificar no hay errores
5. Si cambiaste código: `docker compose build api --no-cache && docker compose up -d api`

## Tips

- El `--no-cache` en el rebuild fuerza que se copien los archivos nuevos
- La API tiene cache de 5 minutos para datos externos (wheniskickoff.com)
- El proxy del Vite solo funciona desde adentro del container web
- Usar `docker compose restart` para cambios rápidos, `build` para cambios de código