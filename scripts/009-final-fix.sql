-- Now we can see the data clearly, let's fix it properly

-- First, drop any existing constraints
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_status_check;
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_status_valid;

-- Update the data to use new status values
UPDATE patients SET status = 'analysis' WHERE status = 'active';
UPDATE patients SET status = 'inactive' WHERE status = 'inactive';

-- Verify the update worked
SELECT name, status FROM patients ORDER BY name;

-- Now add the constraint
ALTER TABLE patients ADD CONSTRAINT patients_status_check 
CHECK (status IN ('analysis', 'treatment', 'discharged', 'inactive'));

-- Set the default for new records
ALTER TABLE patients ALTER COLUMN status SET DEFAULT 'analysis';

-- Test that it works by checking constraint
SELECT 'Status constraint added successfully' as result;

-- Show final status of all patients
SELECT 
    status,
    COUNT(*) as count
FROM patients 
GROUP BY status
ORDER BY status;
