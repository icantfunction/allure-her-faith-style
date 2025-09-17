import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Heart } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

    setIsLoading(true);

    try {
      const response = await fetch("https://hooks.zapier.com/hooks/catch/23791564/um92syy/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          email: email,
          timestamp: new Date().toISOString(),
          source: "allure_her_newsletter",
        }),
      });

      toast({
        title: "Welcome to our newsletter!",
        description: "Thank you for subscribing. You'll receive updates soon.",
      });
      
      setEmail("");
    } catch (error) {
      console.error("Error submitting email:", error);
      toast({
        title: "Error",
        description: "Failed to submit email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
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
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 text-muted-foreground">
                <a href="mailto:hello@allureher.com" className="hover:text-primary transition-colors">
                  hello@allureher.com
                </a>
                <span className="hidden sm:block text-accent-gold">•</span>
                <a href="tel:+1234567890" className="hover:text-primary transition-colors">
                  (123) 456-7890
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Newsletter;