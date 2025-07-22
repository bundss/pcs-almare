-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    club_member BOOLEAN DEFAULT FALSE,
    club_join_date DATE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create PCS entries table
CREATE TABLE IF NOT EXISTS pcs_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('fundamental', 'important', 'care')),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patient comments table
CREATE TABLE IF NOT EXISTS patient_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom fields table for dynamic PCS fields
CREATE TABLE IF NOT EXISTS pcs_custom_fields (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(20) NOT NULL CHECK (field_type IN ('text', 'dropdown', 'checkbox', 'number', 'date')),
    field_options JSONB, -- For dropdown options
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create entry field values table
CREATE TABLE IF NOT EXISTS pcs_entry_field_values (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entry_id UUID REFERENCES pcs_entries(id) ON DELETE CASCADE,
    field_id UUID REFERENCES pcs_custom_fields(id) ON DELETE CASCADE,
    field_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(entry_id, field_id)
);

-- Create patient relationships table (for family connections)
CREATE TABLE IF NOT EXISTS patient_relationships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    related_patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- 'parent', 'child', 'spouse', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, related_patient_id, relationship_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_club_member ON patients(club_member);
CREATE INDEX IF NOT EXISTS idx_patients_last_updated ON patients(last_updated);
CREATE INDEX IF NOT EXISTS idx_pcs_entries_patient_id ON pcs_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_pcs_entries_category ON pcs_entries(category);
CREATE INDEX IF NOT EXISTS idx_patient_comments_patient_id ON patient_comments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_relationships_patient_id ON patient_relationships(patient_id);

-- Create function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for pcs_entries
CREATE TRIGGER update_pcs_entries_updated_at 
    BEFORE UPDATE ON pcs_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_last_updated_column();

-- Create function to update patient's last_updated when PCS entries change
CREATE OR REPLACE FUNCTION update_patient_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE patients 
    SET last_updated = NOW() 
    WHERE id = COALESCE(NEW.patient_id, OLD.patient_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers for patient last_updated
CREATE TRIGGER update_patient_on_pcs_entry_change
    AFTER INSERT OR UPDATE OR DELETE ON pcs_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_last_updated();

CREATE TRIGGER update_patient_on_comment_change
    AFTER INSERT OR UPDATE OR DELETE ON patient_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_last_updated();
