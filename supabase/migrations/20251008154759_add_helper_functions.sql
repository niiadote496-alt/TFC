/*
  # Add Helper Functions

  ## New Functions
  1. increment_family_members - Increments family member count
  2. Auto-update family member count trigger

  ## Purpose
  These functions help maintain data consistency when users join families
*/

-- Function to increment family member count
CREATE OR REPLACE FUNCTION increment_family_members(family_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE families
  SET member_count = member_count + 1
  WHERE id = family_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update family member count when a user joins
CREATE OR REPLACE FUNCTION update_family_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.family_id IS NOT NULL AND (OLD.family_id IS NULL OR OLD.family_id != NEW.family_id) THEN
    IF OLD.family_id IS NOT NULL THEN
      UPDATE families SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.family_id;
    END IF;
    UPDATE families SET member_count = member_count + 1 WHERE id = NEW.family_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic family member count updates
DROP TRIGGER IF EXISTS trigger_update_family_member_count ON users;
CREATE TRIGGER trigger_update_family_member_count
AFTER INSERT OR UPDATE OF family_id ON users
FOR EACH ROW
EXECUTE FUNCTION update_family_member_count();
