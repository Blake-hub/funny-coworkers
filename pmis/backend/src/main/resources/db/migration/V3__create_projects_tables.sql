-- Drop old project table if exists (will be recreated with new schema)
DROP TABLE IF EXISTS project CASCADE;

-- Create new projects table with enhanced schema
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    summary VARCHAR(500),
    description TEXT,
    status INT NOT NULL DEFAULT 1,
    priority INT NOT NULL DEFAULT 0,
    leader_id BIGINT NOT NULL,
    start_date DATE,
    end_date DATE,
    progress INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leader_id) REFERENCES app_user(id) ON DELETE CASCADE
);

-- Create milestones table
CREATE TABLE milestones (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create project_members table
CREATE TABLE project_members (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(50),
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    UNIQUE(project_id, user_id)
);

-- Create label_definitions table
CREATE TABLE label_definitions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL DEFAULT '#6b7280',
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create project_label_assignments table
CREATE TABLE project_label_assignments (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL,
    label_id BIGINT NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES label_definitions(id) ON DELETE CASCADE,
    UNIQUE(project_id, label_id)
);

-- Create issue_label_assignments table
CREATE TABLE issue_label_assignments (
    id BIGSERIAL PRIMARY KEY,
    issue_id BIGINT NOT NULL,
    label_id BIGINT NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issue_id) REFERENCES issue(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES label_definitions(id) ON DELETE CASCADE,
    UNIQUE(issue_id, label_id)
);

-- Create indexes
CREATE INDEX idx_projects_leader_id ON projects(leader_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_milestones_project_id ON milestones(project_id);
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_label_assignments_project_id ON project_label_assignments(project_id);
CREATE INDEX idx_project_label_assignments_label_id ON project_label_assignments(label_id);
CREATE INDEX idx_issue_label_assignments_issue_id ON issue_label_assignments(issue_id);
CREATE INDEX idx_issue_label_assignments_label_id ON issue_label_assignments(label_id);