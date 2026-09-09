-- V18__create_retro_tables.sql
-- Retrospective feature: boards, participants, columns, cards, card votes

CREATE TABLE retro_boards (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id BIGINT NOT NULL,
    team_id BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES app_user(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES team(id) ON DELETE SET NULL
);

CREATE INDEX idx_retro_boards_owner ON retro_boards(owner_id);
CREATE INDEX idx_retro_boards_team ON retro_boards(team_id);

CREATE TABLE retro_board_participants (
    id BIGSERIAL PRIMARY KEY,
    board_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES retro_boards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    UNIQUE (board_id, user_id)
);

CREATE INDEX idx_retro_participants_board ON retro_board_participants(board_id);
CREATE INDEX idx_retro_participants_user ON retro_board_participants(user_id);

CREATE TABLE retro_columns (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    board_id BIGINT NOT NULL,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES retro_boards(id) ON DELETE CASCADE
);

CREATE INDEX idx_retro_columns_board_pos ON retro_columns(board_id, position);

CREATE TABLE retro_cards (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    column_id BIGINT NOT NULL,
    position INT NOT NULL DEFAULT 0,
    votes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (column_id) REFERENCES retro_columns(id) ON DELETE CASCADE
);

CREATE INDEX idx_retro_cards_column_pos ON retro_cards(column_id, position);

CREATE TABLE retro_card_votes (
    id BIGSERIAL PRIMARY KEY,
    card_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES retro_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    UNIQUE (card_id, user_id)
);

CREATE INDEX idx_retro_card_votes_card ON retro_card_votes(card_id);
CREATE INDEX idx_retro_card_votes_user ON retro_card_votes(user_id);
