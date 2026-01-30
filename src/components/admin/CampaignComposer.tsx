import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, CheckCircle2, Calendar, Clock, Eye, Code, Sparkles, Plus, Smartphone, Monitor, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminCreateCampaign, localToUtcIso, type CreateCampaignResponse } from "@/api/email";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EMAIL_TEMPLATES, PERSONALIZATION_VARIABLES, HTML_SNIPPETS } from "@/lib/emailTemplates";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CampaignComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  sources?: string[];
}

// Sanitize HTML for safe preview rendering
const sanitizeHtmlForPreview = (html: string): string => {
  let sanitized = html;
  
  // Remove AMP boilerplate style that hides body
  sanitized = sanitized.replace(
    /<style\s+amp4email-boilerplate>[\s\S]*?<\/style>/gi,
    ''
  );
  
  // Remove AMP scripts (won't work in preview anyway)
  sanitized = sanitized.replace(
    /<script\s+[^>]*src="https:\/\/cdn\.ampproject\.org[^>]*><\/script>/gi,
    ''
  );
  
  // Remove AMP-specific attributes
  sanitized = sanitized.replace(/⚡4email/g, '');
  
  // Force body visibility
  sanitized = sanitized.replace(
    '</head>',
    '<style>body{visibility:visible !important;}</style></head>'
  );
  
  return sanitized;
};

export default function CampaignComposer({ open, onOpenChange, onSuccess, sources = [] }: CampaignComposerProps) {
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [bodyHtml, setBodyHtml] = React.useState("");
  const [mode, setMode] = React.useState<"immediate" | "scheduled">("immediate");
  const [sendAtLocal, setSendAtLocal] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [result, setResult] = React.useState<CreateCampaignResponse | null>(null);
  const [previewMode, setPreviewMode] = React.useState<"desktop" | "mobile">("desktop");
  const [segmentType, setSegmentType] = React.useState<"all" | "source" | "test">("all");
  const [segmentSource, setSegmentSource] = React.useState("");

  const handleReset = () => {
    setName("");
    setSubject("");
    setBodyHtml("");
    setMode("immediate");
    setSendAtLocal("");
    setResult(null);
    setSegmentType("all");
    setSegmentSource("");
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

    if (segmentType === "source" && !segmentSource) {
      toast({
        title: "Validation Error",
        description: "Select a source for this campaign segment.",
        variant: "destructive",
      });
      return;
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
      if (segmentType === "source") {
        payload.segment = { type: "source", source: segmentSource };
      } else if (segmentType === "test") {
        payload.segment = { type: "test" };
      }

      const response = await adminCreateCampaign(payload);
      setResult(response);

      if (response.status === "draft" || response.status === "scheduled") {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                {result.status === "draft" || result.status === "scheduled" ? "Campaign Scheduled!" : "Campaign Sent Successfully!"}
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

            <div className="space-y-3">
              <Label>Audience Segment</Label>
              <RadioGroup value={segmentType} onValueChange={(v) => setSegmentType(v as "all" | "source" | "test")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="segment-all" />
                  <Label htmlFor="segment-all">All subscribers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="source" id="segment-source" />
                  <Label htmlFor="segment-source">By signup source</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="test" id="segment-test" />
                  <Label htmlFor="segment-test">Test users (info@shopallureher.com, ramosnco@gmail.com)</Label>
                </div>
              </RadioGroup>
              {segmentType === "source" && (
                <div className="space-y-2">
                  <Label htmlFor="segment-source-select">Source</Label>
                  <select
                    id="segment-source-select"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    value={segmentSource}
                    onChange={(e) => setSegmentSource(e.target.value)}
                    disabled={sending || sources.length === 0}
                  >
                    <option value="">Select a source</option>
                    {sources.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                  {sources.length === 0 && (
                    <p className="text-xs text-muted-foreground">No sources found yet. Collect subscribers first.</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email Content</Label>
              <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Edit HTML
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="space-y-3">
                  {/* Template Selector */}
                  <div className="flex gap-2 flex-wrap">
                    <Label className="w-full text-xs text-muted-foreground">Quick Start:</Label>
                    {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        onClick={() => setBodyHtml(template.html)}
                        disabled={sending}
                        className="text-xs"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {template.name}
                      </Button>
                    ))}
                  </div>

                  {/* Variable Inserter - Collapsible */}
                  <Collapsible defaultOpen={false}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-between text-xs">
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-3 w-3" />
                          Insert Variables
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <div className="flex gap-2 flex-wrap border rounded-lg p-3 bg-muted/30">
                        {PERSONALIZATION_VARIABLES.map((variable) => (
                          <Button
                            key={variable.token}
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById("bodyHtml") as HTMLTextAreaElement;
                              const cursorPos = textarea.selectionStart;
                              const textBefore = bodyHtml.substring(0, cursorPos);
                              const textAfter = bodyHtml.substring(cursorPos);
                              setBodyHtml(textBefore + variable.token + textAfter);
                            }}
                            disabled={sending}
                            className="text-xs"
                            title={variable.description}
                          >
                            {variable.token}
                          </Button>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* HTML Snippets */}
                  <div className="flex gap-2 flex-wrap">
                    <Label className="w-full text-xs text-muted-foreground">Insert Elements:</Label>
                    {Object.entries(HTML_SNIPPETS).map(([key, snippet]) => (
                      <Button
                        key={key}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const textarea = document.getElementById("bodyHtml") as HTMLTextAreaElement;
                          const cursorPos = textarea.selectionStart;
                          const textBefore = bodyHtml.substring(0, cursorPos);
                          const textAfter = bodyHtml.substring(cursorPos);
                          setBodyHtml(textBefore + "\n" + snippet.html + "\n" + textAfter);
                        }}
                        disabled={sending}
                        className="text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {snippet.name}
                      </Button>
                    ))}
                  </div>

                  {/* HTML Textarea */}
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
                    Use the buttons above to insert templates, variables, and common elements.
                  </p>
                </TabsContent>

                <TabsContent value="preview" className="space-y-3">
                  {/* Preview Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Preview Mode:</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={previewMode === "desktop" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPreviewMode("desktop")}
                      >
                        <Monitor className="h-4 w-4 mr-1" />
                        Desktop
                      </Button>
                      <Button
                        variant={previewMode === "mobile" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPreviewMode("mobile")}
                      >
                        <Smartphone className="h-4 w-4 mr-1" />
                        Mobile
                      </Button>
                    </div>
                  </div>

                  {/* Preview Container */}
                  <div className={`border rounded-lg overflow-hidden ${
                    previewMode === "mobile" ? "max-w-[375px] mx-auto" : "w-full"
                  }`}>
                    <div className="bg-muted px-3 py-2 text-xs text-muted-foreground border-b">
                      Subject: {subject || "(No subject)"}
                    </div>
                    <div
                      className="bg-white p-4 min-h-[400px] max-h-[500px] overflow-y-auto"
                      dangerouslySetInnerHTML={{ 
                        __html: sanitizeHtmlForPreview(bodyHtml) || "<p class='text-muted-foreground'>No content to preview yet...</p>" 
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {previewMode === "mobile" ? "📱 Mobile view (375px width)" : "🖥️ Desktop view (full width)"}
                    {bodyHtml.includes('⚡4email') && " • AMP features removed for safe preview"}
                    {bodyHtml.includes('yourdomain.com') && " • Replace placeholder image URLs with your actual hosted images"}
                  </p>
                </TabsContent>
              </Tabs>
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
