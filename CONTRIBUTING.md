# Contributing to `agrilogy-front`

> ## ⛔ STATUS: MAINTENANCE ONLY — THIS REPO IS RETIRED
>
> As of **2026-07-16**, **[`AgriLogy/agri-web`](https://github.com/AgriLogy/agri-web)** (a Turborepo
> monorepo extracted from this codebase) is **THE** farmer web app going forward.
> `agrilogy-front` is the original Next.js app it was extracted from and is being wound down.
>
> | Change type                                                        | Where it goes    |
> | ------------------------------------------------------------------ | ---------------- |
> | New features, redesigns, new routes, refactors, dependency upgrades | **`agri-web`**   |
> | Security fixes on code still running in production                  | here (then port) |
> | Production hotfixes that cannot wait for the `agri-web` cutover     | here (then port) |
> | Docs describing this repo's retired status                          | here             |
>
> If you are about to start a feature, **stop and open it in `agri-web` instead.**
> Anything landed here that also exists in `agri-web` must be ported there in the same
> work item, otherwise the fix is lost at cutover.

---

## 1. What this app is

The Agrilogy **customer/farmer dashboard**: log in, view live sensor charts (soil, plant,
water, station), configure alerts and notifications, crop calendar, valves/pumps
(`vannes-pompes`), and an in-app assistant. Next.js App Router + React 18 + TypeScript,
Chakra UI + Ant Design (admin surfaces) + Tailwind, charts via Recharts / Chart.js, maps via
Mapbox GL / Leaflet / Google Maps, i18n via `next-intl` (fr default, en, ar).

**Backend:** `agri-api` only. All HTTP goes through the axios instance in
`src/app/lib/api.ts` (JWT access token in `localStorage.accessToken`, refresh + 401 → `/login`
interceptor). Canonical sensor slug → path table lives in `src/app/utils/sensorApiPaths.ts`.
Per `CLAUDE.md`, URLs are REST-aligned since 2026-05-29 (`/users/me`, `/zones`, `/alerts`,
`/sensors/*`); the old `/api/header/`, `/api/alert/`, `/auth/signin/` paths are gone.

## 2. Prerequisites

- Node.js **20+** (CI pins `node-version: 20`)
- npm **10+** (`package-lock.json` is the lockfile CI uses via `npm ci`; a stale `yarn.lock`
  is also committed — do not use it)

## 3. First-time setup

```bash
git clone git@github.com:AgriLogy/agrilogy-front.git
cd agrilogy-front
npm install
cp env-example .env.local   # then edit values
npm run dev                 # http://localhost:3000
```

### Environment variables

`env-example` is the authoritative list.

| Variable                               | Required | Notes                                                                    |
| -------------------------------------- | -------- | ------------------------------------------------------------------------ |
| `HOST`                                 | no       | `0.0.0.0` in the example; used by the Node server                        |
| `PORT`                                 | no       | `3000`                                                                   |
| `NEXT_PUBLIC_API_URL`                  | **yes**  | `agri-api` base URL used by the browser                                  |
| `API_URL`                              | no       | Same target, for build-time / server-side fetches                        |
| `NEXT_PUBLIC_ANTHROPIC_API_KEY`        | no       | Chat assistant; `NEXT_PUBLIC_*` is client-visible — see warning in file  |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`    | no       | "Report an issue" screen recording; form hides recording if unset        |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | no       | Unsigned preset, must be set together with the cloud name                |
| `NEXT_PUBLIC_APP_VERSION`              | no       | Stamped on submitted issue reports                                       |
| `NEXT_PUBLIC_ENV`                      | no       | Environment tag on submitted issue reports                               |
| `NEXT_TELEMETRY_DISABLED`              | no       | `1` to silence Next telemetry                                            |
| `NODE_ENV`                             | no       | `production` in the example                                              |

Two more exist in code but **not** in `env-example`:

- `PROXY_API_TARGET` — `next.config.mjs` adds a `/api-proxy/:path*` rewrite when set, so local
  dev stays same-origin against a backend that only CORS-allows the prod origin. No-op when unset.
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` — build arg in `Dockerfile` / `docker-compose.yml`; without
  it the farm map renders its fallback placeholder (`WEB_TODO.md`).

### Docker / nginx path

```bash
# Needs a .env.local (docker-compose reads it via env_file)
docker compose up -d --build agryfront   # container agryfront, host port 3000
```

