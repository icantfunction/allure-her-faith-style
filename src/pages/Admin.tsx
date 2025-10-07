import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Admin = () => {
  const [loading, setLoading] = useState(false);

  const sendReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-visitor-report');
      
      if (error) throw error;
      
      toast.success('Visitor report sent successfully!');
      console.log('Report sent:', data);
    } catch (error) {
      console.error('Error sending report:', error);
      toast.error('Failed to send report. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>Manage visitor reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={sendReport} 
              disabled={loading}
              size="lg"
            >
              {loading ? 'Sending...' : 'Send Visitor Report Now'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
