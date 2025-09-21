-- Codebyters Registration Database Schema
-- This SQL script creates the users table for the registration system (Supabase/PostgreSQL compatible)

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    middle_initial VARCHAR(1),
    student_id VARCHAR(9) UNIQUE NOT NULL, -- Format: 0000-0000
    year VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Will store hashed password
    profile_picture VARCHAR(500), -- Cloudinary URL
    cover_photo VARCHAR(500), -- Cloudinary URL for cover photo
    role INTEGER DEFAULT 2, -- 0=admin, 1=instructor, 2=student
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_student_id ON users(student_id);
CREATE INDEX idx_role ON users(role);
CREATE INDEX idx_is_active ON users(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample admin user (optional)
-- Password should be hashed in production
INSERT INTO users (first_name, last_name, student_id, year, email, password, role) 
VALUES ('Admin', 'User', '0000-0000', 'Graduate', 'admin@codebyters.com', 'hashed_password_here', 0);

-- Insert sample instructor (optional)
INSERT INTO users (first_name, last_name, student_id, year, email, password, role) 
VALUES ('John', 'Doe', '0001-0000', 'Graduate', 'instructor@codebyters.com', 'hashed_password_here', 1);

-- Sample student registration
INSERT INTO users (first_name, last_name, middle_initial, student_id, year, email, password, role) 
VALUES ('Jane', 'Smith', 'A', '2024-0001', '1st Year', 'jane.smith@student.com', 'hashed_password_here', 2);

-- Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Event pictures table (for Cloudinary URLs)
CREATE TABLE event_pictures (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    picture_url VARCHAR(500) NOT NULL, -- Cloudinary URL
    picture_order INTEGER DEFAULT 1, -- Order of pictures (1-8)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, picture_order)
);

-- Create indexes for better performance
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_event_pictures_event_id ON event_pictures(event_id);
CREATE INDEX idx_event_pictures_order ON event_pictures(picture_order);

-- Create function to update updated_at timestamp for events
CREATE OR REPLACE FUNCTION update_events_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for events
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_events_updated_at_column();

-- Sample events
INSERT INTO events (title, description, event_date, status, created_by) 
VALUES 
('Coding Workshop', 'Learn the fundamentals of web development with hands-on projects', '2024-02-15 14:00:00+00', 'active', 1),
('Hackathon 2024', '24-hour coding competition with prizes', '2024-03-01 09:00:00+00', 'active', 1),
('Tech Talk: AI & Machine Learning', 'Guest speaker discussing the future of AI', '2024-02-20 16:00:00+00', 'inactive', 1);

-- Sample event pictures (Cloudinary URLs)
INSERT INTO event_pictures (event_id, picture_url, picture_order) 
VALUES 
(1, 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/workshop1.jpg', 1),
(1, 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/workshop2.jpg', 2),
(2, 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/hackathon1.jpg', 1),
(2, 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/hackathon2.jpg', 2),
(2, 'https://res.cloudinary.com/your-cloud/image/upload/v1234567890/hackathon3.jpg', 3);