`Dockerfile` is a two-stage build producing Next `output: 'standalone'` and running
`node server.js`. `nginx.conf` in the repo root is a **static-site** config
(`root /usr/share/nginx/html`, `try_files $uri /index.html`) and does **not** proxy to the
standalone server — the live reverse-proxy config is not documented in-repo.
`.github/workflows/deploy-front.yml` is the self-hosted path: push to `alpha` → SSH to the
DigitalOcean droplet → `cd /root/agri-front && git reset --hard origin/alpha && docker compose up -d --build --no-deps agryfront`.

## 4. Dev loop

| Command                | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `npm run dev`          | `next dev` on :3000                                       |
| `npm run build`        | `next build` (standalone output)                          |
| `npm run start`        | Serve the built app                                       |
| `npm run lint`         | `eslint .`                                                |
| `npm run lint:fix`     | ESLint with `--fix`                                       |
| `npm run typecheck`    | `tsc --noEmit` — **must pass on every change**            |
| `npm run format`       | Prettier write                                            |
| `npm run format:check` | Prettier check                                            |
| `npm run check`        | lint + typecheck + format:check (the `pre-push` gate)     |
| `npm run test:jest`    | `jest --passWithNoTests`                                  |
| `npm run test`         | `check` **then** `test:jest`                              |

> ⚠️ `next.config.mjs` sets `typescript.ignoreBuildErrors: true` — a green `npm run build`
> does **not** mean the types are sound. `npm run typecheck` is the only type gate. Run it on
> every change, no exceptions.

Husky hooks: `pre-commit` → `lint-staged`, `commit-msg` → `commitlint`, `pre-push` →
`npm run check`. Don't bypass them with `--no-verify`.

## 5. Branch topology — do **not** branch off `main` blindly

Observed in this checkout (`git ls-remote --heads origin`, `git log origin/main`):

- The clone is **shallow/grafted** — local history is one commit deep; `git log` dates are
  not a reliable staleness signal here.
- `origin/main` tip is `823c608` **2026-07-06**, tag `v1.51.1` (the semantic-release commit).
- `origin/alpha` exists and points at a **different** commit (`3f2ffa3`) — it is the branch
  `deploy-front.yml` deploys to the droplet, i.e. active work lived on `alpha` plus ~32
  `feat/*`, `fix/*`, `test/*`, `ci/*`, `chore/*` branches that were never merged to `main`.
- Correction to prior lore: `origin/main` **does** contain i18n today —
  `src/i18n/{config,locale,request}.ts` and `src/messages/{ar,en,fr}.json` are present in the
  `origin/main` tree. The "main lacks i18n" warning is historical, from before that landed.

Practical rule: `main` is behind `alpha` and behind many feature branches. **Never branch
chart or i18n work off `main`** without first diffing against `alpha` and the relevant
`feat/*` branch — you will silently re-delete work. Fetch and compare before you start:

```bash
git fetch origin --unshallow          # this clone is shallow; needed for real diffs
git log --oneline origin/main..origin/alpha
```

Given the retired status, prefer basing a hotfix on whatever branch is actually deployed
(`alpha` for the droplet, `main` for Vercel production) rather than defaulting to `main`.

## 6. `src/` layout

| Path                    | Contents                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `src/app/`              | App Router root: `layout.tsx`, `page.tsx`, `providers.tsx`, `theme.ts`, error boundaries     |
| `src/app/<route>/`      | Pages: `alerts`, `chat`, `crop-calendar`, `login`, `notifications`, `plant`, `settings`, `soil`, `station`, `vannes-pompes`, `water` |
| `src/app/components/`   | ~215 files, grouped by domain (`alert`, `analytics`, `agryChatBot`, `dashboard`, `map`, `notifications`, `settings`, `station`, `layout`, `common`, `forms`, …) |
| `src/app/hooks/`        | Shared hooks (`useIsMobile`, `useNotificationBellCounts`, `useReadOnly`, …)                  |
| `src/app/lib/`          | API clients + business logic (`api.ts`, `alertApi.ts`, `notificationDecisionEngine.ts`, …)   |
| `src/app/utils/`        | Pure helpers, no React (`sensorApiPaths.ts`, `chartDateWindow.ts`, `et0Daily.ts`, …)         |
| `src/app/styles/`       | Global/SCSS module styles; `globals.scss` at `src/app/`                                      |
| `src/app/data/`, `fonts/`, `public/` | Static data, fonts, in-app assets                                               |
| `src/i18n/`             | `next-intl` config, locale resolution, `request.ts` (wired in `next.config.mjs`)             |
| `src/messages/`         | `fr.json` (default), `en.json`, `ar.json`                                                    |
| `src/types/`            | Ambient declarations (`images.d.ts`, `jest-dom.d.ts`)                                        |

