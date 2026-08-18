# FATS — Runbook (What To Do When Things Break)
**Fine Art Tech Support | Rhodes University**
Last updated: May 2026

> **How to use this doc:** Something stopped working. Find the symptom below, follow the steps.
> You do not need the app to be running to read this — open it from the project folder or GitHub.

---

## Where Everything Lives

| Thing | Where |
|---|---|
| Source code | `C:\Users\s1300568\Desktop\fine-art-tech-support\` |
| Live app URL | https://fine-art-tech-support.vercel.app |
| Vercel dashboard | https://vercel.com (log in with your account) |
| Airtable base | https://airtable.com → Fine Art base |
| GitHub repo | https://github.com/Mpura/fine-art-tech-support |
| Gmail account used for sending | The personal Gmail linked in Vercel env vars |

---

## Secret Keys (Environment Variables)

Stored in two places — both must match:

1. **Local development:** `C:\Users\s1300568\Desktop\fine-art-tech-support\.env.local`
2. **Live app:** Vercel Dashboard → Your Project → Settings → Environment Variables

| Variable | What it is | Where to get a new one |
|---|---|---|
| `AIRTABLE_PAT` | Airtable Personal Access Token | airtable.com → Account → Developer Hub → Personal access tokens |
| `GMAIL_USER` | The Gmail address used to send emails | (doesn't change) |
| `GMAIL_PASS` | Gmail App Password (16-char code) | See "Gmail stopped sending" below |
| `CRON_SECRET` | Secret that protects cron endpoints | Make up any long random string |

---

## Symptom: Emails stopped sending

### Step 1 — Check if it's the Gmail App Password
Gmail App Passwords expire or get revoked when you change your Google account password or enable/disable 2FA.

**To get a new App Password:**
1. Go to https://myaccount.google.com
2. Search "App passwords" in the search bar
3. Create a new one — select "Mail" and "Other (custom name)" → name it "FATS"
4. Google shows you a 16-character code — copy it immediately (you won't see it again)
5. Go to Vercel → Your project → Settings → Environment Variables
6. Update `GMAIL_PASS` with the new code
7. Go to Vercel → Your project → Deployments → click the three dots on the latest deployment → Redeploy
8. Test by going to `https://fine-art-tech-support.vercel.app/api/staff-report?preview=true` in the browser

### Step 2 — Check Vercel function logs
1. Go to https://vercel.com → your project
2. Click "Logs" in the top menu
3. Look for red error lines around the time emails should have sent
4. The error message will tell you what went wrong

---

## Symptom: Cron jobs stopped running (emails not auto-sending)

**Check the schedule:**
- Staff report: 1st and 15th of each month at 07:00
- Warning email: 14th and 28th at 07:00
- Estates follow-up: 8th and 22nd at 07:00

**To check if cron ran:**
1. Vercel dashboard → Your project → Cron Jobs tab
2. You'll see last run time and whether it succeeded or failed

**Cron only works on Vercel Pro.** If the account was downgraded to free, cron stops. Check your Vercel plan under Settings → Billing.

**EARLIEST_SEND guard:** The staff report won't send before 1 June 2026 by design. This is intentional — don't remove it until after the first proper send.

---

## Symptom: App won't load / shows blank page

**Step 1 — Check Vercel is up**
Go to https://vercel.com/status — if there's an outage, wait it out.

**Step 2 — Check the deployment**
1. Vercel dashboard → Your project → Deployments
2. Is the latest deployment green (succeeded) or red (failed)?
3. If red, click it to see the build error — usually a syntax error in the code

**Step 3 — Roll back to the last working version**
1. Vercel dashboard → Deployments
2. Find the last green deployment before things broke
3. Click the three dots → "Promote to Production"
4. App is back up immediately

---

## Symptom: Airtable data isn't showing / API errors

**Step 1 — Check if the PAT expired**
Airtable Personal Access Tokens can be set to expire.
1. Go to https://airtable.com → click your avatar → Developer Hub → Personal access tokens
2. Check if your token is still listed and hasn't expired
3. If expired: create a new one with the same scopes (`data.records:read`, `data.records:write`)
4. Update `AIRTABLE_PAT` in Vercel env vars
5. Redeploy

**Step 2 — Check Airtable is up**
https://status.airtable.com

**Step 3 — Check the base and table IDs haven't changed**
The Base ID and Table ID are hardcoded in the API files. If someone recreated the base from scratch, these would change.
- Base ID: `appwRiUCBDUWkLo5j` (in `api/airtable.js`, `api/availability.js`, `api/email.js`, `api/_auth.js`, `api/log-followup.js`, `api/cron-followup.js`, `api/staff-report.js`, `src/shared.jsx`, `reset_equipment.js` — moved here from `appUqkCfnsOo2Jf7z` on 2026-08-18 after hitting the old workspace's monthly API request cap; migrated to a fresh workspace since the cap is tracked per-account/workspace, not per-base)
- Maintenance Table ID: `tbldZisWbs1WQIr09`

To find the current IDs: open Airtable → your base → Help → API documentation. The IDs are in the URL and the docs.

---

## Symptom: I pushed code to GitHub but the live app didn't update

Vercel auto-deploys when you push to the `main` branch on GitHub.

1. Check that you pushed to `main` (not another branch): `git branch` in the terminal
2. Check Vercel → Deployments — is a new deployment running or queued?
3. If no deployment triggered: go to Vercel → Settings → Git → check the GitHub connection is still authorised

---

## Symptom: I can't remember how to run the app locally

```bash
# Open terminal in the project folder, then:
npm run dev
```
App opens at http://localhost:5173

The local app talks to the real Airtable and real email — be careful when testing.

To test the API functions locally:
```bash
npm install -g vercel
vercel dev
```
This runs everything including the serverless functions at http://localhost:3000

---

## How to update the staff email list

Open `api/staff-report.js` — find the `STAFF` array near the top. Add or remove emails there. Save, commit, push to GitHub. Vercel redeploys automatically.

---

## How to change the cron schedule

Edit `vercel.json` in the project root. The schedule uses standard cron syntax:
```
0 7 1,15 * *   = 07:00 on the 1st and 15th of every month
```
Commit and push. Takes effect on next deployment.

---

## Emergency contacts / accounts

| Account | Used for | Credentials |
|---|---|---|
| Vercel | Hosting and cron | (your login) |
| GitHub | Source code | (your login) |
| Airtable | Database | (your login) |
| Gmail (sending) | Email SMTP | (the personal Gmail in GMAIL_USER) |

> If handing over to someone else: transfer the Vercel project (Settings → Transfer), transfer the GitHub repo, share Airtable base, and give them a new Gmail App Password.
