-- First, let's make sure we drop the old table completely and recreate it
DROP TABLE IF EXISTS form_submissions CASCADE;

-- Update user_profiles table to include address and delivery instructions for autofill
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;

-- Create the form_submissions table with correct structure
CREATE TABLE form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  delivery_instructions TEXT NOT NULL,
  tip DECIMAL(10,2),
  image_urls TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on form_submissions
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for form_submissions
CREATE POLICY "Users can view their own submissions" ON form_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own submissions" ON form_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'form_submissions' 
ORDER BY ordinal_position;
