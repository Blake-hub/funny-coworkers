-- V23__create_patent_tables.sql
-- Patent management module (Phase 1 MVP):
--   patent_admin (module-level patent admins granted by global ADMIN)
--   patent_application (main table with per-stage date columns)
--   patent_status_history (append-only; undo marks rows undone)
--   patent_attachment (disclosure / notices / other; undo hides, never deletes)
--   patent_comment (system-generated records + manual comments)

CREATE TABLE patent_admin (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    granted_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES app_user(id) ON DELETE CASCADE,
    UNIQUE (user_id)
);

CREATE TABLE patent_application (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    application_type VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    inventors TEXT NOT NULL,
    application_number VARCHAR(100),
    certificate_number VARCHAR(100),
    project_id BIGINT,
    creator_id BIGINT NOT NULL,
    submit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    received_date DATE,
    paid_date DATE,
    accepted_date DATE,
    preliminary_passed_date DATE,
    published_date DATE,
    priority_granted_date DATE,
    substantive_exam_date DATE,
    oa_notification_date DATE,
    grant_fee_paid_date DATE,
    granted_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES app_user(id)
);

COMMENT ON COLUMN patent_application.inventors IS 'JSON string array of inventor names, e.g. ["Alice","Bob"]; at least 1 entry.';
COMMENT ON COLUMN patent_application.project_id IS 'Phase 2 placeholder: linked PMIS project; no FK for now.';

CREATE INDEX idx_patent_app_creator ON patent_application(creator_id);
CREATE INDEX idx_patent_app_status ON patent_application(status);

CREATE TABLE patent_status_history (
    id BIGSERIAL PRIMARY KEY,
    patent_id BIGINT NOT NULL,
    from_status VARCHAR(30) NOT NULL,
    to_status VARCHAR(30) NOT NULL,
    event_date DATE NOT NULL,
    operator_id BIGINT NOT NULL,
    application_number VARCHAR(100),
    certificate_number VARCHAR(100),
    application_type VARCHAR(20),
    undone BOOLEAN NOT NULL DEFAULT FALSE,
    undone_at TIMESTAMP,
    undone_by BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patent_id) REFERENCES patent_application(id) ON DELETE CASCADE,
    FOREIGN KEY (operator_id) REFERENCES app_user(id)
);

COMMENT ON COLUMN patent_status_history.application_number IS 'Snapshot of the application number set by this transition; used for precise undo.';
COMMENT ON COLUMN patent_status_history.certificate_number IS 'Snapshot of the certificate number set by this transition; used for precise undo.';
COMMENT ON COLUMN patent_status_history.application_type IS 'Snapshot of the application type confirmed at transition to PAID; used for precise undo.';

CREATE INDEX idx_patent_history_patent ON patent_status_history(patent_id, created_at);

CREATE TABLE patent_attachment (
    id BIGSERIAL PRIMARY KEY,
    patent_id BIGINT NOT NULL,
    history_id BIGINT,
    category VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    content_type VARCHAR(100),
    uploaded_by BIGINT NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (patent_id) REFERENCES patent_application(id) ON DELETE CASCADE,
    FOREIGN KEY (history_id) REFERENCES patent_status_history(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES app_user(id)
);

COMMENT ON COLUMN patent_attachment.category IS 'DISCLOSURE (restricted to creator + patent admins) / NOTICE / OTHER.';
COMMENT ON COLUMN patent_attachment.history_id IS 'Non-null when uploaded as part of a status transition; used to hide attachments on undo.';
COMMENT ON COLUMN patent_attachment.hidden IS 'Set to true on undo; the file itself is kept on disk.';

CREATE INDEX idx_patent_attachment_patent ON patent_attachment(patent_id);

CREATE TABLE patent_comment (
    id BIGSERIAL PRIMARY KEY,
    patent_id BIGINT NOT NULL,
    author_id BIGINT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patent_id) REFERENCES patent_application(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES app_user(id)
);

COMMENT ON COLUMN patent_comment.author_id IS 'NULL for system-generated records.';
