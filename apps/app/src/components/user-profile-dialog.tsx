import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/contexts/I18nContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getRoleDisplayName, type AuthUser } from "@/lib/auth";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AuthUser;
}

interface ProfileFormState {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  avatar: string | null;
}

export function UserProfileDialog({ open, onOpenChange, user }: UserProfileDialogProps) {
  const { t, isRtl } = useI18n();
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProfileFormState>({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email || "",
    phoneNumber: user.phoneNumber || "",
    avatar: user.avatar || null,
  });

  useEffect(() => {
    if (!open) return;
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      avatar: user.avatar || null,
    });
  }, [open, user]);

  const updateField = <Key extends keyof ProfileFormState>(field: Key, value: ProfileFormState[Key]) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const saveMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/auth/me", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: t("profile.dialog.saved.title"),
        description: t("profile.dialog.saved.description"),
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("profile.dialog.error.title"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("profile.dialog.title")}</DialogTitle>
          <DialogDescription>
            {getRoleDisplayName(user.role)} · {t("profile.dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <FileUpload
            label={t("profile.dialog.picture")}
            value={formData.avatar || undefined}
            onChange={(value) => updateField("avatar", value)}
            accept="image/*"
            description={t("profile.dialog.pictureDescription")}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-first-name">{t("profile.dialog.firstName")}</Label>
              <Input
                id="profile-first-name"
                value={formData.firstName}
                onChange={(event) => updateField("firstName", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-last-name">{t("profile.dialog.lastName")}</Label>
              <Input
                id="profile-last-name"
                value={formData.lastName}
                onChange={(event) => updateField("lastName", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="profile-email">{t("profile.dialog.email")}</Label>
              <Input
                id="profile-email"
                type="email"
                value={formData.email}
                onChange={(event) => updateField("email", event.target.value)}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="profile-phone">{t("profile.dialog.phone")}</Label>
              <Input
                id="profile-phone"
                value={formData.phoneNumber}
                onChange={(event) => updateField("phoneNumber", event.target.value)}
                dir={isRtl ? "rtl" : "ltr"}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("profile.dialog.cancel")}
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? t("profile.dialog.saving") : t("profile.dialog.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
