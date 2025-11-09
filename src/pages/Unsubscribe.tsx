import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MailX, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { unsubscribeEmail } from "@/api/allureherApi";
import { Link } from "react-router-dom";

export default function Unsubscribe() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Pre-fill email from query parameter if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setLoading(true);
      await unsubscribeEmail(email.trim());
      setSuccess(true);
      toast({
        title: "Unsubscribed successfully",
        description: "You will no longer receive emails from us.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unsubscribe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-border shadow-luxury">
          <CardHeader className="text-center">
            {success ? (
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MailX className="h-6 w-6 text-primary" />
              </div>
            )}
            <CardTitle className="text-2xl font-heading">
              {success ? "You've Been Unsubscribed" : "Manage Email Preferences"}
            </CardTitle>
            <CardDescription>
              {success
                ? "You will no longer receive emails from AllureHer."
                : "We're sorry to see you go. Enter your email to unsubscribe from AllureHer updates."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  If you change your mind, you can always resubscribe by signing up again on our website.
                </p>
                <Button asChild className="w-full">
                  <Link to="/">Return to Home</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Processing..." : "Unsubscribe"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Changed your mind?{" "}
                  <Link to="/" className="text-primary hover:underline">
                    Go back to home
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
