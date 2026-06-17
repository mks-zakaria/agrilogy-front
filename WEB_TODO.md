# Web app (agri-front) — TODO

Living checklist of outstanding work for the customer web app. Grouped by who's
needed and rough effort. Keep it honest — only real, observed items.

## ✅ Done (solo front-end push)

- [x] Persist analytics **date range as a relative preset** (recomputed vs today).
- [x] **Titles for the 2 sub-routes** (`/alerts/wind-speed`, `/vannes-pompes/schema`).
- [x] **Localize page titles** (next-intl server `generateMetadata`, fr/en/ar).
- [x] **Global next-intl jest mock** + jest-dom (unblocks component tests).
- [x] **Component tests** for the redesigned Notification card.
- [x] **Accessibility**: `aria-pressed` filter chips + labelled alert channel icons.
- [x] **Error states** + Retry on dashboard cards (alerts summary, recent notifications).
- [x] **Per-chart collapse/expand** — collapsible chart sections with persisted
      state (normal-flow toggle + title published via context).

## 🟡 Needs a product decision

- [ ] **Settings RBAC** — farmers currently see admin-only tabs
      ("Utilisateurs", "Techniciens"). Confirm intended visibility
      (farmer / technician / staff) and gate them.
- [ ] **User-facing notification cadence** — today only admins set it
      (agri-admin). Decide whether farmers self-serve their own preferences.

## 🟠 Needs assets / config

- [ ] **Mapbox token** — set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` in Vercel env so
      the farm map renders (currently shows the fallback placeholder).
- [ ] **PWA icons + manifest** — theme-color + iOS meta are in; "add to home
      screen" still needs 192/512 PNG icons + `manifest.json` (needs a logo asset).

## 🔵 Backend-dependent (affects web UX)

- [ ] **Activate cadence + SMS/WhatsApp** — built & on `main`, one DB-backfill
      command from live; makes the notification settings work end-to-end.

## 🟣 Larger / infra

- [ ] **Turborepo monorepo** (`apps/web` + `apps/admin`) — 2 Vercel projects,
      domains, env, pick PR base & merge, fix the legacy deploy workflow.
