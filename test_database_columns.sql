-- Test script to check if cover_photo column exists in users table
-- Run this in your Supabase SQL editor to verify

-- Check all columns in users table
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Specifically check for cover_photo and profile_picture columns
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('profile_picture', 'cover_photo')
ORDER BY column_name;
