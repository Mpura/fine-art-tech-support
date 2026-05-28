# FATS — IT Briefing Notes
**Fine Art Tech Support | Rhodes University**
Last updated: May 2026

---

## What is FATS?

An internal web application built for the Fine Art Department to manage maintenance requests. It replaces a manual spreadsheet-and-email process.

**What it does:**
- Logs maintenance requests submitted to Estates
- Tracks status (Open → In Progress → Resolved)
- Sends fortnightly maintenance status emails to all department staff
- Automatically chases Estates for requests outstanding 14+ days
- Manages laser cutter bookings and equipment availability

**Current users:** 1 (Mpumzi Mpati, Fine Art Department)
**Scale:** ~50 records, 13 staff email recipients

---

## Infrastructure Overview

| Layer | What we use | Where it lives |
|---|---|---|
| Frontend | React (Vite) | Vercel (CDN) |
| Backend | Vercel Serverless Functions | Vercel (US East) |
| Database | Airtable | Airtable cloud (US) |
| Email sending | Gmail SMTP via nodemailer | Google (personal account) |
| Source code | Git | GitHub |
| Cron jobs | Vercel Cron | Vercel |

---

## Known Gaps & Responses

### 1. No authentication
**Gap:** The app URL is unprotected — anyone with the link can access it.

**Current justification:** Single user, URL not publicly shared or indexed. Low risk at present scale.

**Proposed fix if required:** Simple shared department password (1–2 hours to implement) or Rhodes Google SSO using `@ru.ac.za` accounts (requires a Google OAuth Client ID from IT).

---

### 2. Data stored on Airtable (external, US servers)
**Gap:** Staff emails and maintenance records are stored on Airtable's US cloud infrastructure.

**Data held:**
- Staff email addresses (13 people)
- Maintenance request descriptions and locations
- No student data, no financial data, no medical data

**POPIA position:** Airtable offers a Data Processing Agreement (DPA) compatible with POPIA. This would need to be reviewed and signed by the appropriate university authority.

**Airtable DPA:** https://www.airtable.com/legal/dpa

---

### 3. Emails sent from personal Gmail account
**Gap:** Automated emails go out from a personal `@gmail.com` address, not an official `@ru.ac.za` address.

**Current mitigation:** Display name set to "Mpumzi Mpati | Fine Art Dept", Reply-To set to `m.mpati@ru.ac.za` so all replies go to the RU inbox.

**Proposed fix if required:** Replace Gmail SMTP credentials with Rhodes University SMTP server credentials for `m.mpati@ru.ac.za`. This requires IT to provide SMTP host, port, and credentials. No code changes beyond swapping the env vars.

---

### 4. Hosted on Vercel (not on university infrastructure)
**Gap:** The application is not hosted on Rhodes University servers and is not under IT's direct control.

**Current justification:**
- Vercel provides 99.99% uptime SLA
- Automatic HTTPS/SSL on all traffic
- No university infrastructure cost
- Deployments are automated via GitHub push

**If university hosting is required:** The app can be exported as a static build (`npm run build`) and the serverless functions rewritten as a traditional Node.js/Express server. Would require a server with Node.js and a process manager (PM2).

---

### 5. Project owned by personal account
**Gap:** The Vercel project and GitHub repository are under a personal account. If Mpumzi leaves, access goes with him.

**Proposed fix:** Transfer the Vercel project and GitHub repository to a departmental or IT-managed account. All credentials and env vars are documented in `docs/runbook.md`.

---

## What IT Would Need to Provide (if formalising)

| Item | Purpose |
|---|---|
| Rhodes SMTP credentials for `m.mpati@ru.ac.za` | Send emails from official address |
| Google OAuth Client ID for `@ru.ac.za` domain | Enable SSO login |
| Hosted server or approved platform | Replace Vercel if required |
| Sign-off on Airtable DPA | POPIA compliance |

---

## Security Positives

- All traffic is HTTPS (enforced by Vercel)
- No passwords stored in the application
- No student data handled
- No payment processing
- API keys stored as environment variables, not in source code
- `.env.local` is in `.gitignore` — secrets never uploaded to GitHub
- Low sensitivity data (maintenance requests only)
