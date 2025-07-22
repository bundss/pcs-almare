-- Add user profile fields
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES user_profiles(id);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add completion status to PCS entries
ALTER TABLE pcs_entries ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE pcs_entries ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE pcs_entries ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES user_profiles(id);

-- Add new patient status options
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_status_check;
ALTER TABLE patients ADD CONSTRAINT patients_status_check CHECK (status IN ('analysis', 'treatment', 'discharged', 'inactive'));
ALTER TABLE patients ALTER COLUMN status SET DEFAULT 'analysis';

-- Add mindmap positioning
ALTER TABLE pcs_entries ADD COLUMN IF NOT EXISTS mindmap_x FLOAT DEFAULT 0;
ALTER TABLE pcs_entries ADD COLUMN IF NOT EXISTS mindmap_y FLOAT DEFAULT 0;

-- Create change log table
CREATE TABLE IF NOT EXISTS pcs_change_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    entry_id UUID REFERENCES pcs_entries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id),
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'completed', 'uncompleted'
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create public access tokens for patient sharing
CREATE TABLE IF NOT EXISTS patient_public_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pending user notifications
CREATE TABLE IF NOT EXISTS pending_user_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update patient status based on completion
CREATE OR REPLACE FUNCTION update_patient_status_on_completion()
RETURNS TRIGGER AS $$
DECLARE
    total_entries INTEGER;
    completed_entries INTEGER;
    fundamental_important_total INTEGER;
    fundamental_important_completed INTEGER;
BEGIN
    -- Count total entries (excluding care category for discharge status)
    SELECT COUNT(*) INTO total_entries
    FROM pcs_entries 
    WHERE patient_id = COALESCE(NEW.patient_id, OLD.patient_id);
    
    SELECT COUNT(*) INTO completed_entries
    FROM pcs_entries 
    WHERE patient_id = COALESCE(NEW.patient_id, OLD.patient_id) 
    AND is_completed = TRUE;
    
    -- Count fundamental and important entries only
    SELECT COUNT(*) INTO fundamental_important_total
    FROM pcs_entries 
    WHERE patient_id = COALESCE(NEW.patient_id, OLD.patient_id)
    AND category IN ('fundamental', 'important');
    
    SELECT COUNT(*) INTO fundamental_important_completed
    FROM pcs_entries 
    WHERE patient_id = COALESCE(NEW.patient_id, OLD.patient_id)
    AND category IN ('fundamental', 'important')
    AND is_completed = TRUE;
    
    -- Update patient status
    IF fundamental_important_completed = fundamental_important_total AND fundamental_important_total > 0 THEN
        -- All fundamental and important procedures completed = discharged
        UPDATE patients 
        SET status = 'discharged', last_updated = NOW()
        WHERE id = COALESCE(NEW.patient_id, OLD.patient_id);
    ELSIF completed_entries > 0 THEN
        -- At least one procedure completed = in treatment
        UPDATE patients 
        SET status = 'treatment', last_updated = NOW()
        WHERE id = COALESCE(NEW.patient_id, OLD.patient_id);
    ELSE
        -- No procedures completed = analysis
        UPDATE patients 
        SET status = 'analysis', last_updated = NOW()
        WHERE id = COALESCE(NEW.patient_id, OLD.patient_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic status update
DROP TRIGGER IF EXISTS trigger_update_patient_status ON pcs_entries;
CREATE TRIGGER trigger_update_patient_status
    AFTER INSERT OR UPDATE OR DELETE ON pcs_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_patient_status_on_completion();

-- Function to log changes
CREATE OR REPLACE FUNCTION log_pcs_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO pcs_change_log (patient_id, entry_id, user_id, action, description)
        VALUES (NEW.patient_id, NEW.id, auth.uid(), 'created', 'Nova entrada PCS criada: ' || NEW.title);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log completion status changes
        IF OLD.is_completed != NEW.is_completed THEN
            INSERT INTO pcs_change_log (patient_id, entry_id, user_id, action, field_name, old_value, new_value, description)
            VALUES (NEW.patient_id, NEW.id, auth.uid(), 
                   CASE WHEN NEW.is_completed THEN 'completed' ELSE 'uncompleted' END,
                   'is_completed', OLD.is_completed::text, NEW.is_completed::text,
                   CASE WHEN NEW.is_completed THEN 'Procedimento marcado como concluído' ELSE 'Procedimento desmarcado como concluído' END);
        END IF;
        
        -- Log title changes
        IF OLD.title != NEW.title THEN
            INSERT INTO pcs_change_log (patient_id, entry_id, user_id, action, field_name, old_value, new_value, description)
            VALUES (NEW.patient_id, NEW.id, auth.uid(), 'updated', 'title', OLD.title, NEW.title, 'Título alterado');
        END IF;
        
        -- Log description changes
        IF COALESCE(OLD.description, '') != COALESCE(NEW.description, '') THEN
            INSERT INTO pcs_change_log (patient_id, entry_id, user_id, action, field_name, old_value, new_value, description)
            VALUES (NEW.patient_id, NEW.id, auth.uid(), 'updated', 'description', OLD.description, NEW.description, 'Descrição alterada');
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO pcs_change_log (patient_id, entry_id, user_id, action, description)
        VALUES (OLD.patient_id, OLD.id, auth.uid(), 'deleted', 'Entrada PCS removida: ' || OLD.title);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for change logging
DROP TRIGGER IF EXISTS trigger_log_pcs_changes ON pcs_entries;
CREATE TRIGGER trigger_log_pcs_changes
    AFTER INSERT OR UPDATE OR DELETE ON pcs_entries
    FOR EACH ROW
    EXECUTE FUNCTION log_pcs_changes();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pcs_entries_completed ON pcs_entries(is_completed);
CREATE INDEX IF NOT EXISTS idx_pcs_change_log_patient_id ON pcs_change_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_pcs_change_log_created_at ON pcs_change_log(created_at);
CREATE INDEX IF NOT EXISTS idx_patient_public_tokens_token ON patient_public_tokens(token);
CREATE INDEX IF NOT EXISTS idx_user_profiles_approval_status ON user_profiles(approval_status);

-- Update existing patients to analysis status
UPDATE patients SET status = 'analysis' WHERE status = 'active';
UPDATE patients SET status = 'inactive' WHERE status = 'inactive';

-- Generate public tokens for existing patients
INSERT INTO patient_public_tokens (patient_id, token)
SELECT id, encode(gen_random_bytes(32), 'hex')
FROM patients
ON CONFLICT DO NOTHING;
