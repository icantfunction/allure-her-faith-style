import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Mail, AlertCircle, ArrowLeft } from "lucide-react";
import { confirmForgotPassword } from "@/lib/cognito";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoImage from "@/assets/logo.png";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const presetUsername = useMemo(() => params.get("u") || "", [params]);
  const [username, setUsername] = useState(presetUsername);
  const [code, setCode] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [status, setStatus] = useState<"idle" | "confirming" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (presetUsername) setUsername(presetUsername);
  }, [presetUsername]);

  const getErrorMessage = (error: any): string => {
    const errorName = error?.name || "";
    
    if (errorName === "CodeMismatchException") {
      return "Invalid verification code. Please check and try again.";
    }
    if (errorName === "ExpiredCodeException") {
      return "Code has expired. Please request a new one.";
    }
    if (errorName === "InvalidPasswordException") {
      return "Password does not meet requirements. Use at least 8 characters with uppercase, lowercase, and numbers.";
    }
    if (errorName === "LimitExceededException") {
      return "Too many attempts. Please try again later.";
    }
    
    return "Unable to reset password. Please check the code and try again.";
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    
    if (pwd !== pwd2) {
      setErrorMsg("Passwords do not match.");
      setStatus("error");
      return;
    }

    if (pwd.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      setStatus("error");
      return;
    }

    setStatus("confirming");
    
    try {
      await confirmForgotPassword({
        username: username.trim(),
        code: code.trim(),
        newPassword: pwd,
      });
      setStatus("done");
      navigate("/admin/login", { replace: true, state: { resetOk: true } });
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
          <h1 className="text-2xl font-semibold mb-2 text-foreground">Reset password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter the verification code sent to your email and choose a new password.
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
                  disabled={status === "confirming"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                required
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-11 bg-background border-input focus:border-primary"
                inputMode="numeric"
                maxLength={10}
                disabled={status === "confirming"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  className="pl-10 h-11 bg-background border-input focus:border-primary"
                  disabled={status === "confirming"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={pwd2}
                  onChange={(e) => setPwd2(e.target.value)}
                  className="pl-10 h-11 bg-background border-input focus:border-primary"
                  disabled={status === "confirming"}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={status === "confirming"}
              className="w-full h-11"
            >
              {status === "confirming" ? "Updating password..." : "Set new password"}
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

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-border flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/forgot")}
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Resend code
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
