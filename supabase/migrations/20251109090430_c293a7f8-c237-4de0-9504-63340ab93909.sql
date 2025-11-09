-- Drop the policy that allows reading visitor data
DROP POLICY IF EXISTS "Allow authenticated users to read visitor data" ON page_visitors;

-- Create a policy that denies all SELECT operations
CREATE POLICY "Deny all read access to visitor data"
ON page_visitors
FOR SELECT
TO public
USING (false);