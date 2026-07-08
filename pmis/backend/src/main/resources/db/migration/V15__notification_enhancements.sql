-- V15__notification_enhancements.sql
-- Notification pipeline enhancements: add actor_user_id + 2 indices.
-- (Phase: Notification MVP (wiki mentions only) — add actor column to know who @mentioned the recipient.

ALTER TABLE IF EXISTS notification
    ADD COLUMN IF NOT EXISTS actor_user_id BIGINT NULL;

COMMENT ON COLUMN notification.actor_user_id
    IS 'User who triggered this notification (e.g. the user who saved a page containing a @mention). NULL for system-generated notifications.';

CREATE INDEX IF NOT EXISTS idx_notification_user_read
    ON notification(user_id, read_status);

CREATE INDEX IF NOT EXISTS idx_notification_recipient_target_actor
    ON notification(user_id, target_type, target_id, actor_user_id);
