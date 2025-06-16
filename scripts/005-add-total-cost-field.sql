-- Add total_cost field to form_submissions table
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2);

-- Update the table to make total_cost NOT NULL for future submissions
-- (existing submissions will keep NULL values)
