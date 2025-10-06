-- Fix Security Issue #1: Remove public read access to visitor_report_config
-- This protects the business email from being scraped by competitors/spammers
DROP POLICY IF EXISTS "Anyone can read config" ON public.visitor_report_config;

-- Fix Security Issue #2: Add explicit DENY policy for page_visitors SELECT
-- This prevents competitors from scraping visitor data and traffic patterns
CREATE POLICY "Deny public read access to visitor data"
ON public.page_visitors
FOR SELECT
TO anon, authenticated
USING (false);

-- Note: The edge function uses SERVICE_ROLE_KEY which bypasses RLS,
-- so these security measures don't affect the daily email reports.