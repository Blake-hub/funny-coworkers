-- Drop the legacy "issue" table left over from the V1 schema.
-- The active issue model has used the "issues" table since V4; the old table
-- is empty and has no JPA entity mapped to it.
-- Several tables still hold foreign keys pointing at it, so those constraints
-- must be dropped first. The referencing tables (issue_comment, issue_change_log,
-- issue_attachment, issue_label_assignments) are all empty and their entities
-- (where present) store issue_id as a plain column without an association,
-- therefore the constraints are simply removed rather than redirected.

ALTER TABLE issue_comment DROP CONSTRAINT IF EXISTS fk_comment_issue;
ALTER TABLE issue_change_log DROP CONSTRAINT IF EXISTS fk_log_issue;
ALTER TABLE issue_attachment DROP CONSTRAINT IF EXISTS fk_attachment_issue;
ALTER TABLE issue_label_assignments DROP CONSTRAINT IF EXISTS issue_label_assignments_issue_id_fkey;
ALTER TABLE issue DROP CONSTRAINT IF EXISTS fk_issue_parent;

DROP TABLE IF EXISTS issue;
