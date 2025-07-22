-- First, let's see what data we have
SELECT DISTINCT status FROM patients;

-- Drop the constraint completely
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_status_check;

-- Update any problematic data
UPDATE patients SET status = 'analysis' WHERE status NOT IN ('analysis', 'treatment', 'discharged', 'inactive');

-- Verify all data is clean
DO $$
DECLARE
    bad_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO bad_count 
    FROM patients 
    WHERE status NOT IN ('analysis', 'treatment', 'discharged', 'inactive');
    
    IF bad_count > 0 THEN
        RAISE EXCEPTION 'Found % rows with invalid status values', bad_count;
    END IF;
END $$;

-- Now add the constraint back
ALTER TABLE patients ADD CONSTRAINT patients_status_check 
    CHECK (status IN ('analysis', 'treatment', 'discharged', 'inactive'));

-- Set the default
ALTER TABLE patients ALTER COLUMN status SET DEFAULT 'analysis';

-- Test the constraint by trying to insert a valid row (this should work)
-- We'll do this in a transaction that we roll back
BEGIN;
    INSERT INTO patients (name, status) VALUES ('Test Patient', 'analysis');
    ROLLBACK;

-- Show current patient statuses to verify
SELECT name, status FROM patients ORDER BY name;
