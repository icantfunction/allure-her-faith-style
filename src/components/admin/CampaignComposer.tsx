import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminCreateEmailCampaign, type CreateCampaignResponse } from "@/api/allureherApi";

interface CampaignComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CampaignComposer({ open, onOpenChange, onSuccess }: CampaignComposerProps) {
  const { toast } = useToast();
  const [subject, setSubject] = React.useState("");
  const [bodyHtml, setBodyHtml] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [result, setResult] = React.useState<CreateCampaignResponse | null>(null);

  const handleReset = () => {
    setSubject("");
    setBodyHtml("");
    setResult(null);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      handleReset();
    }
    onOpenChange(isOpen);
  };

  const handleSend = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast({
        title: "Validation Error",
        description: "Subject and email body are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSending(true);
      const response = await adminCreateEmailCampaign({
        subject: subject.trim(),
        bodyHtml: bodyHtml.trim(),
      });

      setResult(response);
      toast({
        title: "Campaign Sent!",
        description: `Successfully sent to ${response.stats.successCount} subscriber(s).`,
      });

      // Call onSuccess after short delay to show success state
      setTimeout(() => {
        onSuccess?.();
        handleReset();
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Failed to Send Campaign",
        description: error.message || "An error occurred while sending the campaign.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Create Email Campaign</DialogTitle>
          <DialogDescription>
            Send an email to all active subscribers. The campaign will be sent immediately.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          // Success State
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Campaign Sent Successfully!</h3>
              <p className="text-muted-foreground">Campaign ID: {result.campaignId}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{result.stats.totalRecipients}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.stats.successCount}
                </p>
                <p className="text-sm text-muted-foreground">Success</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {result.stats.failedCount}
                </p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </div>
        ) : (
          // Form State
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                placeholder="e.g., New Collection Just Dropped ✨"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyHtml">Email Body (HTML)</Label>
              <Textarea
                id="bodyHtml"
                placeholder="<h1>Hello!</h1><p>Check out our new collection...</p>"
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                rows={12}
                disabled={sending}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use HTML tags like &lt;h1&gt;, &lt;p&gt;, &lt;a href="..."&gt;, &lt;img src="..."&gt; to format your
                email.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => handleClose(false)} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={sending || !subject.trim() || !bodyHtml.trim()}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send to All Subscribers
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
