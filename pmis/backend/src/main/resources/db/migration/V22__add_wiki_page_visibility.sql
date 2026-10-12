-- Document-level visibility for wiki pages.
-- Pages can now carry their own visibility which overrides the folder default.
-- NULL keeps the legacy behavior: derive visibility from the owning folder.
ALTER TABLE wiki_page
    ADD COLUMN visibility VARCHAR(20);

-- Backfill pages with no folder to match their de-facto access level so no
-- document silently disappears after this change: pages without a folder and
-- without a team were readable by everyone (PUBLIC), team pages are TEAM.
UPDATE wiki_page
SET visibility = CASE WHEN team_id IS NOT NULL THEN 'TEAM' ELSE 'PUBLIC' END
WHERE folder_id IS NULL;
