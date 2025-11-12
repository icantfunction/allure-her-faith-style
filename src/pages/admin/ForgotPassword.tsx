import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, AlertCircle } from "lucide-react";
import { startForgotPassword } from "@/lib/cognito";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoImage from "@/assets/logo.png";

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const getErrorMessage = (error: any): string => {
    const errorName = error?.name || "";
    
    if (errorName === "UserNotFoundException") {
      return "No account found with this email address.";
    }
    if (errorName === "InvalidParameterException") {
      return "Invalid email format. Please check and try again.";
    }
    if (errorName === "LimitExceededException") {
      return "Too many requests. Please try again later.";
    }
    if (errorName === "CodeDeliveryFailureException") {
      return "Failed to send verification code. Please try again.";
    }
    
    return "Unable to start password reset. Please try again.";
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setStatus("sending");
    
    try {
      await startForgotPassword(username.trim());
      setStatus("sent");
      navigate(`/admin/reset?u=${encodeURIComponent(username.trim())}`);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(getErrorMessage(err));
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logoImage} alt="Logo" className="h-16 mx-auto mb-4" />
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl shadow-luxury border border-border p-8">
          <h1 className="text-2xl font-semibold mb-2 text-foreground">Forgot password?</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your admin email. We'll send a verification code to the email on file.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="email@yourdomain.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-11 bg-background border-input focus:border-primary"
                  disabled={status === "sending"}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={status === "sending"}
              className="w-full h-11"
            >
              {status === "sending" ? "Sending code..." : "Send reset code"}
            </Button>
          </form>

          {/* Error Message */}
          {status === "error" && errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{errorMsg}</p>
            </motion.div>
          )}

          {/* Success Message */}
          {status === "sent" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 p-3 rounded-md bg-green-500/10 border border-green-500/20 flex items-start gap-2"
            >
              <p className="text-sm text-green-600">
                Code sent! Check your email and continue to the next step.
              </p>
            </motion.div>
          )}

          {/* Back to Login */}
          <div className="mt-6 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => navigate("/admin/login")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
