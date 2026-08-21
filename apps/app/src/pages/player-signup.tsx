import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useClubBranding } from "@/hooks/use-system-settings";
import { useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";
import { login } from "@/lib/auth";
import { AlertCircle, CheckCircle, ShieldCheck } from "lucide-react";

interface InvitationDetails {
  id: number;
  email: string;
  teamName: string;
  teamId: number;
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

export default function PlayerSignup() {
  const [, params] = useRoute("/invite/:token");
  const [, navigate] = useLocation();
  const token = params?.token ?? "";
  const { toast } = useToast();
  const { isRtl } = useI18n();

  // Fetch invitation details
  const { data: invitation, isLoading: invitationLoading, error: invitationError } = useQuery({
    queryKey: [`/api/invitations/${token}`],
    queryFn: async () => {
      if (!token) return null;
      const response = await fetch(`/api/invitations/${token}`);
      if (!response.ok) {
        throw new Error("Invalid or expired invitation");
      }
      return response.json() as Promise<InvitationDetails>;
    },
    enabled: !!token,
  });

  // Fetch club branding from the same admin settings used by the main app.
  const { organizationName, logoUrl, isLoading: brandingLoading } = useClubBranding("Our Club");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Pre-fill email when invitation is fetched
  useEffect(() => {
    if (invitation?.email) {
      setFormData((prev) => ({ ...prev, email: invitation.email }));
    }
  }, [invitation?.email]);

  // Generate username and name from email
  const generateUserDataFromEmail = (email: string) => {
    const [localPart] = email.split("@");
    const nameParts = localPart
      .split(/[._-]/)
      .filter((p) => p)
      .slice(0, 2);
    const firstName = nameParts[0]?.charAt(0).toUpperCase() + nameParts[0]?.slice(1) || "Player";
    const lastName = nameParts[1]?.charAt(0).toUpperCase() + nameParts[1]?.slice(1) || "Last Name or Surname";
    const username = localPart.toLowerCase().replace(/[._-]/g, "");

    return { firstName, lastName, username };
  };

  // Sign up mutation
  const signupMutation = useMutation({
    mutationFn: async (payload: SignupPayload) => {
      const response = await fetch("/api/auth/signup-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Signup failed");
      }

      return response.json();
    },
    onSuccess: async (result: { user: any }) => {
      toast({
        title: "Success!",
        description: "Your account has been created. Redirecting to your player dashboard...",
        variant: "default",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

      try {
        await login(formData.email, formData.password);
      } catch {
        navigate("/login");
        return;
      }

      navigate("/player-dashboard");
    },
    onError: (error) => {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Please check your information and try again",
        variant: "destructive",
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.email.trim()) return "Email is required";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 6) return "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    // Generate user data from email
    const { firstName, lastName, username } = generateUserDataFromEmail(formData.email);

    signupMutation.mutate({
      token,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      firstName,
      lastName,
      username,
    });
  };

  if (invitationLoading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">Loading invitation details...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitationError || !invitation) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-6">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <CardTitle className="text-red-900">Invalid Invitation</CardTitle>
                <CardDescription className="text-red-700">
                  {invitation?.isExpired
                    ? "This invitation link has expired. Please request a new one from your team."
                    : invitation?.isUsed
                      ? "This invitation link has already been used."
                      : "This invitation link is invalid or not found. Please check the link and try again."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <a href="/login">Go to Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background grid place-items-center p-6 ${isRtl ? "flex-row-reverse" : ""}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3 rounded-md border border-border/70 bg-card/70 p-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${organizationName} logo`}
                className="h-12 w-12 rounded-md bg-secondary/70 object-contain p-1"
              />
            ) : (
              <div className="h-12 w-12 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Club</p>
              <h1 className="truncate text-xl font-extrabold leading-tight text-foreground">
                {brandingLoading ? "Loading club..." : organizationName}
              </h1>
            </div>
          </div>
          <div className="h-11 w-11 rounded-md bg-green-100 text-green-700 flex items-center justify-center">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Complete Your Signup</CardTitle>
            <CardDescription>Join {organizationName} as a player</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Club Info - Read Only */}
            <div className="rounded-md border border-green-200 bg-green-50 p-4">
              <div className="text-xs font-semibold text-green-700 uppercase mb-1">Club Name</div>
              <div className="text-lg font-semibold text-green-900">
                {brandingLoading ? "Loading..." : organizationName}
              </div>
              <div className="mt-3 text-xs font-semibold text-green-700 uppercase mb-1">Invited Team</div>
              <div className="text-sm font-medium text-green-900">
                {invitation.teamName}
              </div>
            </div>

            {/* Email Field - Pre-filled */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                required
                disabled={signupMutation.isPending}
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Pre-filled from your invitation</p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••"
                  required
                  disabled={signupMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  disabled={signupMutation.isPending}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••"
                  required
                  disabled={signupMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                  disabled={signupMutation.isPending}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
              {signupMutation.isPending ? "Creating Account..." : "Complete Signup"}
            </Button>

            {/* Help Text */}
            <p className="text-xs text-center text-muted-foreground">
              By signing up, you agree to join {invitation.teamName} as a player
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

