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
  const [showDevotionalsDialog, setShowDevotionalsDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
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

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    setPendingEmail(email);
    setShowMainDialog(false);
    setShowDevotionalsDialog(true);
  };

  const submitToBackend = async (wantsDevotionals: boolean) => {
    setIsSubmitting(true);
    try {
      await subscribeEmail(pendingEmail, "popup");
      
      localStorage.setItem(`subscriber_${pendingEmail}_devotionals`, String(wantsDevotionals));
      localStorage.setItem("insider_subscribed", "true");
      
      setShowDevotionalsDialog(false);
      setPendingEmail("");
      setEmail("");
      
      toast({
        title: "Welcome to the Insider's List! 🎉",
        description: wantsDevotionals 
          ? "You'll receive exclusive updates and weekly devotionals."
          : "You'll receive exclusive updates and early access.",
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
              <Button type="submit" className="flex-1">
                {popup.ctaText || "Join Now"}
              </Button>
              <Button type="button" variant="outline" onClick={handleDismiss}>
                Maybe Later
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDevotionalsDialog} onOpenChange={setShowDevotionalsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>One more thing...</DialogTitle>
            <DialogDescription>
              Would you like to receive weekly devotionals along with exclusive updates?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => submitToBackend(true)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Yes, send devotionals
            </Button>
            <Button
              onClick={() => submitToBackend(false)}
              disabled={isSubmitting}
              variant="outline"
              className="flex-1"
            >
              No, just updates
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InsiderReminderPopup;
