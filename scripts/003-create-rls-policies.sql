-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcs_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcs_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcs_entry_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_relationships ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- Patients table
CREATE POLICY "Users can view all patients" ON patients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert patients" ON patients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update patients" ON patients
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete patients" ON patients
    FOR DELETE USING (auth.role() = 'authenticated');

-- PCS entries table
CREATE POLICY "Users can view all pcs_entries" ON pcs_entries
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert pcs_entries" ON pcs_entries
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update pcs_entries" ON pcs_entries
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete pcs_entries" ON pcs_entries
    FOR DELETE USING (auth.role() = 'authenticated');

-- Patient comments table
CREATE POLICY "Users can view all patient_comments" ON patient_comments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert patient_comments" ON patient_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update patient_comments" ON patient_comments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete patient_comments" ON patient_comments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Custom fields table
CREATE POLICY "Users can view all pcs_custom_fields" ON pcs_custom_fields
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert pcs_custom_fields" ON pcs_custom_fields
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update pcs_custom_fields" ON pcs_custom_fields
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete pcs_custom_fields" ON pcs_custom_fields
    FOR DELETE USING (auth.role() = 'authenticated');

-- Entry field values table
CREATE POLICY "Users can view all pcs_entry_field_values" ON pcs_entry_field_values
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert pcs_entry_field_values" ON pcs_entry_field_values
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update pcs_entry_field_values" ON pcs_entry_field_values
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete pcs_entry_field_values" ON pcs_entry_field_values
    FOR DELETE USING (auth.role() = 'authenticated');

-- Patient relationships table
CREATE POLICY "Users can view all patient_relationships" ON patient_relationships
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert patient_relationships" ON patient_relationships
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update patient_relationships" ON patient_relationships
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete patient_relationships" ON patient_relationships
    FOR DELETE USING (auth.role() = 'authenticated');
