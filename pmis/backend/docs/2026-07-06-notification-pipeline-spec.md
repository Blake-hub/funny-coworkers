# Notification Pipeline (Mentions-only MVP) Specification
Date: 2026-07-06
Status: Awaiting user approval
Owner: Engineering

## 1. Goal & Scope (MVP — Option A)

Deliver a working end-to-end in-app notification pipeline so that:

> When a user saves a wiki page whose rich text content contains `@mention` nodes inserted by the TipTap editor, each mentioned user receives a bell notification in the global header. Clicking the notification marks it as read and navigates to the wiki page.

**In scope for this round:**
- Trigger: `WIKI_MENTION` only. Produced on wiki page **create** AND **update** saves.
- Delivery: In-app bell dropdown + badge only (Header.tsx). No email, no SMS, no push.
- Push: 30 s client-side polling of the lightweight `unread-count` endpoint; full list refresh on bell-open + count change.
- Interactions: Mark-as-read on row click, mark-all-as-read button, newest-first ordering, skip self-mentions, dedupe by (recipient × target wiki page × actor).

**Deliberately out of scope (deferred to later rounds — plugging onto the same pipeline):**
- Comment mentions (trigger B), wiki page edit alerts (trigger C), folder/team permission changes (trigger D).
- Real-time WebSocket / SSE delivery.
- Server-side email delivery, digest emails, unsubscribe preferences.
- Notification preference UI (per-type mute rules).

## 2. Architecture (Approach 1 — Backend-side extraction)

Single-authority model. The backend scans the persisted `contentHtml` after every wiki page save. Produces notification rows atomically as part of the same service call.

```
User edits wiki (port 3000) ──▶ POST/PUT /api/wiki/pages ──▶ WikiPageService.save(...)
                                                                   │
                                                                   ▼
                                          parse mention spans from savedPage.contentHtml
                                          (skip self, dedupe IDs → Set<Long> mentionedUserIds)
                                                                   │
                                                                   ▼
                                          NotificationService.notifyWikiMentions(
                                            savedPage, mentionedUserIds, actorUser)
                                          ├─ find-or-create per recipient
                                          ├─ on re-occurrence: update createdAt + reset readStatus=false
                                          └─ save to NotificationRepository

Client (Header.tsx):
  ├─ on mount → GET /api/notifications?limit=30  (list + unreadCount in payload)
  ├─ every 30s → GET /api/notifications/unread-count
  │               (if count ↑, background-refresh list)
  ├─ bell open  → GET /api/notifications          (fresh list NOW)
  └─ row click  → PATCH /api/notifications/{id}/read
                  + router.push(actionUrl)
```

Key invariant: **only WikiPageService.createWikiPage / .updateWikiPage call the notification service.** Any future client that saves HTML via these endpoints automatically triggers the pipeline. No notification-save logic lives in the frontend.

## 3. Data Model

### 3.1 Schema change — V15__notification_enhancements.sql (Flyway)

Backward-compatible addition of ONE column to existing `notification` table to track the actor (user who caused the notification):

```sql
ALTER TABLE notification
    ADD COLUMN actor_user_id BIGINT NULL
    COMMENT 'User who triggered the notification (e.g. the editor who @mentioned). NULL for system-generated.';

CREATE INDEX idx_notification_user_read ON notification(user_id, read_status);
CREATE INDEX idx_notification_recipient_target_actor
    ON notification(user_id, target_type, target_id, actor_user_id);
```

### 3.2 Entity change — Notification.java (backend)

Add one field to the existing JPA entity to match the new column:

```java
@Column(name = "actor_user_id")
private Long actorUserId;
```

Everything else (`type`, `targetId`, `targetType`, `readStatus`, `createdAt`, `userId`) is reused from the existing entity.

### 3.3 Dedup + skip-self rules (service layer, NOT DB unique index)

In `NotificationService.notifyWikiMentions()`:

1. **Skip self:** drop any entry from `mentionedUserIds` where `recipientId.equals(actor.getId())`. Never produces a notification for the person writing the mention.
2. **Dedup window:** before inserting a new row, query for existing by:
   `userId = recipientId AND targetType = 'WIKI_PAGE' AND targetId = savedPage.id AND actorUserId = actor.id AND type = 'WIKI_MENTION'`.
   - If **row exists:** update `set createdAt = NOW(), readStatus = false` (re-surfaces old notification as new/unread — matches the semantics "the author saved again while you're still in the mentions").
   - If **no row exists:** insert a new `Notification` with the fields below.

### 3.4 NotificationDTO (rich view returned to clients)

Rather than store display blobs on the table, the backend assembles a human-consumable DTO on each GET. This is cheap for the MVP `limit=30` list.

```java
public record NotificationDTO(
    Long id,
    String type,            // "WIKI_MENTION" (front-end can use this for per-type icons later)
    Boolean readStatus,
    LocalDateTime createdAt,
    String title,           // "Adm.Yang mentioned you in \"Q3 Roadmap\""
    String actionUrl        // "/wiki/42"  (client just router.push on click)
) {}
```

**DTO assembly rules for `WIKI_MENTION` rows, performed in NotificationService.listDtosForUser(...)** using batched lookups (one SQL IN each):
- Batch all `targetId` values from the rows → `Map<Long, WikiPage>` by ID → page title + id for URL.
- Batch all `actorUserId` values → `Map<Long, User>` by ID → actor name.
- For edge cases where a page or actor was later deleted:
  - No page: title → `"…mentioned you in a deleted wiki page"`; `actionUrl` → `"/wiki"` (safe fallback).
  - No actor: title → `"\*A user\* mentioned you in \"%s\""`.

## 4. Public API

All endpoints live under `NotificationController` and require authentication (Bearer token, same as `/api/wiki/pages`). Request current user via `JwtAuthenticationFilter` populates the Spring Security context → `@AuthenticationPrincipal User user`.

### 4.1 List notifications

```
GET /api/notifications?limit=30
```

Query:
- `limit`: optional, max returned rows. Default 30. Hard cap at 50; values over 50 silently clamp. Response 200 OK:
```json
{
  "items": [
    {
      "id": 104,
      "type": "WIKI_MENTION",
      "readStatus": false,
      "createdAt": "2026-07-06T13:42:11",
      "title": "Adm.Yang mentioned you in \"Q3 Roadmap\"",
      "actionUrl": "/wiki/42"
    }
  ],
  "unreadCount": 2
}
```
Ordering: `createdAt DESC` (newest first), matches interaction bundle choice §5.

### 4.2 Poll unread count only (lightweight)

```
GET /api/notifications/unread-count
```
Response 200 OK:
```json
{ "unreadCount": 2 }
```
Implementation: repository count query `COUNT(*) WHERE user_id = ? AND read_status = false`. Do NOT pull rows here — stays fast for 30 s cadence.

### 4.3 Mark single notification as read

