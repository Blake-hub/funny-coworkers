# Notification Pipeline — Task Breakdown
Source spec: [2026-07-06-notification-pipeline-spec.md](./2026-07-06-notification-pipeline-spec.md)

All tasks are ORDERED sequentially because each downstream file depends on types/interfaces created upstream. Do NOT parallelize tasks in different files.

---

## Task 1 — Flyway migration + entity field (actor_user_id)
**Files touched:**
  - [NEW] `backend/src/main/resources/db/migration/V15__notification_enhancements.sql`
  - [MODIFY] `backend/src/main/java/com/example/pmis/entity/Notification.java`

**Deliverable:**
  - Migration script (idempotent per Flyway): ALTER TABLE `notification` ADD `actor_user_id BIGINT NULL`; add two indices (`idx_notification_user_read`, `idx_notification_recipient_target_actor`) exactly per spec §3.1.
  - Add field `private Long actorUserId;` with `@Column(name = "actor_user_id")` to Notification entity. No other entity changes.
**Validation:** Backend compiles. Flyway runs when `./gradlew bootRun` starts (or restart manually) — no migration error in startup log. `SELECT actor_user_id FROM notification LIMIT 1;` returns a valid column (NULLs OK) against the DB.

## Task 2 — Repository derived queries + NotificationDTO record
**Files touched:**
  - [MODIFY] `backend/src/main/java/com/example/pmis/repository/NotificationRepository.java`
  - [NEW] `backend/src/main/java/com/example/pmis/dto/NotificationDTO.java` (or `record` inside dto/)

**Deliverable:**
  - Repo gains two methods (keep naming valid Spring Data JPA derived query):
    1. `Optional<Notification> findOneByUserIdAndTargetTypeAndTargetIdAndActorUserIdAndType(Long userId, String targetType, Long targetId, Long actorUserId, String type);`
    2. `long countByUserIdAndReadStatus(Long userId, Boolean readStatus);`
  - New `NotificationDTO` Java 17 record (or class + record-style getters): 6 fields exactly per spec §3.4 JSON: `Long id`, `String type`, `Boolean readStatus`, `LocalDateTime createdAt`, `String title`, `String actionUrl`. Fields match 1:1 case with the JSON the frontend will consume.
**Validation:** Backend compiles. Start backend — no query derivation error. Spring does not crash on repository creation.

## Task 3 — MentionExtractor utility
**Files touched:**
  - [NEW] `backend/src/main/java/com/example/pmis/util/MentionExtractor.java`

**Deliverable:**
  - `public final class MentionExtractor { public static Set<Long> extractUserIds(@Nullable String html) {...} }`
  - Regex exactly per spec §5.2: captures TipTap `<span data-type="mention" ... data-id="NNN">` digits as group 3. Case-insensitive. Handles single OR double quotes. Returns `LinkedHashSet<Long>` for deterministic iteration order + dedupe.
  - Never throws on null/blank/malformed input — returns empty set. `NumberFormatException` on `parseLong(group(3))` is caught per-match.
**Validation:** Optional — add a quick JUnit 5 test at `test/java/com/example/pmis/util/MentionExtractorTest.java` with two cases:
  1. Input: `"<span data-type=\"mention\" data-id=\"5\">&nbsp;@Adm.Yang</span> and <span data-type='mention' data-id='7'>@Sam</span>"` → returns `[5,7]`.
  2. Input: `null` / `""` / `"<p>no mentions</p>"` → returns `[]`.
  This test is not required for MVP delivery, but it is 10 lines and catches regex typos before integration. Either way is fine; if skipped, validate by calling extraction manually in Task 5.

## Task 4 — NotificationService business methods
**Files touched:**
  - [NEW] `backend/src/main/java/com/example/pmis/service/NotificationService.java`
  - Imports needed: `UserRepository`, `WikiPageRepository`, `NotificationRepository`, `NotificationDTO`, `MentionExtractor`, `@Service`, `@Transactional`, `@RequiredArgsConstructor`

