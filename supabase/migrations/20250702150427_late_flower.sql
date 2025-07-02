/*
  # Fix infinite recursion in RLS policies

  1. Policy Updates
    - Simplify dag_graphs policies to avoid circular references
    - Fix project_collaborators policies to prevent self-referencing loops
    - Ensure policies use direct auth.uid() checks where possible

  2. Security
    - Maintain proper access control
    - Prevent unauthorized access to data
    - Use efficient policy structures
*/

-- Drop existing problematic policies for dag_graphs
DROP POLICY IF EXISTS "Users can create graphs in their projects" ON dag_graphs;
DROP POLICY IF EXISTS "Users can delete graphs from their projects" ON dag_graphs;
DROP POLICY IF EXISTS "Users can update graphs in editable projects" ON dag_graphs;
DROP POLICY IF EXISTS "Users can view graphs from accessible projects" ON dag_graphs;

-- Drop existing problematic policies for project_collaborators
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Users can view collaborators of accessible projects" ON project_collaborators;

-- Create simplified policies for dag_graphs that avoid recursion
CREATE POLICY "Users can view graphs from their projects"
  ON dag_graphs
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view graphs from public projects"
  ON dag_graphs
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE is_public = true
    )
  );

CREATE POLICY "Users can view graphs from collaborated projects"
  ON dag_graphs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_collaborators.project_id = dag_graphs.project_id 
      AND project_collaborators.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create graphs in owned projects"
  ON dag_graphs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create graphs in editable collaborated projects"
  ON dag_graphs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_collaborators.project_id = dag_graphs.project_id 
      AND project_collaborators.user_id = auth.uid()
      AND project_collaborators.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Users can update graphs in owned projects"
  ON dag_graphs
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update graphs in editable collaborated projects"
  ON dag_graphs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_collaborators.project_id = dag_graphs.project_id 
      AND project_collaborators.user_id = auth.uid()
      AND project_collaborators.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Users can delete graphs from owned projects"
  ON dag_graphs
  FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete graphs from collaborated projects"
  ON dag_graphs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_collaborators.project_id = dag_graphs.project_id 
      AND project_collaborators.user_id = auth.uid()
      AND project_collaborators.role = 'owner'
    )
  );

-- Create simplified policies for project_collaborators that avoid self-reference
CREATE POLICY "Project owners can manage all collaborators"
  ON project_collaborators
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view collaborators of their own projects"
  ON project_collaborators
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view collaborators of projects they collaborate on"
  ON project_collaborators
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
  );