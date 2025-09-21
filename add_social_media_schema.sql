-- Add social media links table for user profiles
-- Run this in your Supabase SQL editor

-- Create social_media_links table
CREATE TABLE IF NOT EXISTS social_media_links (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- e.g., 'twitter', 'instagram', 'linkedin', 'github', 'facebook', 'youtube', 'tiktok'
    username VARCHAR(100) NOT NULL, -- e.g., '@username' or 'username'
    url VARCHAR(500) NOT NULL, -- Full URL to the profile
    display_order INTEGER DEFAULT 1, -- Order of display (1, 2, 3, etc.)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_media_user_id ON social_media_links(user_id);
CREATE INDEX IF NOT EXISTS idx_social_media_platform ON social_media_links(platform);
CREATE INDEX IF NOT EXISTS idx_social_media_active ON social_media_links(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_social_media_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_social_media_updated_at 
    BEFORE UPDATE ON social_media_links 
    FOR EACH ROW 
    EXECUTE FUNCTION update_social_media_updated_at_column();

-- Add constraint to ensure unique platform per user
ALTER TABLE social_media_links 
ADD CONSTRAINT unique_user_platform 
UNIQUE (user_id, platform);

-- Sample data (optional - remove if not needed)
-- INSERT INTO social_media_links (user_id, platform, username, url, display_order) 
-- VALUES 
-- (1, 'github', 'johndoe', 'https://github.com/johndoe', 1),
-- (1, 'linkedin', 'john-doe', 'https://linkedin.com/in/john-doe', 2),
-- (1, 'twitter', 'johndoe_dev', 'https://twitter.com/johndoe_dev', 3);

-- Verify the table was created
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'social_media_links' 
ORDER BY ordinal_position;
