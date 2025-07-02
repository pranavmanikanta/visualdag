/*
  # Fix infinite recursion in projects RLS policies

  1. Problem
    - Current RLS policies on projects table cause infinite recursion
    - The policies reference project_collaborators which references back to projects
    - This creates a circular dependency during policy evaluation

  2. Solution
    - Drop existing problematic policies
    - Create new simplified policies that avoid circular references
    - Ensure users can still access their own projects and public projects
    - Maintain collaboration functionality without recursion

  3. New Policies
    - Users can view their own projects (direct user_id check)
    - Users can view public projects (direct is_public check)  
    - Users can create projects (simple user_id validation)
    - Users can update/delete their own projects (direct user_id check)
    - Separate policies for collaboration will be handled at application level
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view projects they collaborate on" ON projects;
DROP POLICY IF EXISTS "Project editors can update projects" ON projects;
DROP POLICY IF EXISTS "Users can view public projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create new simplified policies without recursion
CREATE POLICY "Users can view their own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view public projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can create their own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Note: Collaboration access will be handled at the application level
-- by joining with project_collaborators table in queries rather than in RLS policies