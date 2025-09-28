-- Posts table for admin announcements and general posts
-- Similar to events but without event_date field

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content TEXT, -- Main content of the post
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Post pictures table (for Cloudinary URLs)
CREATE TABLE post_pictures (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    picture_url VARCHAR(500) NOT NULL, -- Cloudinary URL
    picture_order INTEGER DEFAULT 1, -- Order of pictures (1-8)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, picture_order)
);

-- Create indexes for better performance
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_by ON posts(created_by);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_post_pictures_post_id ON post_pictures(post_id);
CREATE INDEX idx_post_pictures_order ON post_pictures(picture_order);

-- Create function to update updated_at timestamp for posts
CREATE OR REPLACE FUNCTION update_posts_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for posts
CREATE TRIGGER update_posts_updated_at 
    BEFORE UPDATE ON posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_posts_updated_at_column();

-- Sample posts
INSERT INTO posts (title, description, content, status, created_by) 
VALUES 
('Welcome to Codebyters!', 'Welcome message for new members', 'Welcome to the Codebyters community! We are excited to have you join our programming community. Here you will find resources, events, and opportunities to grow as a developer.', 'active', 1),
('Upcoming Programming Workshop', 'Information about our next workshop', 'Join us for an exciting programming workshop where we will cover modern web development techniques, including React, Node.js, and database management. This workshop is perfect for both beginners and intermediate developers.', 'active', 1),
('Community Guidelines', 'Important guidelines for all members', 'Please read and follow our community guidelines to ensure a positive and productive environment for everyone. We encourage respectful communication and collaborative learning.', 'active', 1);

-- Sample post pictures (Cloudinary URLs)
INSERT INTO post_pictures (post_id, picture_url, picture_order) 
VALUES 
(1, 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/welcome1.jpg', 1),
(1, 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/welcome2.jpg', 2),
(2, 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/workshop1.jpg', 1),
(2, 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/workshop2.jpg', 2);
