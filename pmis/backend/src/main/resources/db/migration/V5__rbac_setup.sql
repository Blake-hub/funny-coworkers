INSERT INTO app_user (email, name, role, team_id, password) VALUES
('admin@example.com', 'Admin', 'ADMIN', NULL, '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjzqAKL9xL5jvMFVdNJHvGCgTq/VEq')
ON CONFLICT (email) DO NOTHING;

ALTER TABLE team ADD COLUMN owner_id BIGINT;

UPDATE team SET owner_id = (SELECT id FROM app_user WHERE role = 'ADMIN' LIMIT 1);

UPDATE team SET owner_id = (SELECT id FROM app_user WHERE email = 'mike.johnson@pmis.com') WHERE identifier = 'ENG';
UPDATE team SET owner_id = (SELECT id FROM app_user WHERE email = 'lisa.anderson@pmis.com') WHERE identifier = 'QA';
UPDATE team SET owner_id = (SELECT id FROM app_user WHERE email = 'emily.davis@pmis.com') WHERE identifier = 'PROD';

ALTER TABLE team ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE team ADD CONSTRAINT fk_team_owner FOREIGN KEY (owner_id) REFERENCES app_user(id);

ALTER TABLE projects ADD COLUMN team_id BIGINT;
UPDATE projects SET team_id = (SELECT id FROM team WHERE identifier = 'ENG' LIMIT 1);
UPDATE projects SET team_id = (SELECT id FROM team LIMIT 1) WHERE team_id IS NULL;
ALTER TABLE projects ALTER COLUMN team_id SET NOT NULL;
ALTER TABLE projects ADD CONSTRAINT fk_project_team FOREIGN KEY (team_id) REFERENCES team(id);

CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id BIGINT,
    details TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE audit_log ADD CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES app_user(id);