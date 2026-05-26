CREATE TABLE team_members (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES team(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    UNIQUE (team_id, user_id)
);

INSERT INTO team_members (team_id, user_id, role, joined_at)
SELECT 
    t.id AS team_id,
    u.id AS user_id,
    CASE 
        WHEN t.owner_id = u.id THEN 'TEAM_OWNER' 
        ELSE 'TEAM_MEMBER' 
    END AS role,
    CURRENT_TIMESTAMP AS joined_at
FROM team t
JOIN app_user u ON u.team_id = t.id
WHERE u.team_id IS NOT NULL;

ALTER TABLE app_user DROP COLUMN IF EXISTS team_id;