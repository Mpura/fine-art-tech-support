# Fine Art Tech Support — Build Progress

**Last updated:** 17 April 2026  
**File:** `src/App.jsx` (single-file React/Vite SPA)

---

## ✅ Completed

### Foundation
- Equipment collection: Mon/Wed/Fri only, three 30-min slots (11:00–11:30, 11:30–12:00, 12:00–12:30) with per-slot capacity cap
- Fix: returned items no longer reappear as available (createCheckIn posts "Checking In" record to Airtable)
- Equipment images on "Check my request" screen — fresh URL fetch on load to avoid Airtable 2-hour URL expiry
- "Mpumzi" → "Tech Support" throughout
- "General query" + "Other" merged into single "General query / other" entry

### Lab Service Booking Rules
All four lab services now have distinct booking flows:
- **Print** — `bookable:true`, 2-day advance minimum, calendar with morning/afternoon slots
- **Laser** — `bookable:true`, 3-day advance minimum, calendar + session duration selector (1hr / 2hr required)
- **3D printing** — `bookable:false`, drop-off model, date picker in form with 5-day minimum
- **Studio** — `bookable:false`, key handover via Mon/Wed/Fri slot picker (reuses EQ_COL_SLOTS)

### Stockroom Clash Fix
On Mon/Wed/Fri, the morning slot in the lab calendar is greyed out with a warning banner. Students can still book afternoons freely on those days — more flexible than blocking the whole day.

### Staff Queue Redesign
- Cards now have a coloured left border per service type (`TYPE_COLOR` map)
- Service type + icon shown prominently in type colour at card top
- Student name, year, student number in clear hierarchy
- Scheduled date shown as a coloured chip
- Equipment cards show item photo thumbnails + due date
- All cards sorted most-recent-first
- Queue images fetched fresh (Airtable URL expiry handled via `queueEqImages` state)

### Gallery / Space Booking
- Venue selector added: Main gallery, 2nd year studio, Seminar room, Other
- "Tech support needed?" Yes/No toggle
- Rules PDF link banner at top of form (URL placeholder — update when doc is ready)
- Venue + tech support shown in staff queue card

### Laser — Material Test Status (Student View)
When staff sets status to "Material test required", student's Check screen shows:
- Orange-bordered explanation card: bring material, come at booked time, 5–10 min test
- Separate "Ready to cut" confirmation card when test passes

### Print — Student Present Toggle
- "Will you be present during printing?" Yes/No required before submit
- Shows as 👤 Present or 📬 Drop-off in staff queue card
- Submit button blocked until answered

### Software — Split Flow (code written, pending verify)
- "Adobe / licence" path → IT referral info card (still submits a record), no scheduling needed
- "Mac software install" path → existing fields (name, URL, Mac location) + schedule picker
- Mac path: "Right now" removed, schedule-only
- Mac path: stockroom clash warning if Mon/Wed/Fri 09:00–12:59 is chosen

---

## 🔄 In Progress

### Cross-service Slot Blocking (Item 6) — NOT YET CODED
**What:** If laser has a booking for morning on a given day, print calendar should also grey out that morning (and vice versa) — Mpumzi can only supervise one thing at a time.

**Plan:**
- Add cross-service check to `isAvail()` in CalendarPicker:
  ```js
  const mCross = BOOKABLE.map(t=>t.id).filter(id=>id!==eqId)
    .some(id=>getBookings(id,k,"morning")>0);
  ```
- Same for `mFull`/`aFull` in the slot button section
- Slot label shows "Conflict" instead of "Full" when blocked by cross-service

---

## 📋 Remaining

### 7 — File prep guide links (low priority)
Add "Download prep guide →" PDF link on each service's prep checklist screen (print, laser, 3D). PDFs need to be uploaded/linked first.

---

## Key Technical Notes

| Thing | Detail |
|---|---|
| Only file changed | `src/App.jsx` |
| Airtable base | `appwRiUCBDUWkLo5j` |
| Storage | `localStorage` for requests/schedule/settings; Airtable for Equipment, Fines, Members |
| Airtable URL expiry | ~2 hours — always fetch fresh via `fetchEqImagesByIds()` |
| Equipment collection days | `EQ_COL_DAYS = [1,3,5]` (Mon/Wed/Fri) |
| Slot IDs | `EQ_COL_SLOTS = [{id:"s1",label:"11:00–11:30"}, ...]` |
| Advance booking helper | `addBusinessDays(dateStr, n)` — SAST-safe using local date parts |
| Bookable services | `print`, `laser` (both `bookable:true`) |
| Calendar min-advance | `minAdvanceDays` per service in `DEFAULT_SCHEDULE`; enforced in `isAvail()` |
| Gallery rules PDF | Placeholder URL in form — replace `GALLERY_RULES_PLACEHOLDER` when ready |
| IT help desk email | Placeholder in software/adobe form — replace `itsupport@university.ac.za` |
