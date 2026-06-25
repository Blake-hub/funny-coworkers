-- V12__wiki_page_updates.sql
-- Wiki page schema updates for Phase 1: Basic CRUD + JSON/HTML Storage

-- Rename existing content column to content_html
ALTER TABLE wiki_page RENAME COLUMN content TO content_html;

-- Add new columns to wiki_page table
ALTER TABLE wiki_page ADD COLUMN content_json TEXT;
ALTER TABLE wiki_page ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE wiki_page ADD COLUMN team_id BIGINT;
ALTER TABLE wiki_page ADD COLUMN created_by BIGINT;

-- Add foreign key for team_id (nullable for Phase 1)
ALTER TABLE wiki_page ADD CONSTRAINT fk_wiki_team
  FOREIGN KEY (team_id) REFERENCES team(id);

-- Add foreign key for created_by
ALTER TABLE wiki_page ADD CONSTRAINT fk_wiki_created_by
  FOREIGN KEY (created_by) REFERENCES app_user(id);

-- Add foreign key for last_modified_by
ALTER TABLE wiki_page ADD CONSTRAINT fk_wiki_last_modified_by
  FOREIGN KEY (last_modified_by) REFERENCES app_user(id);

-- Create table to track uploaded wiki images
CREATE TABLE wiki_image (
    id BIGSERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    uploaded_by BIGINT REFERENCES app_user(id)
);

-- Create index for faster queries
CREATE INDEX idx_wiki_page_team_id ON wiki_page(team_id);
CREATE INDEX idx_wiki_page_created_by ON wiki_page(created_by);
CREATE INDEX idx_wiki_page_is_published ON wiki_page(is_published);
