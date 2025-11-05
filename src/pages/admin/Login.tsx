import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const getErrorMessage = (error: string): string => {
  if (error.includes("Incorrect username or password")) {
    return "Invalid email or password. Please try again.";
  }
  if (error.includes("User does not exist")) {
    return "No account found with this email address.";
  }
  if (error.includes("NotAuthorizedException")) {
    return "Invalid credentials. Please check your email and password.";
  }
  if (error.includes("UserNotFoundException")) {
    return "Account not found. Please check your email address.";
  }
  if (error.includes("New password required")) {
    return "Password reset required. Please contact support.";
  }
  if (error.includes("Network")) {
    return "Connection error. Please check your internet connection.";
  }
  return "Login failed. Please try again or contact support.";
};

export default function AdminLogin() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await signIn(username.trim(), password);
      const to = (loc.state as any)?.from ?? "/admin";
      nav(to, { replace: true });
    } catch (e: any) {
      setErr(getErrorMessage(e?.message || "Login failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/images/logo.png" 
            alt="Allure Her Admin" 
            className="mx-auto h-16 w-auto mb-4"
          />
          <h1 className="text-2xl font-heading font-semibold text-foreground">
            Admin Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to manage your store
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-xl shadow-luxury border border-border p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@allureher.com"
                  value={username}
                  onChange={(e) => setU(e.target.value)}
                  className="pl-10 h-11 bg-background border-input focus:border-primary focus:ring-primary"
                  required
                  disabled={busy}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setP(e.target.value)}
                  className="pl-10 h-11 bg-background border-input focus:border-primary focus:ring-primary"
                  required
                  disabled={busy}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Error Message */}
            {err && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{err}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary-dark text-primary-foreground font-medium transition-all"
              disabled={busy}
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Protected access for authorized administrators only
            </p>
          </div>
        </div>

        {/* Back to Site Link */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            ← Back to site
          </a>
        </div>
      </motion.div>
    </div>
  );
}
