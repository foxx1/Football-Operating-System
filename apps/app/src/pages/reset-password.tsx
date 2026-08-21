import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";

type PageState = "form" | "success" | "invalid";

async function resetPassword(token: string, password: string) {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Reset failed");
  }
  return res.json();
}

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [pageState, setPageState] = useState<PageState>("form");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setPageState("invalid");
    } else {
      setToken(t);
    }
  }, []);

  const resetMutation = useMutation({
    mutationFn: () => resetPassword(token!, password),
    onSuccess: () => setPageState("success"),
    onError: (error: Error) => {
      if (error.message === "Invalid or expired reset link") {
        setPageState("invalid");
      }
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setValidationError("Passwords don't match.");
      return;
    }

    resetMutation.mutate();
  }

  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-3">
            <div className="h-11 w-11 rounded-md bg-green-500/10 text-green-500 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Password updated</CardTitle>
              <CardDescription>
                Your new password is set. You can now sign in.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/login")}>
              Go to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === "invalid") {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-3">
            <div className="h-11 w-11 rounded-md bg-destructive/10 text-destructive flex items-center justify-center">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Link invalid or expired</CardTitle>
              <CardDescription>
                This password reset link has expired or already been used.
                Request a new one from the sign-in page.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
              Back to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid place-items-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-3">
          <div className="h-11 w-11 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Set new password</CardTitle>
            <CardDescription>
              Choose a strong password for your account.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type={showPw ? "text" : "password"}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}

            {resetMutation.isError && !validationError && (
              <p className="text-sm text-destructive">
                {resetMutation.error instanceof Error
                  ? resetMutation.error.message
                  : "Something went wrong. Try requesting a new reset link."}
              </p>
            )}

            <Button
              className="w-full"
              type="submit"
              disabled={resetMutation.isPending || !password || !confirm}
            >
              {resetMutation.isPending ? "Updating…" : "Set new password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
