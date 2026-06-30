-- Add createdBy foreign key to cards table
ALTER TABLE IF EXISTS cards
ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Index for faster ownership lookups
CREATE INDEX IF NOT EXISTS idx_cards_user_id
ON cards(user_id);
