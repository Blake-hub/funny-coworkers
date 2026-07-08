# Notification Pipeline — Functional Regression Checklist
Source spec: [2026-07-06-notification-pipeline-spec.md §8](./2026-07-06-notification-pipeline-spec.md)

Rule: Check each item → PASS or FAIL + evidence (screenshot / console / network log). Do NOT move past a FAIL until it is fixed or intentionally waived with reason.
Preconditions:
  - Backend running on port 8080. Flyway log shows `Successfully applied 1 migration (V15__notification_enhancements.sql)`.
  - Frontend running on port 3000. TypeScript compiled with 0 errors.
  - Two test accounts created / available. Call them `userA` (author) and `userB` (recipient). You can login as `userB` in an incognito window so two sessions live simultaneously against the same running backends.

---

### C1 — Badge count: 0 by default for userB with no activity
**Steps:** Login as userB (clean account, never mentioned). Open any non-login page. Look at Header bell.
**PASS if:** No red dot / no badge OR badge explicitly rendered as empty (no digit). Network: `GET /api/notifications?limit=30` returns `items: []` and `unreadCount: 0`. `GET /api/notifications/unread-count` returns `{ unreadCount: 0 }`.
**FAIL if:** Badge shows any number > 0, or `/list` throws 5xx.

---

### C2 — Mention creates one notification within ≤ 30 s
**Steps:**
  1. In normal window: login as `userA`. Go to `Wiki → New Document`.
  2. Title: `"Notif Test: 01"`. In the rich text editor, type `@` → select `userB` from the dropdown. Should render as `@<userB name>` inline.
  3. Save + publish page.
  4. Switch to incognito `userB` tab. Stay on dashboard.
**PASS if:** Within ≤ 31 seconds (one 30 s poll tick + a 1 s safety margin):
  - Header bell badge flips from 0 → 1.
  - On clicking the bell: the list contains exactly 1 unread row.
  - Row `title` contains BOTH (a) `userA` full name actor and (b) the substring `"Notif Test: 01"` from the page title.
  - Row `readStatus === false` (row is visually: has blue left border).
**FAIL if:** No notification, badge stays 0. Or title contains a generic "deleted page" / "A user" fallback (those are allowed only if actor/page is actually deleted, which they aren't here).

---

### C3 — Click notification → mark as read + navigate to correct wiki page AND badge resets
**Steps:** In userB window, click directly on the notification row from C2. Wait for navigation.
**PASS if:**
  - URL bar becomes `/wiki/<pageId>`.
  - Back on dashboard or any page after navigating, Header bell badge → 0 (no digit).
  - Open bell dropdown again → the single row no longer has blue border or blue background → gray/read visually.
  - Network log (Preserve log): `PATCH /api/notifications/<id>/read` returned 200 with `{"ok":true}`.
  - Subsequent poll of `unread-count` endpoint returns `{ unreadCount: 0 }`.
**FAIL if:** Badge stuck at 1, or row still displays blue.

---

### C4 — Dedup: same author re-saving the same page does NOT stack duplicate rows
**Steps:**
  1. Login as userA. Re-open the same page ("Notif Test: 01") for editing.
  2. Add any small edit somewhere + save (you can even add `@userB` a second time somewhere else in the doc to re-trigger the mention span).
  3. Save again.
**PASS if:**
  - Back in userB window, within ≤ 31 s: bell badge → 1 (not 2).
  - On opening bell: ONLY 1 row total exists (not 2).
  - `createdAt` on that row is NEWER than the original from C2 (i.e., the dedup updated timestamp as specified).
**FAIL if:** Two rows appear for the same (userA → Notif Test: 01 → userB) mention combination.

---

### C5 — Self mention never produces a notification
**Steps:**
  1. Login as userA, create a brand NEW page `"Self Test"` (page id 2). Type `@userA` in the body → pick userA from the dropdown (you ARE userA). Save.
  2. Stay on userA session.
**PASS if:**
  - Bell badge stays at 0 (never increments) even after 40 s (to ensure you've exceeded a full poll cycle).
  - Dropdown list → no new rows added; any old count unchanged.
  - Database query: `SELECT count(*) FROM notification WHERE user_id = userA.id AND target_id = newPage.id;` → 0.
**FAIL if:** New self-mention row appears; badge > 0.

---

### C6 — "Mark all as read" button works and batch-updates in one call
**Steps:**
  1. Create at least 2 unread notifications for userB (e.g., mention userB in 2 different pages from userA). Wait for both in userB window until badge = 2.
  2. Click bell → open dropdown. You see 2 unread rows.
  3. Click the NEW "Mark all as read" button next to the header X / close button.
**PASS if:**
  - Both rows instantly flip from blue → gray.
  - Badge immediately → 0.
  - Network shows ONE call `PATCH /api/notifications/mark-all-read` → returned 200 `{"ok":true,"updatedCount":2}`.
  - A fresh `list` call (triggered by either bell re-open or poll) returns both as `readStatus: true`.
**FAIL if:** Still shows badge > 0, or you see N separate `PATCH .../read` calls (that would indicate the frontend is looping per-row instead of using the batch endpoint).

---

### C7 — Network resilience: no toasts on offline polls, automatic recovery when backend returns
**Steps (no real outage needed — simulate via devtools):**
  1. Open userB dashboard tab. Open DevTools Network → Throttling → Offline.
  2. Wait ≥ 40 s (at least one 30 s poll tick fires).
**PASS phase A (offline grace):**
  - No Toast / Alert / console red `unhandledrejection` errors visible in the Console tab. Badge shows stale count (no change) — that's OK.
  3. Uncheck Offline → restore online. Wait ≤ 35 s (next poll).
**PASS phase B (recovery):**
  - Count endpoint returns successfully on the first NEXT poll.
  - If there were pending notifications, badge updates. No data was permanently lost due to the transient offline window.
**FAIL if:** An error toast appears ("Network request failed", uncaught rejection red), or count endpoint is never called again after restoring online.
