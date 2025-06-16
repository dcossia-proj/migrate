-- Drop existing policies for user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Create new policies that work during registration
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to insert their own profile (works during registration)
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (id IN (
    SELECT id FROM auth.users WHERE id = user_profiles.id
  ));

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Alternative approach: Create a more permissive insert policy
-- This allows any authenticated user to insert a profile with their own ID
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (
    -- Either the user is authenticated and inserting their own profile
    (auth.uid() = id) OR 
    -- Or this is a new user being created (exists in auth.users but not yet authenticated)
    (id IN (SELECT id FROM auth.users))
  );
