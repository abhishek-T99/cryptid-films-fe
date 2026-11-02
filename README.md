# Cryptid Films — Frontend

The Cryptid Films studio website. React + Vite, talking to the Django API in
[`cryptid-films-be`](https://github.com/abhishek-T99/cryptid-films-be).

| | |
|---|---|
| Node | 20.19+ / 22.12+ (Vite 8 requirement) |
| React | 19 |
| Vite | 8 |
| Language | JavaScript (JSX) |
| Linter | [oxlint](https://oxc.rs/docs/guide/usage/linter) |

## Getting started

```bash
git clone git@github.com:abhishek-T99/cryptid-films-fe.git
cd cryptid-films-fe

npm install
cp .env.example .env

npm run dev
```

The site comes up on <http://localhost:5173>. Start the backend too — the
landing page reports whether it can reach the API, which is the quickest way
to confirm both halves are wired together.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot module replacement |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | Lint with oxlint |
| `npm run lint:fix` | Lint and apply the fixable ones |

## Layout

```
public/            Served as-is, copied to the build root
src/
  lib/api.js         fetch wrapper — all backend calls go through this
  App.jsx            Placeholder landing view; replace with the real site
  index.css          Design tokens and element resets
  main.jsx           Entry point
index.html         Vite's entry; the <title> and meta tags live here
vite.config.js     Plugins, the @ alias, dev proxy, build options
```

`@` is aliased to `src/`, so imports stay flat:

```js
import { api } from '@/lib/api'
```

## Talking to the backend

Every request goes through `src/lib/api.js`, which prefixes `/api` and sends
session cookies:

```js
import { api, ApiError } from '@/lib/api'

const films = await api.get('/films/')
await api.post('/enquiries/', { name, email, message })
```

Failures throw an `ApiError` carrying `status` and the parsed `data`.

### CSRF

The backend authenticates with Django sessions, so unsafe methods need a CSRF
token. This is handled for you: `/api/health/` seeds the `csrftoken` cookie,
`App.jsx` calls it on mount, and `api.js` echoes the token back in the
`X-CSRFToken` header on every non-`GET` request.

That works as long as the API is same-origin from the browser's point of view
— true through the dev proxy, and in production when the API sits on a
subdomain of the frontend with `CSRF_COOKIE_DOMAIN` set on the backend. For a
genuinely cross-site deployment, switch the backend to token authentication,
where CSRF doesn't apply.

`VITE_API_BASE_URL` decides where those requests land:

- **Left empty** (the development default) paths stay relative and Vite's dev
  proxy forwards `/api` to `VITE_DEV_PROXY_TARGET`. The browser sees one
  origin, so CORS never comes up.
- **Set to an absolute URL** (`https://api.cryptidfilms.com`) requests go
  straight to that host. The deployed frontend's origin then has to appear in
  the backend's `DJANGO_CORS_ALLOWED_ORIGINS`.

The dev server uses `strictPort`, so it fails rather than quietly moving to
another port — a silent move would land it on an origin the backend's CORS
list doesn't allow. If 5173 is taken, change `VITE_PORT` **and** add the new
origin to the backend's `.env`.

## Environment variables

Copy `.env.example` to `.env` and edit. `.env` is git-ignored; `.env.example`
is committed and lists every variable — add new ones to it.

| Variable | Notes |
|---|---|
| `VITE_API_BASE_URL` | Empty in development, absolute API URL for deployed builds |
| `VITE_DEV_PROXY_TARGET` | Where the dev proxy forwards `/api`; `npm run dev` only |
| `VITE_PORT` | Dev server port; must match the backend's CORS list |

Only `VITE_`-prefixed variables reach the browser, and **everything exposed
this way is readable in the shipped bundle**. Never put a secret or private
API key in `.env` — anything confidential belongs on the backend.

## Building

```bash
npm run build     # → dist/
npm run preview   # check the build before shipping it
```

`preview` serves on port 4173 and does **not** use the dev proxy — that is
`server.proxy`, which only `npm run dev` reads. So previewing with an empty
`VITE_API_BASE_URL` shows "API unreachable", which is expected rather than a
broken build. To exercise the API against a preview build, set
`VITE_API_BASE_URL=http://127.0.0.1:8000`, rebuild, and add
`http://localhost:4173` to the backend's `DJANGO_CORS_ALLOWED_ORIGINS`.

`dist/` is static — any static host or CDN will serve it. Because the app is a
single-page build, point the host's fallback at `index.html` so client-side
routes resolve on a hard refresh.

Build-time variables are baked in, so set `VITE_API_BASE_URL` in the
deployment environment *before* running `npm run build`, not after.

## Next steps

This is a skeleton: a landing view, the API client and the build setup. Not
yet decided, and deliberately left out so they can be chosen against the real
design:

- routing (`react-router-dom`) and the page structure;
- a styling approach beyond the tokens in `index.css`;
- data fetching/caching (TanStack Query, or plain `useEffect` as in `App.jsx`);
- a test runner (Vitest + Testing Library).