## 7. Testing

Jest (jsdom) + Testing Library. Config: `jest.config.js`, `jest.setup.js` (env polyfills),
`jest.setup.after.js` (matchers + mocks), transform via `babel.config.test.js` (isolated from
the Next build). `testMatch` is `src/**/*.test.(ts|tsx)` — colocate tests next to the code.

```bash
npm run test:jest                                   # whole suite
npx jest src/app/lib/notificationDecisionEngine.test.ts   # single file
```

**The `next-intl` ESM gotcha (verified in `jest.setup.after.js`):** `next-intl` ships ESM that
jest cannot parse, and its hooks require a provider. The repo works around this with a global
`jest.mock('next-intl', …)` passthrough (`useTranslations` returns the key, `useLocale` → `'fr'`,
`useFormatter` → `String(v)`, `NextIntlClientProvider` → children). Consequences:

- Assertions must be on **translation keys**, not rendered French/English/Arabic strings.
- Formatting under test is the stub, not real Intl output.
- Therefore **keep testable logic in pure, dependency-free modules** under `src/app/lib/` and
  `src/app/utils/` (see the existing `*.test.ts` there) and keep components thin. Component
  tests exist (`Notification.test.tsx`, `AlertForm.test.tsx`, `ChartAlertOverlay.test.tsx`) but
  rely on the stub plus the `MessageChannel` / `ResizeObserver` / `matchMedia` polyfills in
  `jest.setup.js` for antd.

CSS/SCSS imports resolve to `__mocks__/styleMock.js`; `@/*` maps to `src/*`.

## 8. Branches, commits, PRs

- Branch names: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`, `ci/<topic>` (matches the
  remote branch set). Never push directly to `main`.
- **Conventional Commits** on every commit (enforced by `commitlint.config.cjs` via the
  `commit-msg` hook) and on the **PR title** — squash-merge uses it as the commit message and
  `lint-pr-title.yml` validates it. Allowed types: `build`, `chore`, `ci`, `docs`, `feat`,
  `fix`, `perf`, `refactor`, `revert`, `style`, `test`.
- **One dedicated, scope-matched issue per PR.** Open the issue first, put `Closes #N` in the
  PR body. Both issue and PR are assigned to the author — `auto-assign.yml` assigns
  `mks-zakaria` on open; keep it that way.
- **Zero AI / assistant attribution anywhere** — no `Co-Authored-By`, no generated-with
  footers, no assistant mentions in commits, branches, PRs, or issues. The user is the sole author.
- Commit from your local machine only (never over SSH on the droplet).
- Before opening a PR: `npm run check && npm run test:jest && npm run build`.
- CI (`ci.yml`) re-runs lint, typecheck, `format:check`, and build on PRs to `main`.

## 9. Releases & deploy

- **Release:** `release.yml` runs semantic-release on every push to `main` (`.releaserc.json`,
  `branches: ["main"]`) — bumps `package.json`, updates `CHANGELOG.md`, tags, publishes a
  GitHub Release, and pushes `chore(release): X.Y.Z [skip ci]`.
- **Vercel:** production is the Vercel project `agrilogys-projects/agrilogy-front` (org
  `team_0qvi19Uq395tQgY3GWshb0YV`, project `prj_BNkl0eG3RTp1xmx6npQZgDHky3Hb`, per
  `vercel-preview.yml`). Per that workflow's own comment, git-integration deploys hit
  "the stale personal-Hobby account connection and the author-block on git-integration
  deploys" — so **ship changes by merging a PR**, and let CI deploy with the `VERCEL_TOKEN`
  secret, rather than running a direct `vercel --prod` from a personal account.
- **Previews:** `vercel-preview.yml` builds and deploys a preview for every PR to `main`
  (same-repo PRs only) and comments the URL.
- **Self-hosted:** `deploy-front.yml` on push to `alpha` (see §3).
- Env vars must be set in the Vercel dashboard per environment; a relative
  `NEXT_PUBLIC_API_URL` baked into a production build breaks every API call.

`scripts/push-personal.sh` exists but points at the old
`git@github-personal:mks-zakaria/agri-front.git` remote — the current origin is
`AgriLogy/agrilogy-front`. Treat that script as legacy; don't use it without updating the URL.
