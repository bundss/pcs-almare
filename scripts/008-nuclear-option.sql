-- Last resort: temporarily remove constraint, fix data, add it back differently

-- Remove constraint entirely
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_status_check;
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_status_valid;

-- Clean all data
UPDATE patients SET status = 'analysis';

-- Add constraint using different syntax
ALTER TABLE patients ADD CHECK (status IN ('analysis', 'treatment', 'discharged', 'inactive'));

-- Set default
ALTER TABLE patients ALTER COLUMN status SET DEFAULT 'analysis';
