import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, BriefcaseBusiness } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NationalitySelect } from "@/components/ui/nationality-select";
import { useToast } from "@/hooks/use-toast";
import { getRoleDisplayName, type AuthUser } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { employeeRoles, type RegistrationReminder, type Staff } from "@shared/schema";

type EmploymentType = "full_time" | "part_time" | "contract" | "volunteer";

interface StaffProfileResponse {
  user: Pick<AuthUser, "firstName" | "lastName" | "email" | "role">;
  staff: Staff | null;
  isComplete: boolean;
}

interface StaffProfileFormState {
  firstName: string;
  lastName: string;
  firstNameAr: string;
  lastNameAr: string;
  email: string;
  phoneNumber: string;
  nationality: string;
  idNumber: string;
  employmentType: EmploymentType;
  startDate: string;
  profilePicture: string | null;
}

function isEmployeeRole(role: string | undefined) {
  return Boolean(role && (employeeRoles as readonly string[]).includes(role));
}

export function StaffRegistrationPopup({ user }: { user: AuthUser }) {
  const { toast } = useToast();
  const isEmployee = isEmployeeRole(user.role);
  const { data: profile, isLoading } = useQuery<StaffProfileResponse>({
    queryKey: ["/api/staff/profile"],
    enabled: isEmployee,
    retry: false,
  });
  const { data: reminders = [] } = useQuery<RegistrationReminder[]>({
    queryKey: ["/api/registration-reminders/me"],
    enabled: isEmployee,
    retry: false,
  });
  const [formData, setFormData] = useState<StaffProfileFormState>({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    firstNameAr: "",
    lastNameAr: "",
    email: user.email || "",
    phoneNumber: "",
    nationality: "",
    idNumber: "",
    employmentType: "full_time",
    startDate: new Date().toISOString().slice(0, 10),
    profilePicture: null,
  });

  useEffect(() => {
    if (!profile) return;
    setFormData({
      firstName: profile.staff?.firstName || profile.user.firstName || "",
      lastName: profile.staff?.lastName || profile.user.lastName || "",
      firstNameAr: profile.staff?.firstNameAr || "",
      lastNameAr: profile.staff?.lastNameAr || "",
      email: profile.staff?.email || profile.user.email || "",
      phoneNumber: profile.staff?.phoneNumber || "",
      nationality: profile.staff?.nationality || "",
      idNumber: profile.staff?.idNumber || "",
      employmentType: (profile.staff?.employmentType as EmploymentType) || "full_time",
      startDate: profile.staff?.startDate || new Date().toISOString().slice(0, 10),
      profilePicture: profile.staff?.profilePicture || null,
    });
  }, [profile]);

  const saveProfileMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/staff/profile", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/registration-status"] });
      toast({
        title: "Registration completed",
        description: "Your employee profile has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateField = <Key extends keyof StaffProfileFormState>(field: Key, value: StaffProfileFormState[Key]) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveProfileMutation.mutate();
  };

  const open = Boolean(isEmployee && !isLoading && profile && !profile.isComplete);

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        className="max-h-[92vh] max-w-2xl overflow-y-auto"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <Badge variant="secondary" className="rounded-sm">{getRoleDisplayName(user.role)}</Badge>
          </div>
          <DialogTitle>Complete staff registration</DialogTitle>
          <DialogDescription>
            Add your official employee details before entering the staff workspace. Your assigned role is locked to your invitation.
          </DialogDescription>
        </DialogHeader>

        {reminders[0] && (
          <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-semibold">Registration reminder from your administrator</p>
              <p className="mt-1 text-sm leading-6 text-amber-900">{reminders[0].message}</p>
            </div>
          </div>
        )}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <FileUpload
            label="Profile Picture"
            value={formData.profilePicture || undefined}
            onChange={(value) => updateField("profilePicture", value)}
            accept="image/*"
            description="Upload your employee profile photo"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staff-first-name">First Name</Label>
              <Input id="staff-first-name" value={formData.firstName} onChange={(event) => updateField("firstName", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-last-name">Last Name</Label>
              <Input id="staff-last-name" placeholder="Last Name or Family Name" value={formData.lastName} onChange={(event) => updateField("lastName", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-first-name-ar">First Name (Arabic)</Label>
              <Input id="staff-first-name-ar" dir="rtl" placeholder="الاسم الأول" value={formData.firstNameAr} onChange={(event) => updateField("firstNameAr", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-last-name-ar">Last Name (Arabic)</Label>
              <Input id="staff-last-name-ar" dir="rtl" placeholder="اسم العائلة" value={formData.lastNameAr} onChange={(event) => updateField("lastNameAr", event.target.value)} />
              <p className="text-xs text-muted-foreground">Optional — shown on the dashboard when Arabic is selected</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email</Label>
              <Input id="staff-email" type="email" value={formData.email} onChange={(event) => updateField("email", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-phone">Phone Number</Label>
              <Input id="staff-phone" value={formData.phoneNumber} onChange={(event) => updateField("phoneNumber", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-nationality">Nationality</Label>
              <NationalitySelect
                value={formData.nationality}
                onChange={(value) => updateField("nationality", value)}
                placeholder="Select nationality"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-id-number">National ID Number</Label>
              <Input id="staff-id-number" value={formData.idNumber} onChange={(event) => updateField("idNumber", event.target.value)} required />
            </div>
          </div>

          <Button type="submit" className="w-full sm:w-auto sm:justify-self-end" disabled={saveProfileMutation.isPending}>
            {saveProfileMutation.isPending ? "Saving..." : "Complete Registration"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
