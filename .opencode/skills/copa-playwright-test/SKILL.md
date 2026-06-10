# Copa Playwright Test Generator

Genera tests E2E con Playwright para nuevas rutas y componentes.

## Cuándo usar

- Agregaste una nueva ruta (`/routes/*.tsx`)
- Cambiaste comportamiento de una página existente
- Querés cubrir con tests antes de hacer un PR

## Qué genera

1. **Tests básicos de ruta**
   - Navegación desde Home
   - Verifica URL
   - Verifica título/encabezado principal

2. **Tests de contenido**
   - Verifica que se renderizan datos de la API
   - Checks específicos por tipo de página (grupos, fixtures, venues, etc.)

## Comandos

```bash
# Correr todos los tests
pnpm test

# Correr con UI
pnpm test:ui

# Correr en modo headed (visible)
pnpm test:headed
```

## Agregar test para nueva ruta

1. **Identificar la ruta** en `web/src/routes/`

2. **Agregar test básico** en `web/tests/app.spec.ts`:

```typescript
test('should navigate to [Name] page', async ({ page }) => {
  await page.goto('/');
  await page.click('a[href="/[route]"]');
  await expect(page).toHaveURL('/[route]');
  await expect(page.locator('h2')).toContainText(/[Nombre]/);
});
```

3. **Agregar test de contenido** si muestra datos:

```typescript
test('should display [data] in [Name]', async ({ page }) => {
  await page.goto('/[route]');
  
  // Verificar que hay datos
  const items = page.locator('[class*="border"], [class*="card"]');
  await expect(items.first()).toBeVisible();
  const count = await items.count();
  expect(count).toBeGreaterThan(0);
});
```

4. **Correr tests** para verificar que pasan

## Estructura de tests existente

- `should load home page` - verifica Home
- `should navigate to Groups page` - navega y verifica URL
- `should display groups with teams` - verifica datos de grupos
- `should navigate to Fixtures page` - navega a fixture
- `should display matches in Fixtures` - verifica matches
- `should navigate to Venues page` - navega a venues
- `should display venues list` - verifica venues
- `should navigate to Bracket page` - navega a bracket
- `should handle 404 page` - verifica 404

## Config files

- `web/playwright.config.ts` - configuración de Playwright
- `web/tests/app.spec.ts` - tests
- `web/playwright-report/` - reporte HTML (generado, .gitignore)
- `web/test-results/` - resultados (generado, .gitignore)

## Tips

- Usar `h2` para títulos de páginas (no `h1` que no existe)
- Usar `count()` y luego `expect()` para verificar cantidad de items
- El proxy `/api` del Vite solo funciona dentro del contenedor Docker
- Tests corren contra `http://localhost:5173` (web container)