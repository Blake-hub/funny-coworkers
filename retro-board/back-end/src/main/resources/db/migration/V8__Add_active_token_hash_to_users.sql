-- Add active_token_hash column to users table
ALTER TABLE users
ADD COLUMN active_token_hash VARCHAR(255);

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_active_token_hash
ON users(active_token_hash);
