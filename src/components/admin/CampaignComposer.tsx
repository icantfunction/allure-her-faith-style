import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, CheckCircle2, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminCreateCampaign, localToUtcIso, type CreateCampaignResponse } from "@/api/email";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CampaignComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function CampaignComposer({ open, onOpenChange, onSuccess }: CampaignComposerProps) {
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [bodyHtml, setBodyHtml] = React.useState("");
  const [mode, setMode] = React.useState<"immediate" | "scheduled">("immediate");
  const [sendAtLocal, setSendAtLocal] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [result, setResult] = React.useState<CreateCampaignResponse | null>(null);

  const handleReset = () => {
    setName("");
    setSubject("");
    setBodyHtml("");
    setMode("immediate");
    setSendAtLocal("");
    setResult(null);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      handleReset();
    }
    onOpenChange(isOpen);
  };

  const handleSend = async () => {
    if (!name.trim() || !subject.trim() || !bodyHtml.trim()) {
      toast({
        title: "Validation Error",
        description: "Campaign name, subject, and email body are required.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "scheduled" && !sendAtLocal) {
      toast({
        title: "Validation Error",
        description: "Please select a date and time for the scheduled campaign.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "scheduled") {
      const scheduledDate = new Date(sendAtLocal);
      if (scheduledDate <= new Date()) {
        toast({
          title: "Invalid Schedule Time",
          description: "Please select a future date and time.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setSending(true);
      const payload: any = {
        name: name.trim(),
        subject: subject.trim(),
        bodyHtml: bodyHtml.trim(),
      };

      if (mode === "scheduled") {
        payload.sendAtUtc = localToUtcIso(sendAtLocal);
      }

      const response = await adminCreateCampaign(payload);
      setResult(response);

      if (response.status === "draft") {
        toast({
          title: "Campaign Scheduled!",
          description: `Will be sent at ${new Date(sendAtLocal).toLocaleString()}`,
        });
      } else if (response.status === "sent") {
        toast({
          title: "Campaign Sent!",
          description: `Successfully sent to ${response.stats?.totalRecipients || 0} subscriber(s).`,
        });
      }

      setTimeout(() => {
        onSuccess?.();
        handleReset();
      }, 2000);
    } catch (error: any) {
      let errorMessage = error.message || "An error occurred while creating the campaign.";
      let errorTitle = "Failed to Create Campaign";

      if (error.message.includes("401") || error.message.includes("403")) {
        errorTitle = "Session Expired";
        errorMessage = "Please log in again.";
      }

      toast({
        title: errorTitle,
        description: errorMessage,
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
            Send an email immediately or schedule it for later.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          // Success State
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {result.status === "draft" ? "Campaign Scheduled!" : "Campaign Sent Successfully!"}
              </h3>
              <p className="text-muted-foreground">Campaign ID: {result.campaignId}</p>
            </div>
            {result.stats && (
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
            )}
          </div>
        ) : (
          // Form State
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name (Internal)</Label>
              <Input
                id="name"
                placeholder="e.g., November Newsletter"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={sending}
              />
              <p className="text-xs text-muted-foreground">
                Internal name for tracking this campaign.
              </p>
            </div>

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
                rows={10}
                disabled={sending}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Use HTML tags like &lt;h1&gt;, &lt;p&gt;, &lt;a href="..."&gt;, &lt;img src="..."&gt; to format your
                email.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Delivery Mode</Label>
              <RadioGroup value={mode} onValueChange={(val) => setMode(val as "immediate" | "scheduled")} disabled={sending}>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Send className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Send Immediately</div>
                      <div className="text-xs text-muted-foreground">Campaign will be sent to all subscribers right now</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <Label htmlFor="scheduled" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Calendar className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Schedule for Later</div>
                      <div className="text-xs text-muted-foreground">Choose a specific date and time</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {mode === "scheduled" && (
                <div className="space-y-2 pl-6 pt-2">
                  <Label htmlFor="sendAtLocal" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Schedule Time (Your Local Time)
                  </Label>
                  <Input
                    id="sendAtLocal"
                    type="datetime-local"
                    value={sendAtLocal}
                    onChange={(e) => setSendAtLocal(e.target.value)}
                    disabled={sending}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your local time will be converted to UTC for scheduling.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => handleClose(false)} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={sending || !name.trim() || !subject.trim() || !bodyHtml.trim()}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "scheduled" ? "Scheduling..." : "Sending..."}
                  </>
                ) : (
                  <>
                    {mode === "scheduled" ? (
                      <>
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule Campaign
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send to All Subscribers
                      </>
                    )}
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
