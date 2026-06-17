# Web app (agri-front) — TODO

Living checklist of outstanding work for the customer web app. Grouped by who's
needed and rough effort. Keep it honest — only real, observed items.

## 🟢 Solo (front-end, no blockers)

- [ ] Persist analytics **date range as a relative preset** (e.g. "last 7 days")
      so it recomputes fresh instead of freezing to a stale absolute window.
- [ ] **Titles for the 2 sub-routes**: `/alerts/wind-speed`,
      `/vannes-pompes/schema`.
- [ ] **Localize page titles** (next-intl `getTranslations`) — currently
      hardcoded French.
- [ ] **Per-chart collapse/expand** on the long data pages (soil = 6 charts,
      station more), with persisted state.
- [ ] **Global next-intl jest mock** (`setupFilesAfterEnv`) so component tests
      don't each need a per-file mock.
- [ ] **Component tests** for the redesigned notification / alerts UI
      (today only pure-logic modules are tested).
- [ ] **Accessibility pass** on the new components (keyboard nav, focus, aria).
- [ ] **Error states** on data-fetch failures (some cards just log / show empty).

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
