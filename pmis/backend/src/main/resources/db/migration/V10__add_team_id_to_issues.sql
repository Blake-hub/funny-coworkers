ALTER TABLE issues ADD COLUMN team_id BIGINT;

ALTER TABLE issues ADD CONSTRAINT fk_issues_team FOREIGN KEY (team_id) REFERENCES team(id);

CREATE INDEX idx_issues_team_id ON issues(team_id);
