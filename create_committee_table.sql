-- Create committees table
CREATE TABLE IF NOT EXISTS committees (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    picture_url VARCHAR(500),
    link VARCHAR(500),
    status VARCHAR(20) NOT NULL CHECK (status IN ('Apply', 'Full')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for status for faster queries
CREATE INDEX IF NOT EXISTS idx_committees_status ON committees(status);

-- Create index for created_at for ordering
CREATE INDEX IF NOT EXISTS idx_committees_created_at ON committees(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_committees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_committees_updated_at
    BEFORE UPDATE ON committees
    FOR EACH ROW
    EXECUTE FUNCTION update_committees_updated_at();
