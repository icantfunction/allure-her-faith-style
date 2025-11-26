import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Heart } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { subscribeToEmails } from "@/api/email-subscribe";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setPendingEmail(email);
    setShowDialog(true);
  };

  const submitToBackend = async (wantsDevotionals: boolean) => {
    setIsLoading(true);
    setShowDialog(false);

    try {
      await subscribeToEmails(pendingEmail);
      
      localStorage.setItem(`subscriber_${pendingEmail}_devotionals`, String(wantsDevotionals));
      
      toast({
        title: "Welcome to our newsletter!",
        description: wantsDevotionals 
          ? "Check your inbox for a welcome email 🎉"
          : "Check your inbox for a confirmation email 🎉",
      });
      
      setEmail("");
      setPendingEmail("");
    } catch (error: any) {
      console.error("Error subscribing:", error);
      toast({
        title: "Subscription failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Would you like to receive devotionals?</DialogTitle>
            <DialogDescription>
              We send weekly devotionals to nourish your soul and inspire your faith journey.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => submitToBackend(false)} disabled={isLoading}>
              No, just updates
            </Button>
            <Button onClick={() => submitToBackend(true)} disabled={isLoading}>
              Yes, include devotionals
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
        <Card className="bg-gradient-warm border-0 shadow-luxury">
          <CardContent className="p-12 text-center">
            <div className="mb-8">
              <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-section-title mb-4 text-foreground">
                Stay Encouraged. Stay in Touch.
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Be the first to know about new collections and receive weekly devotionals 
                that nourish your soul. Join our community of faithful fashionistas.
              </p>
            </div>
            
            <div className="max-w-md mx-auto">
              <form onSubmit={handleEmailSubmit} className="flex space-x-3 mb-4">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-background/70 border-primary/20 focus:border-primary"
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="btn-luxury h-12 px-8" disabled={isLoading}>
                  {isLoading ? "Subscribing..." : "Subscribe"}
                </Button>
              </form>
              
              <p className="text-xs text-muted-foreground">
                New drops • Weekly devotionals • Style inspiration
              </p>
            </div>
            
            <div className="section-divider"></div>
            
            <div className="space-y-4">
              <h3 className="font-heading text-xl text-foreground">
                Get in Touch
              </h3>
              <div className="flex justify-center text-muted-foreground">
                <a href="mailto:info@shopallureher.com" className="hover:text-primary transition-colors">
                  info@shopallureher.com
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
    </>
  );
};

export default Newsletter;