**Deliverable — public methods (all `@Transactional`, user-scoped):**
1. `List<Notification> notifyWikiMentions(WikiPage savedPage, Set<Long> mentionedUserIds, User actor)` → implements §3.3 dedup + skip-self rules exactly: filter actor, query for existing row by (recipient, WIKI_PAGE, pageId, actor, WIKI_MENTION); update/create accordingly.
2. `Pair<List<NotificationDTO>, Long> listDtosAndUnreadForUser(User user, int limit)` → query `notification` rows by `user.id`, sort `createdAt DESC`, clamp `limit ≤ 50`, **batch-fetch** (one SQL IN) page + user maps, then build `NotificationDTO` per row with edge-case guards (no page / no actor — fallback strings per spec §3.4). Returns pair: (listDTO, unreadCount).
3. `long getUnreadCount(User user)` → `repository.countByUserIdAndReadStatus(user.getId(), false)`.
4. `void markRead(Long notificationId, User user)` → fetch by id; verify `row.getUserId().equals(user.getId())` (ownership: fail with 404-throwing `EntityNotFoundException` if not owner or missing). Set `readStatus = true; save`.
5. `int markAllRead(User user)` → JPQL bulk `UPDATE Notification n SET n.readStatus = true WHERE n.user.id = :uid AND n.readStatus = false`. Returns rows updated count.
**Validation:** Backend compiles; no circular dependency warning at start (if any appear, replace constructor autowire with `@Lazy` on the repo side or split into smaller bean — unlikely since NotificationService has no cycle).

## Task 5 — Wire NotificationService into WikiPageService create + update saves
**Files touched:**
  - [MODIFY] `backend/src/main/java/com/example/pmis/service/WikiPageService.java`

**Deliverable:**
  - Inject `NotificationService` via existing constructor pattern (`@RequiredArgsConstructor` + final field).
  - At the TAIL of `createWikiPage(...)`, immediately AFTER `wikiPageRepository.save(wikiPage)` returns (NOT before save): run `afterSaveProduceMentions(saved, currentUser)` (extract IDs via MentionExtractor → call notifyWikiMentions).
  - Same insertion point in `updateWikiPage(...)`, right after `.save()`.
  - Keep the helper `private void afterSaveProduceMentions(WikiPage saved, User actor)` as a DRY private method.
  - **Critical:** If notification production throws an error, it must NOT fail the page save. Wrap the helper call body in `try { ... } catch (RuntimeException logOnly) { log.warn("Failed to produce mention notifications for page {}: {}", saved.getId(), logOnly.getMessage(), logOnly); }`. Page save is the primary operation — resilience matters.
**Validation:** Backend compiles. A manual test can be performed later (Task 8), but a quick spot-check: start backend, save a page with `@<a user>` via frontend and confirm no HTTP 500 regardless of notification production outcome.

## Task 6 — NotificationController (4 endpoints)
**Files touched:**
  - [NEW] `backend/src/main/java/com/example/pmis/controller/NotificationController.java`
  - Imports: `@RestController`, `@RequestMapping("/api/notifications")`, `@PreAuthorize("isAuthenticated()")` if method-level security, OR rely on JwtAuthenticationFilter global filter. Match existing controller style from e.g. `WikiPageController`.

**Deliverable — exact API per spec §4:**
1. `GET /api/notifications?limit=30` → calls `notificationService.listDtosAndUnreadForUser(currentUser, limit)`. Returns JSON: `{ "items": [...dto], "unreadCount": N }`.
2. `GET /api/notifications/unread-count` → calls `getUnreadCount()`. JSON: `{ "unreadCount": N }`.
3. `PATCH /api/notifications/{id}/read` → calls `markRead(id, currentUser)`. JSON: `{ "ok": true }`.
4. `PATCH /api/notifications/mark-all-read` → calls `markAllRead(currentUser)`. JSON: `{ "ok": true, "updatedCount": count }`.
  - Current user is fetched from SecurityContext, same pattern as other controllers.
  - For mark-read ownership error, existing `GlobalExceptionHandler` (if any) should turn `EntityNotFoundException` into HTTP 404 — no new error handler required unless tests show otherwise.
**Validation:** Backend starts without 404 on these routes; `GET /api/notifications/unread-count` (with valid Bearer token) returns `{ unreadCount: 0 }` for a new user. `curl` + Token from login page works.

## Task 7 — Frontend: notificationApi types + 4 methods
**Files touched:**
  - [MODIFY] `frontend/src/services/api.ts`

