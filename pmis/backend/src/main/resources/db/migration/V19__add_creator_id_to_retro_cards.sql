-- Add creator_id column to retro_cards to track card authorship.
-- Only the card creator and the board owner can edit/delete a card.
ALTER TABLE retro_cards ADD COLUMN creator_id BIGINT NULL;

-- Backfill existing cards: assign to the board owner as a sensible default.
UPDATE retro_cards c
SET creator_id = (
    SELECT bp.user_id
    FROM retro_board_participants bp
    WHERE bp.board_id = (
        SELECT col.board_id FROM retro_columns col WHERE col.id = c.column_id
    )
    AND bp.role = 'OWNER'
    LIMIT 1
)
WHERE c.creator_id IS NULL;
