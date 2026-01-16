-- Harden page_visitors policies and add retention cleanup

-- Remove overly permissive insert policy
DROP POLICY IF EXISTS "Anyone can log page visits" ON public.page_visitors;

-- Allow inserts only for authenticated users (service role bypasses RLS)
CREATE POLICY "Authenticated can log page visits"
ON public.page_visitors
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

-- Explicitly deny anon inserts
CREATE POLICY "Deny anon inserts for page visits"
ON public.page_visitors
FOR INSERT
TO anon
WITH CHECK (false);

-- Prevent public updates/deletes to keep analytics immutable
CREATE POLICY "Deny updates to page visits"
ON public.page_visitors
FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny deletes to page visits"
ON public.page_visitors
FOR DELETE
TO anon, authenticated
USING (false);

-- Retention: purge visitor records older than 90 days (best-effort)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_cron;

      IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge_page_visitors') THEN
        PERFORM cron.schedule(
          'purge_page_visitors',
          '0 3 * * *',
          $$DELETE FROM public.page_visitors WHERE visited_at < now() - interval '90 days';$$
        );
      END IF;
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'pg_cron not available for scheduling purge_page_visitors';
    END;
  END IF;
END $$;
