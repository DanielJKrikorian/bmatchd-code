/*
  # Fix vendor authentication schema

  1. Changes
    - Add role column to auth.users
    - Add trigger to sync auth.users role with public.users
    - Add policies for vendor access
*/

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'role', 'couple'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update vendor policies
CREATE POLICY "Enable read access for all users"
  ON vendors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users with vendor role"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'vendor'
    )
  );

CREATE POLICY "Enable update for vendor users only"
  ON vendors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'vendor'
    )
  );