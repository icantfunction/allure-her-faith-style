-- Drop the restrictive policy that denies all reads
DROP POLICY IF EXISTS "Deny public read access to visitor data" ON page_visitors;

-- Allow authenticated users (admins) to read all visitor data
CREATE POLICY "Allow authenticated users to read visitor data"
ON page_visitors
FOR SELECT
TO authenticated
USING (true);