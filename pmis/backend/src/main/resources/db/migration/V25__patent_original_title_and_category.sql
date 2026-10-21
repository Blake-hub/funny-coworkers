-- V25__patent_original_title_and_category.sql
-- Plan B: keep the applicant's original draft title visible alongside the
-- agency-adjusted current title, with a system comment trail on edits.
-- Also adds the statutory patent category (发明 / 实用新型 / 外观设计),
-- defaulting to INVENTION for all existing rows.

ALTER TABLE patent_application ADD COLUMN original_title VARCHAR(500);
ALTER TABLE patent_application ADD COLUMN patent_category VARCHAR(30);

-- Backfill: every existing row gets its current title as the original title.
UPDATE patent_application SET original_title = title, patent_category = 'INVENTION';

ALTER TABLE patent_application ALTER COLUMN original_title SET NOT NULL;
ALTER TABLE patent_application ALTER COLUMN patent_category SET NOT NULL;
