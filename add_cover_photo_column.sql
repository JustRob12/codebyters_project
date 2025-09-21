-- Add cover_photo column to users table if it doesn't exist
-- Run this in your Supabase SQL editor

-- Check if the column exists, if not add it
DO $$ 
BEGIN
    -- Check if cover_photo column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'cover_photo'
    ) THEN
        -- Add the cover_photo column
        ALTER TABLE users ADD COLUMN cover_photo VARCHAR(500);
        
        -- Add a comment to the column
        COMMENT ON COLUMN users.cover_photo IS 'Cloudinary URL for cover photo';
        
        RAISE NOTICE 'cover_photo column added successfully';
    ELSE
        RAISE NOTICE 'cover_photo column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('profile_picture', 'cover_photo')
ORDER BY column_name;
