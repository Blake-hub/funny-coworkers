-- V14__wiki_folder.sql
-- Wiki folder table for Phase 3: Folder Structure + Permissions

CREATE TABLE wiki_folder (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    parent_folder_id BIGINT,
    visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
    team_id BIGINT,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

ALTER TABLE wiki_folder ADD CONSTRAINT fk_wiki_folder_team
    FOREIGN KEY (team_id) REFERENCES team(id);

ALTER TABLE wiki_folder ADD CONSTRAINT fk_wiki_folder_created_by
    FOREIGN KEY (created_by) REFERENCES app_user(id);

ALTER TABLE wiki_folder ADD CONSTRAINT fk_wiki_folder_parent
    FOREIGN KEY (parent_folder_id) REFERENCES wiki_folder(id) ON DELETE CASCADE;

CREATE INDEX idx_wiki_folder_parent_folder_id ON wiki_folder(parent_folder_id);
CREATE INDEX idx_wiki_folder_team_id ON wiki_folder(team_id);
CREATE INDEX idx_wiki_folder_created_by ON wiki_folder(created_by);

ALTER TABLE wiki_page ADD COLUMN folder_id BIGINT REFERENCES wiki_folder(id);

CREATE INDEX idx_wiki_page_folder_id ON wiki_page(folder_id);
