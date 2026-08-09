import { FormEvent, useEffect, useState } from "react";
import { Link, Redirect } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Medal,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isTechnicalStaffRole } from "@shared/schema";
import { cn } from "@/lib/utils";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NationalitySelect } from "@/components/ui/nationality-select";
import { Progress } from "@/components/ui/progress";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import type { Player, RegistrationReminder, Team, TrainingSession } from "@shared/schema";

interface PlayerProfileResponse {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  player: Player | null;
  isComplete: boolean;
}

interface PlayerProfileFormState {
  firstName: string;
  lastName: string;
  firstNameAr: string;
  lastNameAr: string;
  email: string;
  phoneNumber: string;
  nationality: string;
  dateOfBirth: string;
  idNumber: string;
  profilePicture: string | null;
}

function PlayerRegistrationPopup({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  const { toast } = useToast();
  const { t } = useI18n();
  const { data: profile, isLoading } = useQuery<PlayerProfileResponse>({
    queryKey: ["/api/player/profile"],
    enabled: user?.role === "player",
  });
  const { data: reminders = [] } = useQuery<RegistrationReminder[]>({
    queryKey: ["/api/registration-reminders/me"],
    enabled: user?.role === "player",
    retry: false,
  });
  const [formData, setFormData] = useState<PlayerProfileFormState>({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    firstNameAr: "",
    lastNameAr: "",
    email: user?.email ?? "",
    phoneNumber: "",
    nationality: "",
    dateOfBirth: "",
    idNumber: "",
    profilePicture: null,
  });

  useEffect(() => {
    if (!profile) return;

    setFormData({
      firstName: profile.player?.firstName || profile.user.firstName || "",
      lastName: profile.player?.lastName || profile.user.lastName || "",
      firstNameAr: profile.player?.firstNameAr || "",
      lastNameAr: profile.player?.lastNameAr || "",
      email: profile.player?.email || profile.user.email || "",
      phoneNumber: profile.player?.phoneNumber || "",
      nationality: profile.player?.nationality || "",
      dateOfBirth: profile.player?.dateOfBirth || "",
      idNumber: profile.player?.idNumber || "",
      profilePicture: profile.player?.profilePicture || null,
    });
  }, [profile]);

  const saveProfileMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/player/profile", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/registration-status"] });
      toast({
        title: t("playerDashboard.registration.toastSuccessTitle"),
        description: t("playerDashboard.registration.toastSuccessDescription"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("playerDashboard.registration.toastErrorTitle"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateField = (field: keyof PlayerProfileFormState, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const updateProfilePicture = (filePath: string | null) => {
    setFormData((current) => ({ ...current, profilePicture: filePath }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveProfileMutation.mutate();
  };

  const open = Boolean(user?.role === "player" && !isLoading && profile && !profile.isComplete);

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        className="max-h-[92vh] max-w-2xl overflow-y-auto"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("playerDashboard.registration.title")}</DialogTitle>
          <DialogDescription>
            {t("playerDashboard.registration.description")}
          </DialogDescription>
        </DialogHeader>
        {reminders[0] && (
          <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-semibold">{t("playerDashboard.registration.reminderTitle")}</p>
              <p className="mt-1 text-sm leading-6 text-amber-900">{reminders[0].message}</p>
            </div>
          </div>
        )}
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <FileUpload
            label={t("playerDashboard.registration.profilePicture")}
            value={formData.profilePicture || undefined}
            onChange={updateProfilePicture}
            accept="image/*"
            description={t("playerDashboard.registration.profilePictureDescription")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="player-first-name">{t("playerDashboard.registration.firstName")}</Label>
              <Input id="player-first-name" value={formData.firstName} onChange={(event) => updateField("firstName", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="player-last-name">{t("playerDashboard.registration.lastName")}</Label>
              <Input id="player-last-name" placeholder={t("playerDashboard.registration.lastNamePlaceholder")} value={formData.lastName} onChange={(event) => updateField("lastName", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="player-first-name-ar">{t("playerDashboard.registration.firstNameAr")}</Label>
              <Input id="player-first-name-ar" dir="rtl" placeholder={t("playerDashboard.registration.firstNameArPlaceholder")} value={formData.firstNameAr} onChange={(event) => updateField("firstNameAr", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="player-last-name-ar">{t("playerDashboard.registration.lastNameAr")}</Label>
              <Input id="player-last-name-ar" dir="rtl" placeholder={t("playerDashboard.registration.lastNameArPlaceholder")} value={formData.lastNameAr} onChange={(event) => updateField("lastNameAr", event.target.value)} />
              <p className="text-xs text-muted-foreground">{t("playerDashboard.registration.arabicNameHint")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="player-email">{t("playerDashboard.registration.email")}</Label>
              <Input id="player-email" type="email" value={formData.email} onChange={(event) => updateField("email", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="player-phone">{t("playerDashboard.registration.phone")}</Label>
              <Input id="player-phone" value={formData.phoneNumber} onChange={(event) => updateField("phoneNumber", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="player-nationality">{t("playerDashboard.registration.nationality")}</Label>
              <NationalitySelect
                value={formData.nationality}
                onChange={(value) => updateField("nationality", value)}
                placeholder={t("playerDashboard.registration.selectNationality")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="player-date-of-birth">{t("playerDashboard.registration.dateOfBirth")}</Label>
              <Input id="player-date-of-birth" type="date" value={formData.dateOfBirth} onChange={(event) => updateField("dateOfBirth", event.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="player-national-id">{t("playerDashboard.registration.nationalId")}</Label>
              <Input id="player-national-id" value={formData.idNumber} onChange={(event) => updateField("idNumber", event.target.value)} required />
            </div>
          </div>
          <Button type="submit" className="w-full sm:w-auto sm:justify-self-end" disabled={saveProfileMutation.isPending}>
            {saveProfileMutation.isPending ? t("playerDashboard.registration.saving") : t("playerDashboard.registration.submit")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PlayerDashboard() {
  const { user } = useAuth();
  const { isRtl, t, locale } = useI18n();
  const dateLocale = locale === "ar" ? ar : enUS;
  const { data: profile } = useQuery<PlayerProfileResponse>({
    queryKey: ["/api/player/profile"],
    enabled: user?.role === "player",
  });
  const { data: myTeams = [] } = useQuery<Team[]>({
    queryKey: ["/api/dashboard/my-teams"],
    enabled: user?.role === "player",
  });
  const { data: allSessions = [] } = useQuery<TrainingSession[]>({
    queryKey: ["/api/training-sessions"],
    enabled: user?.role === "player",
  });

  if (!user) {
    return null;
  }

  if (user.role !== "player") {
    return <Redirect to={isTechnicalStaffRole(user.role) ? "/technical-staff" : "/"} />;
  }

  const firstName = (isRtl && profile?.player?.firstNameAr) || user.firstName || "Player";

  const teamIds = myTeams.map((team) => team.id);
  const today = new Date().toISOString().split("T")[0];
  const upcomingSessions = allSessions
    .filter((session) => teamIds.includes(session.teamId) && session.date >= today)
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))
    .slice(0, 3);
  const nextSession = upcomingSessions[0] ?? null;

  const schedule = upcomingSessions.map((session) => {
    const scheduledAt = new Date(`${session.date}T${session.startTime}`);
    return {
      day: format(scheduledAt, "EEE, MMM d", { locale: dateLocale }),
      time: format(scheduledAt, "h:mm a", { locale: dateLocale }),
      title: session.title,
      place: session.location,
      type: t("playerDashboard.schedule.typeTraining"),
    };
  });

  return (
    <div className="mx-auto max-w-[1480px] space-y-6 p-5 sm:p-6 xl:p-8">
      <PlayerRegistrationPopup user={user} />
      <section className="relative overflow-hidden rounded-lg border border-border/70 bg-card/90 p-6 shadow-[0_24px_70px_-52px_hsl(var(--foreground)/0.7)] md:p-8">
        <div
          className={cn(
            "absolute inset-y-0 hidden w-1/2 md:block",
            isRtl
              ? "left-0 bg-[radial-gradient(circle_at_25%_20%,hsl(var(--primary)/0.22),transparent_18rem),repeating-linear-gradient(90deg,hsl(var(--primary)/0.1)_0_1px,transparent_1px_58px)]"
              : "right-0 bg-[radial-gradient(circle_at_75%_20%,hsl(var(--primary)/0.22),transparent_18rem),repeating-linear-gradient(90deg,hsl(var(--primary)/0.1)_0_1px,transparent_1px_58px)]",
          )}
        />
        <div className="relative grid gap-7 lg:grid-cols-[1fr_380px] lg:items-end">
          <div>
            <Badge className="mb-4 rounded-sm bg-primary/10 text-primary hover:bg-primary/15">{t("playerDashboard.badge")}</Badge>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1] tracking-tight text-balance md:text-5xl">
              {translateWithParams(t, "playerDashboard.heroTitle", { name: firstName })}
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
              {t("playerDashboard.heroDescription")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild><Link href="/training">{t("playerDashboard.respondToTraining")} <ArrowUpRight className={cn("h-4 w-4", isRtl ? "mr-2" : "ml-2")} /></Link></Button>
              <Button variant="outline" asChild><Link href="/analytics">{t("playerDashboard.viewAnalytics")}</Link></Button>
            </div>
          </div>
          <div className="rounded-md border border-border/60 bg-background/75 p-4 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("playerDashboard.nextUp")}</p>
                <h2 className="mt-2 text-xl font-semibold">{nextSession?.title ?? t("playerDashboard.nextSession.none")}</h2>
              </div>
              <div className="rounded-md bg-primary/10 p-2.5 text-primary"><Zap className="h-5 w-5" /></div>
            </div>
            {nextSession && (
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-sm bg-card p-3">
                  <Clock3 className="mb-2 h-4 w-4 text-primary" />
                  <p className="font-semibold">{format(new Date(`${nextSession.date}T${nextSession.startTime}`), "EEE, MMM d · h:mm a", { locale: dateLocale })}</p>
                  <p className="text-muted-foreground">{translateWithParams(t, "playerDashboard.nextSession.durationMinutes", { duration: String(nextSession.duration) })}</p>
                </div>
                <div className="rounded-sm bg-card p-3">
                  <MapPin className="mb-2 h-4 w-4 text-primary" />
                  <p className="font-semibold">{nextSession.location}</p>
                  <p className="text-muted-foreground">{nextSession.sessionType}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t("playerDashboard.stats.attendance"), value: "94%", note: t("playerDashboard.stats.attendanceNote"), icon: CheckCircle2 },
          { label: t("playerDashboard.stats.trainingLoad"), value: "82", note: t("playerDashboard.stats.trainingLoadNote"), icon: Activity },
          { label: t("playerDashboard.stats.matchRating"), value: "8.1", note: t("playerDashboard.stats.matchRatingNote"), icon: Target },
          { label: t("playerDashboard.stats.achievements"), value: "12", note: t("playerDashboard.stats.achievementsNote"), icon: Medal },
        ].map(({ label, value, note, icon: Icon }) => (
          <Card key={label} className="stats-card">
            <CardContent className="flex items-start justify-between gap-4 p-0">
              <div><p className="text-sm font-semibold text-muted-foreground">{label}</p><p className="mt-2 font-mono text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>
              <div className="rounded-md bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div><CardTitle>{t("playerDashboard.schedule.title")}</CardTitle><CardDescription>{t("playerDashboard.schedule.description")}</CardDescription></div>
            <CalendarDays className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3">
            {schedule.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("playerDashboard.schedule.empty")}</p>
            )}
            {schedule.map((item, index) => (
              <div key={upcomingSessions[index].id} className="grid gap-3 rounded-md bg-muted/45 p-4 transition-colors hover:bg-muted/75 sm:grid-cols-[90px_1fr_auto] sm:items-center">
                <div><p className="text-sm font-semibold text-primary">{item.day}</p><p className="font-mono text-xs text-muted-foreground">{item.time}</p></div>
                <div><p className="font-semibold">{item.title}</p><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{item.place}</p></div>
                <Badge variant="secondary" className="w-fit rounded-sm">{item.type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t("playerDashboard.readiness.title")}</CardTitle><CardDescription>{t("playerDashboard.readiness.description")}</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              {[[t("playerDashboard.readiness.physical"), 86], [t("playerDashboard.readiness.recovery"), 74], [t("playerDashboard.readiness.trainingFocus"), 92]].map(([label, value]) => (
                <div key={label as string}><div className="mb-2 flex justify-between text-sm"><span className="text-muted-foreground">{label}</span><span className="font-mono font-semibold">{value}%</span></div><Progress value={value as number} className="h-2" /></div>
              ))}
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardContent className="relative p-6">
              <Trophy className={cn("absolute -bottom-5 h-28 w-28 text-primary/10", isRtl ? "-left-3" : "-right-3")} />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("playerDashboard.achievement.label")}</p>
              <h3 className="mt-3 text-xl font-semibold">{t("playerDashboard.achievement.title")}</h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{t("playerDashboard.achievement.description")}</p>
              <Progress value={80} className="mt-5 h-2" />
              <Button variant="ghost" className="mt-4 px-0 text-primary" asChild><Link href="/achievements">{t("playerDashboard.achievement.seeAchievements")} <ArrowUpRight className={cn("h-4 w-4", isRtl ? "mr-2" : "ml-2")} /></Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
