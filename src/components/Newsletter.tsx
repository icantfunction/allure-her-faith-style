import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Heart } from "lucide-react";

const Newsletter = () => {
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
              <div className="flex space-x-3 mb-4">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Your email address"
                    className="pl-10 h-12 bg-background/70 border-primary/20 focus:border-primary"
                  />
                </div>
                <Button className="btn-luxury h-12 px-8">
                  Subscribe
                </Button>
              </div>
              
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