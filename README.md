# FATS — Fine Art Tech Support Portal

A service portal for the Rhodes University Fine Art Department. Students submit
tech requests (printing, laser cutting, 3D printing, equipment loans, AV setups,
studio bookings, gallery bookings, software installs, general queries); staff
manage the queue, equipment loans, fines, preventive maintenance, H&S
requisitions, insurance records, licences and budget tracking.

**Live:** https://fine-art-tech-support.vercel.app
**Maintainer:** Mpumzi Mpati (Technical Assistant, Fine Art)

---

## How it works (the 60-second version)

```
Student / staff phone or PC
        │  HTTPS
        ▼
Vercel  ── static React app (built with Vite)
        ── /api/airtable  serverless proxy → Airtable (data lives here)
        ── /api/email     serverless function → Gmail SMTP (notifications)
        ── /api/*         a few cron/report helpers
```

- **All data lives in Airtable** (base `appUqkCfnsOo2Jf7z`). The React app never
  talks to Airtable directly — it calls `/api/airtable`, which holds the token.
- **Deploys are automatic**: push to `main` on GitHub → Vercel builds and ships.
  There is no separate release step.
- **No accounts**: students self-identify via student-number lookup; staff
  access is gated by a shared PIN (verified server-side).

## Repository map

```
api/                  Vercel serverless functions (run on the server, not in the browser)
  airtable.js         Airtable proxy + access control (allowlists + PIN check) — READ THIS FIRST
  email.js            Sends mail via Gmail SMTP (nodemailer)
  cron-followup.js, staff-report.js, log-followup.js, draft.js   helpers for H&S chasing/reports
src/
  main.jsx            entry point
  App.jsx             the main app: student flows + staff dashboard (largest file)
  shared.jsx          constants (request types, statuses, tables, calendar), date helpers, Btn/pill/ipt UI primitives
  lib/
    airtable.js       fetch wrappers: atGet/atPost/atPatch/atDelete, saveSetting, verifyStaffPin
    requests.js       request ⇄ Airtable converters, student lookup, archive summaries
    email.js          email templates: confirmation + status-change notifications
    equipment.js      equipment browse/booking/fines API helpers
  data/budget.js      2025–26 budget submission data (ACE / F&E / IT)
  panels/             self-contained staff dashboard panels
    BudgetPanel.jsx   budget approval tracking
    InsurancePanel.jsx asset register, incidents, policy summary
    PmPanel.jsx       preventive-maintenance schedule
    HsPanel.jsx       H&S / maintenance requisitions + reports
public/               favicon, PWA icons, manifest, QR cards, laser guides
scripts/
  generate-qr.cjs     regenerates public/fats-qr.png + printable QR cards
  generate-icons.cjs  regenerates PWA icons from favicon.svg
```

## Airtable tables

| Table | ID | Used for |
|---|---|---|
| Requests | `tblAQE1leKVCRH51d` | every student request; details stored as a JSON blob in `Details` |
| Equipment | `tblc2MXweiXikz3wo` | bookable gear + insurance/warranty fields |
| Checkouts | `tbl1DvH6ostZs7Jog` | checking gear in/out |
| Fines | `tbliP9x6KL7EUABWc` | late fees + lost-item charges |
| Members | `tbloPfyyjQY79YxQd` | student roster for lookup (Name = "g25K7744 Full Name") |
| Maintenance | `tbldZisWbs1WQIr09` | H&S / Estates requisitions |
| PM | `tblHyr7MxWVDIzFtC` | preventive-maintenance tasks ("Per Use" interval = laser checklist) |
| Settings | `tblfEH66wD8KPJMl9` | shared app settings — one record per key: `leave`, `blocks`, `schedule`, `eqSettings`, `pin` |

Settings record IDs are hard-coded in `src/shared.jsx` (`SETTINGS_RECS`) and
`api/airtable.js`. If you ever recreate those records, update both.

## Access control

- Students need no login. The proxy only allows them: member lookup, request
  GET/POST, equipment GET, checkout POST, fines GET, settings GET (with the
  `pin` record stripped out).
- Staff actions (status changes, fines, PM, H&S, settings edits) require the
  staff PIN. It is stored in the Settings table, verified **server-side**
  (`VERIFY_PIN`), and never sent to browsers. Change it via the ⚙ button on the
  staff dashboard — it applies to all devices immediately.
- Anything not on an allowlist in `api/airtable.js` is rejected with 403.

## Environment variables (Vercel → Project → Settings → Environment Variables)

| Var | What |
|---|---|
| `AIRTABLE_PAT` | Airtable personal access token with read/write on the base |
| `GMAIL_USER` | full Gmail/Workspace address used as the sender |
| `GMAIL_PASS` | Google **App Password** (not the account password) |

⚠️ Never commit tokens. `reset.txt` (local only, gitignored) contains the PAT.

## Day-to-day development

```bash
npm install        # once
npm run dev        # local dev server (http://localhost:5173)
npm run lint       # ESLint — catches undefined references and real bugs; keep it at 0 errors
npm run build      # production build; must pass before pushing
git push           # → Vercel auto-deploys to production
```

Note: `npm run dev` serves only the frontend. The `/api/*` functions do not run
locally, so Airtable-backed screens show empty/cached data in local dev — that
is expected. Real verification happens on the Vercel deployment.

## Recurring maintenance

- **Every January:** update the university calendar in `src/shared.jsx` —
  `PUBLIC_HOLIDAYS_*`, `RECESS_RANGES`, `SWOT_RANGES`, and bump `CAL_DATA_YEAR`.
  (The staff dashboard shows a red warning banner once the data is stale.)
- **Yearly:** review `DEFAULT_EQ_SETTINGS` / loan rules; budget data in
  `src/data/budget.js` is per-cycle.
- **If the URL ever changes:** update `FATS_URL` in `src/lib/email.js`, then
  `node scripts/generate-qr.cjs` and reprint the posters.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Staff actions fail with "Staff PIN required" | Session predates the current PIN — lock (🔒) and unlock again |
| Students see stale leave/blocks | They fetch settings on page load — a reload picks up changes |
| Emails not arriving | Check `GMAIL_USER`/`GMAIL_PASS` in Vercel; App Passwords expire when the account password changes |
| "API token not configured" | `AIRTABLE_PAT` missing in Vercel env |
| Holiday blocking stopped | Calendar data expired — see Recurring maintenance |

## Known limitations (accepted trade-offs)

- Shared staff PIN, no per-user accounts or audit trail of which staff member did what.
- Last-write-wins on concurrent edits from two staff devices.
- Request details live in a JSON blob (`Details` field) — fine for the app, awkward for Airtable-side reporting.
- No automated tests; the lint gate + build are the safety net. Verify changes on the live deployment.
- Helper components inside `App.jsx` (`TabBar`, `TodayCard`, …) are re-created
  per render — flagged by lint as warnings; restructure before adding controlled
  inputs inside them.
