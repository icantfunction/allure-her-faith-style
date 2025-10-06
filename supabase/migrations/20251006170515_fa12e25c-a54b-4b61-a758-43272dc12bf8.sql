-- Secure visitor_report_config table completely
-- Only edge functions with SERVICE_ROLE_KEY should be able to access this table

-- Deny all SELECT access to prevent email harvesting
CREATE POLICY "Deny public read access to config"
ON public.visitor_report_config
FOR SELECT
TO anon, authenticated
USING (false);

-- Deny all INSERT access to prevent adding fake email addresses
CREATE POLICY "Deny public insert to config"
ON public.visitor_report_config
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

-- Deny all UPDATE access to prevent modifying email configurations
CREATE POLICY "Deny public update to config"
ON public.visitor_report_config
FOR UPDATE
TO anon, authenticated
USING (false);

-- Deny all DELETE access to prevent deleting legitimate recipients
CREATE POLICY "Deny public delete from config"
ON public.visitor_report_config
FOR DELETE
TO anon, authenticated
USING (false);

-- Note: The edge function uses SERVICE_ROLE_KEY which bypasses ALL RLS policies,
-- so it can still read/write the configuration for sending daily reports.