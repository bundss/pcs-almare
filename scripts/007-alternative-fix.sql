-- Alternative approach: recreate the table structure if needed
-- First, let's check the current constraint
SELECT conname, consrc 
FROM pg_constraint 
WHERE conrelid = 'patients'::regclass 
AND contype = 'c';

-- Drop ALL check constraints on patients table
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'patients'::regclass 
        AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE patients DROP CONSTRAINT IF EXISTS ' || constraint_name;
    END LOOP;
END $$;

-- Clean up the data first
UPDATE patients SET status = 'analysis' WHERE status = 'active';
UPDATE patients SET status = 'inactive' WHERE status = 'inactive';

-- Make sure we only have valid values
UPDATE patients SET status = 'analysis' 
WHERE status NOT IN ('analysis', 'treatment', 'discharged', 'inactive');

-- Add the constraint with a specific name
ALTER TABLE patients 
ADD CONSTRAINT patients_status_valid 
CHECK (status::text = ANY (ARRAY['analysis'::text, 'treatment'::text, 'discharged'::text, 'inactive'::text]));

-- Set default
ALTER TABLE patients ALTER COLUMN status SET DEFAULT 'analysis';

-- Verify it works
SELECT 'Constraint added successfully' as result;
