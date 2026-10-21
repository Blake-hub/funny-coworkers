-- V24__patent_template_and_setting.sql
-- Patent module enhancements:
--   patent_template  - downloadable disclosure templates (.doc/.docx) maintained by patent admins
--   patent_setting   - singleton settings row (id=1); currently holds the linked
--                      "patent writing guide" wiki page (Plan B-lite)

CREATE TABLE patent_template (
    id BIGSERIAL PRIMARY KEY,
    file_name VARCHAR(500) NOT NULL,
    stored_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(200),
    uploaded_by BIGINT NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES app_user(id)
);

COMMENT ON COLUMN patent_template.stored_path IS 'Path relative to the patent upload root (uploads/patents).';

CREATE INDEX idx_patent_template_uploaded_by ON patent_template(uploaded_by);

CREATE TABLE patent_setting (
    id BIGSERIAL PRIMARY KEY,
    guide_page_id BIGINT
);

COMMENT ON TABLE patent_setting IS 'Singleton row (id=1) holding patent module settings.';
COMMENT ON COLUMN patent_setting.guide_page_id IS 'Linked wiki page used as the controlled patent writing guide; NULL when unset.';

INSERT INTO patent_setting (id, guide_page_id) VALUES (1, NULL);