```
PATCH /api/notifications/{id}/read
```
Empty body. Idempotent. Returns 200 OK: `{ "ok": true }`.
Security check: only allowed if `notification.userId` equals current authenticated user ID (prevents reading others' notifications by iterating IDs). If not found OR not owned → 404 (generic "not found" to avoid ID enumeration).

### 4.4 Mark ALL notifications for current user as read

```
PATCH /api/notifications/mark-all-read
```
Empty body. Idempotent. Returns 200 OK: `{ "ok": true, "updatedCount": 5 }`.
Implementation: one `UPDATE notification SET read_status = true WHERE user_id = ? AND read_status = false` — efficient.

## 5. Notification production path (wiki save side)

### 5.1 Location

In [WikiPageService.java](file:///D:/dev/treapro/HelloCPP/funny-coworkers/pmis/backend/src/main/java/com/example/pmis/service/WikiPageService.java):

- **`createWikiPage(...)` method:** right after `WikiPage savedWikiPage = wikiPageRepository.save(wikiPage);` (line ~91).
- **`updateWikiPage(...)` method:** right after `WikiPage savedWikiPage = wikiPageRepository.save(wikiPage);` (line ~134).

Insert the exact same two lines in both places (helper method to keep DRY):

```java
private void afterSaveProduceMentions(WikiPage saved, User actor) {
    Set<Long> mentioned = MentionExtractor.extractUserIds(saved.getContentHtml());
    if (mentioned.isEmpty()) return;
    notificationService.notifyWikiMentions(saved, mentioned, actor);
}
```

### 5.2 Mention extraction (backend)

For MVP, parse the known-deterministic TipTap mention markup with a regex. Swap to JSoup later if more HTML variants appear.

New utility class `MentionExtractor.java`:

```java
public final class MentionExtractor {
    // TipTap Mention extension default:
    //   <span data-type="mention" data-id="5" data-label="Adm.Yang" class="mention">…
    // Captures group 1 = numeric user ID. Accepts quotes or single-quotes and any attribute order.
    private static final Pattern MENTION_ID = Pattern.compile(
        "<span\\b[^>]*\\bdata-type\\s*=\\s*([\"'])mention\\1" +  // span with data-type=mention (captured quote 1 used for balance)
        "[^>]*\\bdata-id\\s*=\\s*([\"'])(\\d+)\\2",               // data-id with matching quote style (group 3 = digits)
        Pattern.CASE_INSENSITIVE
    );

    public static Set<Long> extractUserIds(@Nullable String html) {
        if (html == null || html.isBlank()) return Collections.emptySet();
        Set<Long> out = new LinkedHashSet<>();
        Matcher m = MENTION_ID.matcher(html);
        while (m.find()) {
            try { out.add(Long.parseLong(m.group(3))); } catch (NumberFormatException ignore) {}
        }
        return out;
    }
}
```

Rejecting the old `< 10` numbers and graceful failures: malformed content → empty set → no notifications, no exceptions.

### 5.3 Repository + helpers

Extend `NotificationRepository` with 2 derived queries:

```java
Optional<Notification> findOneByUserIdAndTargetTypeAndTargetIdAndActorUserIdAndType(
    Long userId, String targetType, Long targetId, Long actorUserId, String type);

long countByUserIdAndReadStatus(Long userId, Boolean readStatus);
```

## 6. Frontend

### 6.1 New services in api.ts

Add to [services/api.ts](file:///D:/dev/treapro/HelloCPP/funny-coworkers/pmis/frontend/src/services/api.ts):

```typescript
export interface NotificationResponse {
  id: number;
  type: string;             // 'WIKI_MENTION' today; extensible
  readStatus: boolean;
  createdAt: string;
  title: string;            // rendered server side. React escapes via text node.
  actionUrl: string;
}

export interface NotificationsListResponse {
  items: NotificationResponse[];
  unreadCount: number;
}

export const notificationApi = {
  list: (limit = 30) =>
    fetchApi<NotificationsListResponse>(`/notifications?limit=${limit}`),
  unreadCount: () =>
    fetchApi<{ unreadCount: number }>('/notifications/unread-count'),
  markRead: (id: number) =>
    fetchApi<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () =>
    fetchApi<{ ok: boolean; updatedCount: number }>(
      '/notifications/mark-all-read',
      { method: 'PATCH' }
    ),
};
```

### 6.2 Header.tsx: replace mockNotifications with real data

File: [components/Layout/Header.tsx](file:///D:/dev/treapro/HelloCPP/funny-coworkers/pmis/frontend/src/components/Layout/Header.tsx)

Replace the 99-line mock setup (Notification interface + mockNotifications array + `unreadCount = mockNotifications.filter`). New flow:

```
state:
  notifications: NotificationResponse[]      // list items
  unreadCount: number                         // badge (mirrors payload on list fetch + separate poll)
  showNotifications: boolean                  // dropdown open/close (existing state)
  lastFetchToken: number                      // dedupe overlapping fetches in flight

effects:
  on mount with user !== null:
    fetchList() once
    start 30 s setInterval → pollUnreadCount()
    cleanup interval on unmount

  on showNotifications toggled → true (bell opened):
    fetchList() immediately  // guarantee user sees freshest data when looking

row click handler (per item):
  1. local optimistic: flip notifications[i].readStatus = true; if (unreadCount > 0) unreadCount--
  2. fire & forget: notificationApi.markRead(id).catch(no-op)  // next full fetch reconciles if fails
  3. router.push(item.actionUrl)  // go to wiki page

"Mark all as read" click (new button top-right inside dropdown header, alongside X):
  1. local optimistic: for each n in notifications, n.readStatus = true; unreadCount = 0
  2. fire & forget: notificationApi.markAllRead().catch(no-op)

Empty state (items.length === 0):
  <div className="text-center text-gray-400 py-12 text-sm">
    No notifications yet. When someone mentions you in a wiki page,
    it'll show up here.
  </div>
```

**Polling cadence (P1 from design):** interval only calls the **lightweight** `unread-count` endpoint. Only if a newer count > previously known `unreadCount` → silently call `fetchList()` in the background so list updates too. Never calls the heavier list endpoint on a 30 s timer when nobody is looking.

### 6.3 Badge render

Keep existing behavior: render red dot + number only if `unreadCount > 0`. If count is 0, do not render the badge (clean UI).

### 6.4 Visual tweaks (optional, low-effort, no new dependencies)

- Keep the existing bell layout from the current Header.tsx for zero-risk migration.
- Add one small improvement: each row's **left border** rendered with a 3 px vertical accent `border-l-4 border-blue-500` when `!readStatus` (so unread rows have a stronger scannable cue than just background tint).
- Add small "Mark all as read" ghost button in the header row next to X — uses the same `CheckSquare` or similar icon from lucide-react if available; else plain text.

## 7. Error handling & edge cases

| # | Scenario | Handled how |
|---|---|---|
| E1 | Wiki content null/blank | `extractUserIds` returns empty → no notifications. Service no-ops. |
| E2 | Regex finds a non-numeric data-id (corrupt HTML) | `NumberFormatException` caught → ignore match → no crash. |
| E3 | Notification target (wiki page) later deleted | DTO builder catches missing page → shows "mentioned you in a deleted wiki page" + falls back to `/wiki` URL. |
| E4 | Actor user was hard-deleted (rare — soft-delete not in schema) | Actor name becomes "\*A user\*" in the title; notification still readable. |
| E5 | Current user tries to PATCH mark-read on a notification they don't own | Controller checks ownership → 404 Not Found; never leaks others' state. |
| E6 | Same `(recipient, target, actor)` produces a duplicate insert due to race in save | Service layer `find + if (!found) save` is non-atomic; mitigate by using `findOne…AndActorUserId` inside the same transaction (`@Transactional` on the method, which it already is via call site in WikiPageService). If a race somehow still occurs in high concurrency, users see two rows — acceptable for MVP. Fix later with unique constraint + `ON CONFLICT` if needed. |
| E7 | 30 s poll fired while user is offline | `fetchApi` rejects → swallow → badge stays stale → next successful poll when online recovers. No toast to user (toasts would be spammy on flaky networks). |
| E8 | markRead PATCH fails (network blip) | Local state stayed optimistic. On next list fetch (bell open or count-poll triggered), server state wins back → row reverts visually → no data loss. |
| E9 | Recipient doesn't have view access to the page anymore | DTO still links to `/wiki/{id}`. When user clicks, they see the existing "Access denied" from the wiki page permission guard — consistent with not deleting old notifications when ACLs change. |
| E10 | `@You` appears 12 times in the same content | `Set<Long>` → 1 deduped mention per recipient per page per actor. Users don't get spammed 12×. |

## 8. Verification & manual smoke test

Scenario performed once by hand against running dev servers (3000 + 8080):

1. Login as `userA`. Login as `userB` in incognito.
2. `userA` creates a new wiki page "Notif Test". In content: type `@userB` and pick user B from the dropdown. Save.
3. Within **≤ 30 s** the incognito session (userB) shows:
   - Header bell shows badge = 1.
   - Open bell → shows one unread row with title: `"<userA name> mentioned you in \"Notif Test\""`.
   - Click row → you are taken to `/wiki/{id}` (page content displays) AND the bell badge drops to 0. Refresh the page you land on → badge stays 0.
4. `userA` edits the same page, adds another `@userB` mention somewhere else. Saves.
   - Back to userB: bell badge goes back to 1; on open, only ONE row exists (the dedup row updated), not two rows. Timestamp refreshed.
5. `userA` types `@userA` (self mention) + saves.
   - No notification produced for userA. Badge stays 0 on userA's session.
6. Header → Mark all as read pressed.
   - Any unread rows go blue → gray. Badge = 0. Count endpoint returns 0.
7. Network resilience: stop backend server, wait ≥ one 30 s poll tick, restart backend, wait ≤ 30 s.
   - No error toasts. Badge count recovers automatically on the next successful poll.

## 9. Files to create / modify

### Backend (Spring / Java)
| Action | Path | Notes |
|---|---|---|
| Modify entity | `entity/Notification.java` | Add `actorUserId` field + column annotation. |
| Add migration | `resources/db/migration/V15__notification_enhancements.sql` | ALTER TABLE ADD actor_user_id + indexes. |
| Extend repo | `repository/NotificationRepository.java` | Add 2 derived queries: findOneByUserId…ActorUserIdAndType, countByUserIdAndReadStatus. |
| NEW service | `service/NotificationService.java` | `notifyWikiMentions`, `listDtosForUser(limit, user)`, `getUnreadCount(user)`, `markRead(id, user)`, `markAllRead(user)`. @Transactional. |
| NEW util | `util/MentionExtractor.java` | Regex-based ID extractor (see §5.2). Unit-testable. |
| Modify service | `service/WikiPageService.java` | Inject `NotificationService`; call afterSaveProduceMentions(saved, currentUser) at tail of create + update. |
| NEW controller | `controller/NotificationController.java` | 4 endpoints of §4. All authenticated. |
| (Optional) NEW DTO | `dto/NotificationDTO.java` | Or use a Java 17 record. Same shape as §3.4 spec JSON. |

### Frontend (React + Next.js)
| Action | Path | Notes |
|---|---|---|
| Extend API client | `services/api.ts` | Add `NotificationResponse`, `NotificationsListResponse` interfaces + `notificationApi` (4 methods). |
| Rewire component | `components/Layout/Header.tsx` | Drop mockNotifications. Replace with real fetches + 30 s poll + row/mark-all actions. Keep bell layout. |
| (Optional) add icon | `components/Layout/Header.tsx` | Import `CheckSquare` or just use a "Mark all as read" text button. |

## 10. Anti-requirements (explicitly NOT doing in this round)

- No WebSocket / EventSource.
- No emails, no `spring-boot-starter-mail`, no template engines for notifications.
- No retro-active cleanup of old `NULL actor_user_id` rows (leave; list DTO handles NULL gracefully).
- No per-user notification preferences (mute rules / toggles per type).
- No pagination beyond the `limit` query param (cursor/offset pagination deferred until a user hits a realistic ceiling of hundreds of unread notifications).
- No cross-window sync (two browser tabs open against the same user): count updated independently per tab on their 30 s interval. Good enough for MVP.
