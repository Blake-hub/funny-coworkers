-- Issue Status Definitions table
CREATE TABLE issue_status_definitions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20),
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Issues table
CREATE TABLE issues (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status_id INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    assignee_id BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    reporter_id BIGINT REFERENCES app_user(id) ON DELETE SET NULL,
    priority_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_issues_project_id ON issues(project_id);
CREATE INDEX idx_issues_status_id ON issues(status_id);
CREATE INDEX idx_issues_assignee_id ON issues(assignee_id);
CREATE INDEX idx_issues_sort_order ON issues(status_id, sort_order);

-- Insert default issue statuses
INSERT INTO issue_status_definitions (name, color, display_order) VALUES
('Backlog', '#808080', 3),
('Todo', '#FFA500', 2),
('In Progress', '#007BFF', 1),
('Done', '#28A745', 4),
('Canceled', '#DC3545', 5),
('Duplicated', '#6C757D', 6);