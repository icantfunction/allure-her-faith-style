-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the daily visitor report to run at 9:00 AM every day
SELECT cron.schedule(
  'daily-visitor-report',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://hrukazznqazjgiatlowl.supabase.co/functions/v1/send-visitor-report',
      headers:='{"Content-Type": "application/json"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);