import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { subscribeEmail } from "@/api/allureherApi";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

const InsiderReminderPopup = () => {
  const { popup } = useSiteConfig();
  const [showMainDialog, setShowMainDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Don't show if disabled in config
    if (!popup.enabled) return;

    // Check if user has already subscribed or dismissed
    const hasSubscribed = localStorage.getItem("insider_subscribed");
    const lastDismissed = localStorage.getItem("popup_dismissed");
    
    // Don't show if already subscribed
    if (hasSubscribed) return;
    
    // Don't show if dismissed within last 7 days
    if (lastDismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return;
    }

    // Show popup after configured delay (default 15 seconds)
    const delayMs = (popup.delaySeconds || 15) * 1000;
    const timer = setTimeout(() => {
      setShowMainDialog(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [popup.enabled, popup.delaySeconds]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await subscribeEmail(email, "popup");
      
      localStorage.setItem("insider_subscribed", "true");
      
      setShowMainDialog(false);
      setEmail("");
      
      toast({
        title: "Welcome to the Insider's List! 🎉",
        description: "You'll receive exclusive updates and early access.",
      });
    } catch (error: any) {
      console.error("Error subscribing:", error);
      toast({
        title: "Subscription failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("popup_dismissed", Date.now().toString());
    setShowMainDialog(false);
  };

  return (
    <>
      <Dialog open={showMainDialog} onOpenChange={(open) => !open && handleDismiss()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {popup.title || "Wait! Don't Miss Out 🌟"}
            </DialogTitle>
            <DialogDescription className="text-base">
              {popup.message || "Join our exclusive Insider's List and be the first to discover where faith meets fashion. Get early access, special offers, and inspiration delivered to your inbox."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEmailSubmit} className="space-y-4 mt-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {popup.ctaText || "Join Now"}
              </Button>
              <Button type="button" variant="outline" onClick={handleDismiss} disabled={isSubmitting}>
                Maybe Later
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InsiderReminderPopup;
