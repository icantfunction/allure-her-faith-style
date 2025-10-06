-- Create table for tracking page visitors
CREATE TABLE IF NOT EXISTS public.page_visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  page_path TEXT NOT NULL,
  user_agent TEXT,
  referrer TEXT,
  session_id TEXT NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_page_visitors_visited_at ON public.page_visitors(visited_at);
CREATE INDEX idx_page_visitors_session_id ON public.page_visitors(session_id);

-- Enable RLS (make it public so anyone can log visits)
ALTER TABLE public.page_visitors ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert visits
CREATE POLICY "Anyone can log page visits"
ON public.page_visitors
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Create table for email configuration
CREATE TABLE IF NOT EXISTS public.visitor_report_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default config
INSERT INTO public.visitor_report_config (recipient_email)
VALUES ('ramosnco@gmail.com');

-- Enable RLS for config table
ALTER TABLE public.visitor_report_config ENABLE ROW LEVEL SECURITY;

-- Only allow reading config (no public updates for security)
CREATE POLICY "Anyone can read config"
ON public.visitor_report_config
FOR SELECT
TO anon, authenticated
USING (true);