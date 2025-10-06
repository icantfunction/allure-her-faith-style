import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';

export const VisitorReportTest = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendTestEmail = async () => {
    setIsLoading(true);
    try {
      console.log('Triggering visitor report email...');
      
      const { data, error } = await supabase.functions.invoke('send-visitor-report', {
        body: {},
      });

      if (error) {
        console.error('Error sending email:', error);
        throw error;
      }

      console.log('Email sent successfully:', data);
      
      toast.success('Test email sent!', {
        description: 'Check ramosnco@gmail.com for the visitor report.',
      });
    } catch (error: any) {
      console.error('Failed to send test email:', error);
      toast.error('Failed to send email', {
        description: error.message || 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Test Visitor Report
        </CardTitle>
        <CardDescription>
          Send a test email with current visitor statistics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={sendTestEmail} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send Test Email
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Email will be sent to: <strong>ramosnco@gmail.com</strong>
        </p>
      </CardContent>
    </Card>
  );
};
