-- V13__wiki_comment_table.sql
-- Add wiki_comment table for document comments

CREATE TABLE wiki_comment (
    id BIGSERIAL PRIMARY KEY,
    wiki_page_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE wiki_comment ADD CONSTRAINT fk_wiki_comment_page
    FOREIGN KEY (wiki_page_id) REFERENCES wiki_page(id) ON DELETE CASCADE;

ALTER TABLE wiki_comment ADD CONSTRAINT fk_wiki_comment_user
    FOREIGN KEY (user_id) REFERENCES app_user(id);

CREATE INDEX idx_wiki_comment_page_id ON wiki_comment(wiki_page_id);
CREATE INDEX idx_wiki_comment_user_id ON wiki_comment(user_id);