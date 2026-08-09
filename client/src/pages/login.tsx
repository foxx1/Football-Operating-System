import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ShieldCheck, CircleDot, ClipboardCheck, TimerReset, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { isTechnicalStaffRole } from "@shared/schema";

async function requestPasswordReset(email: string) {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState<"login" | "forgot" | "forgot-sent">("login");
  const [resetEmail, setResetEmail] = useState("");
  const { toast } = useToast();
  const { isRtl, t, toggleLocale } = useI18n();
  const [, navigate] = useLocation();

  const loginMutation = useMutation({
    mutationFn: () => login(username, password),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate(
        user.role === "player"
          ? "/player-dashboard"
          : isTechnicalStaffRole(user.role)
            ? "/technical-staff"
            : "/",
      );
    },
    onError: () => {
      toast({
        title: "Login failed",
        description: "Check your username and password.",
        variant: "destructive",
      });
    },
  });

  const forgotMutation = useMutation({
    mutationFn: () => requestPasswordReset(resetEmail),
    onSuccess: () => setView("forgot-sent"),
  });

  return (
    <div className="min-h-screen bg-background grid place-items-center p-6">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleLocale}
        className={cn("fixed top-5 z-10", isRtl ? "left-5" : "right-5")}
      >
        {t("topbar.language")}
      </Button>
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden lg:flex flex-col justify-between rounded-lg border border-border/70 bg-card/75 p-8 shadow-[0_24px_60px_-44px_hsl(var(--foreground)/0.7)]">
          <div>
            <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <CircleDot className="h-6 w-6" />
            </div>
            <h1 className="max-w-xl text-3xl font-semibold leading-[1.5] text-balance">
              {t("login.heroTitle")}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              {t("login.heroBody")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-secondary/70 p-4">
              <ClipboardCheck className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-semibold">{t("login.readinessTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("login.readinessBody")}</p>
            </div>
            <div className="rounded-md bg-secondary/70 p-4">
              <TimerReset className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-semibold">{t("login.decisionsTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("login.decisionsBody")}</p>
            </div>
          </div>
        </section>
        <Card className="w-full max-w-sm justify-self-center self-center">
          {view === "login" && (
            <>
              <CardHeader className="space-y-3">
                <div className="h-11 w-11 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>{t("login.signIn")}</CardTitle>
                  <CardDescription>{t("login.description")}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    loginMutation.mutate();
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="username">{t("login.username")} / Email</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      autoComplete="username"
                      placeholder="username or email"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("login.password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <Button className="w-full" type="submit" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? t("login.signingIn") : t("login.signIn")}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </button>
                </form>
              </CardContent>
            </>
          )}

          {view === "forgot" && (
            <>
              <CardHeader className="space-y-3">
                <div className="h-11 w-11 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Reset password</CardTitle>
                  <CardDescription>
                    Enter your account email and we'll send a reset link.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    forgotMutation.mutate();
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      autoComplete="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  {forgotMutation.isError && (
                    <p className="text-sm text-destructive">Something went wrong. Try again.</p>
                  )}
                  <Button className="w-full" type="submit" disabled={forgotMutation.isPending}>
                    {forgotMutation.isPending ? "Sending…" : "Send reset link"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to sign in
                  </button>
                </form>
              </CardContent>
            </>
          )}

          {view === "forgot-sent" && (
            <>
              <CardHeader className="space-y-3">
                <div className="h-11 w-11 rounded-md bg-green-500/10 text-green-500 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>Check your email</CardTitle>
                  <CardDescription>
                    If <strong>{resetEmail}</strong> is registered, a reset link is on its way. Check your spam folder too.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