**Deliverable:**
  - Export interfaces `NotificationResponse` (6 fields exactly) and `NotificationsListResponse` (`items: NotificationResponse[]`, `unreadCount: number`).
  - Export object `notificationApi { list, unreadCount, markRead, markAllRead }` → each calls `fetchApi(url, opts)` exactly per spec §6.1. Query params for `list(limit=30)`: template string `` `/notifications?limit=${limit}` ``.
**Validation:** Frontend TypeScript project compiles cleanly against these types. `tsc --noEmit` passes.

## Task 8 — Frontend: Header.tsx wiring (drop mocks, real data + 30s poll)
**Files touched:**
  - [MODIFY] `frontend/src/components/Layout/Header.tsx`

**Deliverable — EXACT behavior per spec §6.2 / §6.3 / §6.4. Experience 466464 mitigation: make minimal targeted edits, split complex expressions into separate vars, no global overwrite if avoidable.**

Changes ordered within the file:
  1. **Delete** any local `interface Notification { }` + `const mockNotifications = [...]` mock blocks currently present.
  2. **Imports:** Add `import { notificationApi, NotificationResponse } from '@/services/api';` (or `@services/api` depending on project tsconfig aliases — use the same alias style as other imports in this file).
  3. **State hooks:** Add inside the Header FC:
     - `const [notifications, setNotifications] = useState<NotificationResponse[]>([]);`
     - `const [unreadCount, setUnreadCount] = useState<number>(0);`
     - Do NOT disturb existing state hooks for showNotifications/user/etc.
  4. **Fetch helper:** Define `const fetchList = useCallback(async () => { ... }, [user])` that returns early if user is null, else calls `notificationApi.list()` → `setNotifications(data.items); setUnreadCount(data.unreadCount)`.
  5. **Poll helper:** Define `const pollUnread = useCallback(async () => { ... }, [user])` that calls `notificationApi.unreadCount()` → compare `data.unreadCount !== knownUnread → if ↑ or changed, also run fetchList(); always update setUnreadCount`.
  6. **Mount effect:** `useEffect(() => { if (!user) return; fetchList(); const id = window.setInterval(pollUnread, 30000); return () => window.clearInterval(id); }, [user, fetchList, pollUnread])` — cleanup interval on unmount/user switch.
  7. **Bell-open effect:** `useEffect(() => { if (showNotifications && user) fetchList(); }, [showNotifications, user, fetchList])` — force fresh when user opens dropdown.
  8. **Row click handler:** `async function handleNotificationClick(item: NotificationResponse)`: a) optimistic local (flip item readStatus, decrement unreadCount if >0 via setNotif(prev => prev.map) + setUnread(prev => Math.max(0, prev - 1))); b) fire+forget `notificationApi.markRead(item.id).catch(() => {})`; c) `router.push(item.actionUrl)`.
  9. **"Mark all as read" click handler:** if items.length === 0 disable (or hide). Else: a) optimistic local setNotif(prev → mark all readStatus=true, setUnread(0)); b) fire+forget `notificationApi.markAllRead().catch(() => {})`. Add button to dropdown header right of title.
  10. **Empty state:** when `notifications.length === 0`, render the centered gray text block from spec §6.2 (under scroll list container, keep scroll box height).
  11. **Unread visual cue:** on each item row wrapper, keep existing blue-ish `!item.readStatus` bg, but add `border-l-4 border-blue-500` to the wrapper's className conditionally for stronger scannability.
**Validation:** Header renders without console errors. Open devtools Network filter to `/api/notifications` — see one initial `list`, then `unread-count` every 30s. Bell click triggers immediate `list`. Click row → network `PATCH /.../read` fires + URL navigates. Badge disappears/updates correctly.

## Task 9 — End-to-end verification (manual checklist from spec §8)
**Files touched:** None directly, but startup + user actions.
**Deliverable:**
  - Ensure both servers are running per workspace rules: backend port 8080, frontend port 3000. Restart backend to apply Flyway V15 if V15 hasn't run yet.
  - Execute all 7 items from `check_list.md` against running app. Any item that fails → file-scope fix in the correct task (e.g., if mark-read returns 500, fix Controller + Service), then re-run failing check only.
**Validation:** All 7 items pass. Snapshot of the final working bell dropdown + @mention flow is documented (either in your response or screenshots via the browser tool).
