CREATE TABLE IF NOT EXISTS team (
    id BIGSERIAL PRIMARY KEY,
    identifier VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    member_count INTEGER NOT NULL,
    lead_name VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS project (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) NOT NULL,
    leader_id BIGINT
);

CREATE TABLE IF NOT EXISTS app_user (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    team_id BIGINT,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS issue (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    due_date DATE,
    assignee_id BIGINT,
    project_id BIGINT,
    parent_id BIGINT,
    root_id BIGINT,
    labels JSON,
    story_points INTEGER,
    severity VARCHAR(50),
    acceptance_criteria VARCHAR(1000)
);

CREATE TABLE IF NOT EXISTS issue_comment (
    id BIGSERIAL PRIMARY KEY,
    issue_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content VARCHAR(1000) NOT NULL,
    mentions JSON,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS issue_change_log (
    id BIGSERIAL PRIMARY KEY,
    issue_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    field_changed VARCHAR(50) NOT NULL,
    old_value VARCHAR(255),
    new_value VARCHAR(255),
    timestamp TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS issue_attachment (
    id BIGSERIAL PRIMARY KEY,
    issue_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    uploaded_by BIGINT NOT NULL,
    uploaded_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS wiki_page (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    parent_page_id BIGINT,
    last_modified_by BIGINT,
    last_modified_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS notification (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    target_id BIGINT,
    target_type VARCHAR(50),
    read_status BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL
);

-- Add foreign key constraints
ALTER TABLE app_user ADD CONSTRAINT fk_user_team FOREIGN KEY (team_id) REFERENCES team(id);
ALTER TABLE project ADD CONSTRAINT fk_project_leader FOREIGN KEY (leader_id) REFERENCES app_user(id);
ALTER TABLE issue ADD CONSTRAINT fk_issue_assignee FOREIGN KEY (assignee_id) REFERENCES app_user(id);
ALTER TABLE issue ADD CONSTRAINT fk_issue_project FOREIGN KEY (project_id) REFERENCES project(id);
ALTER TABLE issue ADD CONSTRAINT fk_issue_parent FOREIGN KEY (parent_id) REFERENCES issue(id);
ALTER TABLE issue_comment ADD CONSTRAINT fk_comment_issue FOREIGN KEY (issue_id) REFERENCES issue(id);
ALTER TABLE issue_comment ADD CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES app_user(id);
ALTER TABLE issue_change_log ADD CONSTRAINT fk_log_issue FOREIGN KEY (issue_id) REFERENCES issue(id);
ALTER TABLE issue_change_log ADD CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES app_user(id);
ALTER TABLE issue_attachment ADD CONSTRAINT fk_attachment_issue FOREIGN KEY (issue_id) REFERENCES issue(id);
ALTER TABLE issue_attachment ADD CONSTRAINT fk_attachment_user FOREIGN KEY (uploaded_by) REFERENCES app_user(id);
ALTER TABLE wiki_page ADD CONSTRAINT fk_wiki_parent FOREIGN KEY (parent_page_id) REFERENCES wiki_page(id);
ALTER TABLE wiki_page ADD CONSTRAINT fk_wiki_author FOREIGN KEY (last_modified_by) REFERENCES app_user(id);
ALTER TABLE notification ADD CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES app_user(id);

-- Insert initial data
INSERT INTO team (identifier, name, description, member_count, lead_name) VALUES
('ENG', 'Engineering Team', 'Core development team', 12, 'Mike Johnson'),
('QA', 'QA Team', 'Quality assurance team', 5, 'Lisa Anderson'),
('PROD', 'Product Team', 'Product management team', 4, 'Emily Davis');

INSERT INTO app_user (email, name, role, team_id, password) VALUES
('admin@pmis.com', 'John Doe', 'Project Manager', 1, '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjzqAKL9xL5jvMFVdNJHvGCgTq/VEq'),
('mike.johnson@pmis.com', 'Mike Johnson', 'Team Lead', 1, '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjzqAKL9xL5jvMFVdNJHvGCgTq/VEq'),
('lisa.anderson@pmis.com', 'Lisa Anderson', 'Team Lead', 2, '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjzqAKL9xL5jvMFVdNJHvGCgTq/VEq'),
('emily.davis@pmis.com', 'Emily Davis', 'Team Lead', 3, '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjzqAKL9xL5jvMFVdNJHvGCgTq/VEq');

INSERT INTO project (name, description, start_date, end_date, status, leader_id) VALUES
('Website Redesign', 'Redesign the company website', '2024-01-01', '2024-06-30', 'in_progress', 1),
('Mobile App Development', 'Develop native mobile applications', '2024-02-01', '2024-12-31', 'in_progress', 2),
('API Gateway', 'Build RESTful API gateway', '2024-01-15', '2024-05-30', 'completed', 1);