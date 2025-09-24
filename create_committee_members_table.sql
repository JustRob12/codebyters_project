-- Create committee_members table
CREATE TABLE IF NOT EXISTS committee_members (
    id SERIAL PRIMARY KEY,
    committee_id INTEGER NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL,
    student_name VARCHAR(255),
    student_email VARCHAR(255),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Removed')),
    role VARCHAR(50) DEFAULT 'Member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint to prevent duplicate memberships
CREATE UNIQUE INDEX IF NOT EXISTS idx_committee_members_unique 
ON committee_members(committee_id, student_id) 
WHERE status = 'Active';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_committee_members_committee_id ON committee_members(committee_id);
CREATE INDEX IF NOT EXISTS idx_committee_members_student_id ON committee_members(student_id);
CREATE INDEX IF NOT EXISTS idx_committee_members_status ON committee_members(status);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_committee_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_committee_members_updated_at
    BEFORE UPDATE ON committee_members
    FOR EACH ROW
    EXECUTE FUNCTION update_committee_members_updated_at();

-- Create a view for committee member details
CREATE OR REPLACE VIEW committee_member_details AS
SELECT 
    cm.id,
    cm.committee_id,
    c.title as committee_title,
    cm.student_id,
    cm.student_name,
    cm.student_email,
    cm.joined_at,
    cm.status,
    cm.role,
    cm.created_at,
    cm.updated_at
FROM committee_members cm
JOIN committees c ON cm.committee_id = c.id;
