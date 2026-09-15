# genius-web

Browser client for the Genius AI BFF. Scaffolded with Vite, React, TypeScript, and Tailwind CSS v4.

Product contracts and docs are **not** in this folder. They live in the sibling briefing pack:

- `../new-hires/proto/genius/`
- `../new-hires/docs/`

Folder architecture: [`docs/architecture.md`](docs/architecture.md). BFF contract for this client: [`docs/backend/overview.md`](docs/backend/overview.md). Agent rules: `.cursor/rules/`.

## Scripts

```bash
npm install
cp .env.example .env
npm run dev
```

`VITE_GENIUS_API_URL` defaults in `.env.example` to `http://localhost:8090`. Staging BFF is `https://web.geniusai.io`.
