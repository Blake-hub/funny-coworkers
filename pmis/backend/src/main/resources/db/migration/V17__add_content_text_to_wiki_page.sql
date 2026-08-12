-- V17__add_content_text_to_wiki_page.sql
-- Add content_text column for search indexing (plain text extracted from content_html)

ALTER TABLE wiki_page ADD COLUMN IF NOT EXISTS content_text TEXT;

-- Backfill existing records by stripping HTML tags and normalizing whitespace
UPDATE wiki_page
SET content_text = COALESCE(
    NULLIF(
        regexp_replace(
            regexp_replace(COALESCE(content_html, ''), '<[^>]+>', ' ', 'g'),
            '\s+', ' ', 'g'
        ),
        ''
    ),
    ''
);
