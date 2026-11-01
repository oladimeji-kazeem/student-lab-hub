CREATE TABLE IF NOT EXISTS public.email_notifications (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    recipient_email VARCHAR(255) NOT NULL,
    cc_emails TEXT[],
    subject VARCHAR(255) NOT NULL,
    email_type VARCHAR(50) NOT NULL,
    html_content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow select email_notifications" ON public.email_notifications;
CREATE POLICY "Allow select email_notifications" ON public.email_notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert email_notifications" ON public.email_notifications;
CREATE POLICY "Allow insert email_notifications" ON public.email_notifications FOR INSERT WITH CHECK (true);

