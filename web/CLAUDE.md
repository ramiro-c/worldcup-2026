# Copa 2026 Web — Conventions

React + TypeScript + Vite + Tailwind CSS v4.

## Development

```bash
pnpm dev          # dev server en :5173
pnpm build        # build producción
```

API proxy: `/api` → `localhost:8000`.

## Structure

```
web/src/
├── main.tsx           → entry point
├── App.tsx            → router + layout
├── index.css          → Tailwind import
├── routes/            → page components
│   ├── Home.tsx
│   ├── Groups.tsx
│   ├── Fixtures.tsx
│   ├── Bracket.tsx
│   ├── Venues.tsx
│   └── Match.tsx
├── components/        → reusable UI
└── lib/               → helpers, API client
```

## Patterns

- Pages en `routes/`, componentes compartidos en `components/`
- Llamadas a la API con `fetch` nativo (wrapper en `lib/api.ts`)
- Tailwind utility classes — sin CSS modules ni styled-components
- Tipos compartidos en `lib/types.ts`
