-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the visitor report to run daily at 9 AM UTC
SELECT cron.schedule(
  'send-daily-visitor-report',
  '0 9 * * *', -- Every day at 9:00 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://hrukazznqazjgiatlowl.supabase.co/functions/v1/send-visitor-report',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhydWthenpucWF6amdpYXRsb3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTYwNjIsImV4cCI6MjA3NTI3MjA2Mn0.6KtH79D_9zFlhlbBLEttdybqiCrJ98XNvDAV_tYsEKk"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);