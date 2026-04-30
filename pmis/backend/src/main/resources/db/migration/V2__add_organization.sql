CREATE TABLE IF NOT EXISTS organization (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS department (
    id BIGSERIAL PRIMARY KEY,
    organization_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    parent_department_id BIGINT,
    lead_user_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE app_user ADD COLUMN IF NOT EXISTS organization_id BIGINT;
ALTER TABLE app_user ADD COLUMN IF NOT EXISTS department_id BIGINT;

ALTER TABLE department ADD CONSTRAINT fk_department_org FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE department ADD CONSTRAINT fk_department_parent FOREIGN KEY (parent_department_id) REFERENCES department(id);
ALTER TABLE department ADD CONSTRAINT fk_department_lead FOREIGN KEY (lead_user_id) REFERENCES app_user(id);
ALTER TABLE app_user ADD CONSTRAINT fk_user_org FOREIGN KEY (organization_id) REFERENCES organization(id);
ALTER TABLE app_user ADD CONSTRAINT fk_user_dept FOREIGN KEY (department_id) REFERENCES department(id);

INSERT INTO organization (name, description, website) VALUES
('PMIS Corp', 'Project Management Information System', 'https://pmis.example.com');

INSERT INTO department (organization_id, name, description, parent_department_id) VALUES
(1, 'Engineering', 'Core engineering department', NULL),
(1, 'Product', 'Product management department', NULL),
(1, 'Human Resources', 'HR department', NULL);

INSERT INTO department (organization_id, name, description, parent_department_id) VALUES
(1, 'Frontend', 'Frontend development team', 1),
(1, 'Backend', 'Backend development team', 1),
(1, 'DevOps', 'DevOps team', 1);