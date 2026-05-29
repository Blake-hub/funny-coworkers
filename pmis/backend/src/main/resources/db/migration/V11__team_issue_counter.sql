CREATE TABLE team_issue_counter (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL UNIQUE,
    next_issue_number INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES team(id)
);

ALTER TABLE issues ADD COLUMN team_issue_number INTEGER;

-- Update existing issues with sequential numbers per team (1, 2, 3, ...)
WITH ranked_issues AS (
    SELECT 
        id,
        team_id,
        ROW_NUMBER() OVER (PARTITION BY team_id ORDER BY created_at ASC) AS issue_num
    FROM issues
    WHERE team_id IS NOT NULL
)
UPDATE issues i
SET team_issue_number = ranked_issues.issue_num
FROM ranked_issues
WHERE i.id = ranked_issues.id;

-- Initialize counters for each team with the next available number
INSERT INTO team_issue_counter (team_id, next_issue_number)
SELECT 
    team_id,
    COALESCE(MAX(team_issue_number), 0) + 1
FROM issues
WHERE team_id IS NOT NULL
GROUP BY team_id
ON CONFLICT (team_id) DO NOTHING;