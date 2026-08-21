import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useClubBranding } from "@/hooks/use-system-settings";
import { useI18n, translateWithParams } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";
import type { EmployeeRole } from "@shared/schema";

interface EmployeeInvitationDetails {
  id: number;
  email: string;
  role: EmployeeRole;
  teamName: string | null;
  expiresAt: string;
  isExpired: boolean;
  isUsed: boolean;
}

interface SignupPayload {
  token: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  username: string;
}

export default function EmployeeSignup() {
  const [, params] = useRoute("/employee-invite/:token");
  const [, navigate] = useLocation();
  const token = params?.token ?? "";
  const { toast } = useToast();
  const { isRtl, t } = useI18n();
  const { organizationName, logoUrl, isLoading: brandingLoading } = useClubBranding("Our Club");
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: invitation, isLoading, error } = useQuery({
    queryKey: [`/api/employee-invitations/${token}`],
    queryFn: async () => {
      const response = await fetch(`/api/employee-invitations/${token}`);
      if (!response.ok) throw new Error("Invalid or expired invitation");
      return response.json() as Promise<EmployeeInvitationDetails>;
    },
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (invitation?.email) {
      setFormData((current) => ({ ...current, email: invitation.email }));
    }
  }, [invitation?.email]);

  const signupMutation = useMutation({
    mutationFn: async (payload: SignupPayload) => {
      const response = await fetch("/api/auth/signup-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Signup failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t("employeeSignup.toast.success"), description: t("employeeSignup.toast.successDesc") });
      navigate("/login");
    },
    onError: (signupError) => {
      toast({
        title: t("employeeSignup.toast.failed"),
        description: signupError instanceof Error ? signupError.message : t("employeeSignup.toast.failedDesc"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const email = formData.email.trim();
    if (!email || formData.password.length < 6 || formData.password !== formData.confirmPassword) {
      const description = !email
        ? t("employeeSignup.error.emailRequired")
        : formData.password.length < 6
          ? t("employeeSignup.error.passwordLength")
          : t("employeeSignup.error.passwordMatch");
      toast({ title: t("employeeSignup.error.checkDetails"), description, variant: "destructive" });
      return;
    }

    const localPart = email.split("@")[0] || "employee";
    const nameParts = localPart.split(/[._-]/).filter(Boolean).slice(0, 2);
    const capitalize = (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

    signupMutation.mutate({
      token,
      email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      firstName: capitalize(nameParts[0]) || "Employee",
      lastName: capitalize(nameParts[1]) || "Last Name or Surname",
      username: localPart.toLowerCase().replace(/[^a-z0-9]/g, "") || "employee",
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background grid place-items-center p-6 text-sm text-muted-foreground">{t("employeeSignup.loading")}</div>;
  }

  if (error || !invitation) {
    return (
      <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-background grid place-items-center p-6">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <div className={cn("flex items-start gap-3", isRtl && "flex-row-reverse")}>
              <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
              <div>
                <CardTitle className="text-red-900">{t("employeeSignup.invalidTitle")}</CardTitle>
                <CardDescription className="text-red-700">{t("employeeSignup.invalidDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent><Button asChild className="w-full" variant="outline"><a href="/login">{t("employeeSignup.goToLogin")}</a></Button></CardContent>
        </Card>
      </div>
    );
  }

  const roleLabel = t(`staff.role.${invitation.role}`);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="min-h-screen bg-background grid place-items-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          {/* Club branding */}
          <div className={cn("flex items-center gap-3 rounded-md border border-border/70 bg-card/70 p-3", isRtl && "flex-row-reverse")}>
            {logoUrl ? (
              <img src={logoUrl} alt={`${organizationName} logo`} className="h-12 w-12 rounded-md bg-secondary/70 object-contain p-1" />
            ) : (
              <div className="h-12 w-12 rounded-md bg-primary/10 text-primary flex items-center justify-center"><ShieldCheck className="h-6 w-6" /></div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("employeeSignup.clubLabel")}</p>
              <h1 className="truncate text-xl font-extrabold leading-tight text-foreground">{brandingLoading ? "..." : organizationName}</h1>
            </div>
          </div>

          <div className="h-11 w-11 rounded-md bg-green-100 text-green-700 flex items-center justify-center"><CheckCircle className="h-6 w-6" /></div>

          <div>
            <CardTitle>{t("employeeSignup.title")}</CardTitle>
            <CardDescription>{translateWithParams(t, "employeeSignup.subtitle", { org: organizationName, role: roleLabel })}</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role + Team info card */}
            <div className="rounded-md border border-green-200 bg-green-50 p-4 space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase text-green-700">{t("employeeSignup.roleLabel")}</div>
                <div className="mt-1 text-lg font-semibold text-green-900">{roleLabel}</div>
              </div>
              {invitation.teamName && (
                <div>
                  <div className="text-xs font-semibold uppercase text-green-700">{t("employeeSignup.teamLabel")}</div>
                  <div className={cn("mt-1 flex items-center gap-2", isRtl && "flex-row-reverse justify-end")}>
                    <Users className="h-4 w-4 text-green-700" />
                    <Badge className="bg-green-100 text-green-800 border-green-300 text-sm font-semibold">{invitation.teamName}</Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="employee-email">{t("employeeSignup.emailLabel")}</Label>
              <Input
                id="employee-email"
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                placeholder={t("employeeSignup.emailPlaceholder")}
                required
                disabled={signupMutation.isPending || Boolean(invitation.email)}
                className={invitation.email ? "bg-muted" : undefined}
              />
              {invitation.email && <p className="text-xs text-muted-foreground">{t("employeeSignup.emailLocked")}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="employee-password">{t("employeeSignup.passwordLabel")}</Label>
              <div className="relative">
                <Input id="employee-password" type={showPassword ? "text" : "password"} value={formData.password} onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))} required disabled={signupMutation.isPending} />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} className={cn("absolute top-1/2 -translate-y-1/2 text-xs text-muted-foreground", isRtl ? "left-3" : "right-3")}>
                  {showPassword ? t("employeeSignup.passwordHide") : t("employeeSignup.passwordShow")}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">{t("employeeSignup.passwordHint")}</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="employee-confirm-password">{t("employeeSignup.confirmLabel")}</Label>
              <div className="relative">
                <Input id="employee-confirm-password" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))} required disabled={signupMutation.isPending} />
                <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} className={cn("absolute top-1/2 -translate-y-1/2 text-xs text-muted-foreground", isRtl ? "left-3" : "right-3")}>
                  {showConfirmPassword ? t("employeeSignup.passwordHide") : t("employeeSignup.passwordShow")}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
              {signupMutation.isPending ? t("employeeSignup.submitting") : t("employeeSignup.submit")}
            </Button>
            <p className="text-center text-xs text-muted-foreground">{t("employeeSignup.footerNote")}</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
