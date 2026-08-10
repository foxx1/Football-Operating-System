import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  Users,
  Shield,
  UserCheck,
  Calendar,
  ClipboardCheck,
  Trophy,
  Wallet,
  FileText,
  Settings,
  ArrowUpRight,
  UserPlus,
  Activity,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth, getRoleDisplayName } from "@/lib/auth";
import { useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";
import type { Player, Team, TrainingSession } from "@shared/schema";

function getGreetingPeriod(hour: number) {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function getGreeting(period: string, name: string, isRtl: boolean): string {
  if (isRtl) {
    if (period === "morning") return `صباح الخير، ${name}`;
    if (period === "afternoon") return `مساء الخير، ${name}`;
    return `مساء النور، ${name}`;
  }
  if (period === "morning") return `Good morning, ${name}`;
  if (period === "afternoon") return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

export default function AdminDashboard() {
  const { organizationName } = useSettings();
  const { user } = useAuth();
  const { t, isRtl, locale } = useI18n();
  const dateLocale = locale === "ar" ? ar : enUS;

  const { data: stats } = useQuery<{
    totalPlayers: number;
    activeTeams: number;
    attendanceRate: number;
    upcomingSessions: TrainingSession[];
  }>({ queryKey: ["/api/dashboard/stats"] });

  const { data: teams = [] } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const { data: players = [] } = useQuery<Player[]>({ queryKey: ["/api/players"] });

  if (!user) return null;

  const roleName = getRoleDisplayName(user.role);
  const greetingPeriod = getGreetingPeriod(new Date().getHours());
  const greeting = getGreeting(greetingPeriod, user.firstName, isRtl);

  // Real data: 3 most recently added players
  const recentPlayers = [...players]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Real data: first 5 squad members for the overview column
  const squadSample = players.slice(0, 5);

  // Real data: upcoming training sessions
  const today = new Date().toISOString().split("T")[0];
  const upcomingSessions = (stats?.upcomingSessions ?? [])
    .filter((s) => s.date >= today)
    .slice(0, 3);

  const statsCards = [
    {
      titleKey: "dashboard.totalPlayers",
      value: stats?.totalPlayers ?? 0,
      changeKey: "dashboard.playersChange",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/players",
    },
    {
      titleKey: "dashboard.activeTeams",
      value: stats?.activeTeams ?? 0,
      changeKey: "dashboard.teamSubtitle",
      icon: Shield,
      color: "text-emerald-700 dark:text-emerald-300",
      bgColor: "bg-emerald-100/80 dark:bg-emerald-900/20",
      link: "/teams",
    },
    {
      titleKey: "dashboard.attendanceRate",
      value: `${stats?.attendanceRate ?? 0}%`,
      changeKey: "dashboard.attendanceChange",
      icon: TrendingUp,
      color: "text-cyan-800 dark:text-cyan-300",
      bgColor: "bg-cyan-100/80 dark:bg-cyan-900/20",
      link: "/training/attendance",
    },
  ];

  const quickActions = [
    {
      titleKey: "admin.quickAction.addPlayer",
      descKey: "admin.quickAction.addPlayerDesc",
      icon: UserPlus,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/players",
    },
    {
      titleKey: "admin.quickAction.training",
      descKey: "admin.quickAction.trainingDesc",
      icon: Calendar,
      color: "text-emerald-700 dark:text-emerald-300",
      bgColor: "bg-emerald-100/80 dark:bg-emerald-900/20",
      link: "/training",
    },
    {
      titleKey: "admin.quickAction.staff",
      descKey: "admin.quickAction.staffDesc",
      icon: UserCheck,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-100/80 dark:bg-violet-900/20",
      link: "/staff",
    },
    {
      titleKey: "admin.quickAction.reports",
      descKey: "admin.quickAction.reportsDesc",
      icon: FileText,
      color: "text-rose-700 dark:text-rose-300",
      bgColor: "bg-rose-100/80 dark:bg-rose-900/20",
      link: "/reports",
    },
  ];

  const sections = [
    { titleKey: "admin.players", descKey: "admin.playersDesc", icon: Users, link: "/players", color: "text-primary", bgColor: "bg-primary/10" },
    { titleKey: "admin.squads", descKey: "admin.squadsDesc", icon: Shield, link: "/teams", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100/80 dark:bg-blue-900/20" },
    { titleKey: "admin.staff", descKey: "admin.staffDesc", icon: UserCheck, link: "/staff", color: "text-violet-600 dark:text-violet-400", bgColor: "bg-violet-100/80 dark:bg-violet-900/20" },
    { titleKey: "admin.training", descKey: "admin.trainingDesc", icon: Calendar, link: "/training", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100/80 dark:bg-emerald-900/20" },
    { titleKey: "admin.attendance", descKey: "admin.attendanceDesc", icon: ClipboardCheck, link: "/training/attendance", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100/80 dark:bg-amber-900/20" },
    { titleKey: "admin.matches", descKey: "admin.matchesDesc", icon: Trophy, link: "/matches", color: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-100/80 dark:bg-rose-900/20" },
    { titleKey: "admin.budgets", descKey: "admin.budgetsDesc", icon: Wallet, link: "/monthly-budgets", color: "text-teal-600 dark:text-teal-400", bgColor: "bg-teal-100/80 dark:bg-teal-900/20" },
    { titleKey: "admin.reports", descKey: "admin.reportsDesc", icon: FileText, link: "/reports", color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-100/80 dark:bg-orange-900/20" },
    { titleKey: "admin.settings", descKey: "admin.settingsDesc", icon: Settings, link: "/settings", color: "text-slate-600 dark:text-slate-400", bgColor: "bg-slate-100/80 dark:bg-slate-900/20" },
  ];

  return (
    <div className="mx-auto max-w-[1480px] space-y-7 p-5 sm:p-6 xl:p-8">

      {/* ── Hero banner ── */}
      <section className="relative overflow-hidden rounded-lg border border-border/70 bg-card p-6 shadow-[0_24px_70px_-52px_hsl(var(--foreground)/0.75)] md:p-8">
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 hidden w-[44%] bg-[linear-gradient(120deg,transparent,hsl(var(--primary)/0.13)),repeating-linear-gradient(90deg,hsl(var(--primary)/0.1)_0_1px,transparent_1px_54px),repeating-linear-gradient(0deg,hsl(var(--primary)/0.08)_0_1px,transparent_1px_42px)] md:block",
            isRtl ? "left-0" : "right-0",
          )}
        />
        <div className="relative max-w-3xl">
          <Badge variant="secondary" className="mb-4 rounded-sm">
            {t("nav.adminWorkspace")} · {roleName}
          </Badge>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
            {greeting}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            {t("admin.subtitle")} — {organizationName}
          </p>
        </div>
      </section>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statsCards.map(({ titleKey, value, changeKey, icon: Icon, color, bgColor, link }) => (
          <Link key={link} href={link}>
            <Card className="group cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-muted-foreground">{t(titleKey)}</p>
                    <p className="mt-2 font-mono text-3xl font-semibold text-foreground">{value}</p>
                    <p className="mt-2 text-sm font-medium text-muted-foreground">
                      <TrendingUp className="me-1 inline h-3 w-3 text-primary" />
                      {t(changeKey)}
                    </p>
                  </div>
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-md transition-transform duration-200 group-hover:-translate-y-0.5", bgColor)}>
                    <Icon className={cn("h-5 w-5", color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Section nav cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(({ titleKey, descKey, icon: Icon, link, color, bgColor }) => (
          <Link key={link} href={link}>
            <Card className="group cursor-pointer border border-border/60 bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md">
              <CardHeader className="flex flex-row items-start gap-4 pb-3">
                <div className={cn("rounded-lg p-2.5", bgColor)}>
                  <Icon className={cn("h-5 w-5", color)} />
                </div>
                <div className="flex-1 space-y-0.5">
                  <CardTitle className="text-base font-semibold leading-snug">{t(titleKey)}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{t(descKey)}</CardDescription>
                </div>
                <ArrowUpRight
                  className={cn(
                    "h-4 w-4 flex-shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:text-primary",
                    isRtl && "rotate-180",
                  )}
                />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Bottom detail grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Left column — recent players + upcoming sessions */}
        <div className="space-y-6 lg:col-span-2">

          {/* Recent players */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{t("admin.recentPlayers")}</CardTitle>
                  <CardDescription>{t("admin.recentPlayersDesc")}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary" asChild>
                  <Link href="/players">
                    {t("dashboard.viewAll")} <ArrowUpRight className={cn("ms-1 h-4 w-4", isRtl && "rotate-180")} />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentPlayers.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("admin.noPlayers")}</p>
              ) : (
                <div className="space-y-3">
                  {recentPlayers.map((player) => {
                    const displayName = isRtl && player.firstNameAr
                      ? `${player.firstNameAr} ${player.lastNameAr ?? ""}`.trim()
                      : `${player.firstName} ${player.lastName}`;
                    const initials = `${player.firstName[0]}${player.lastName[0]}`;
                    const addedAt = player.createdAt ? new Date(player.createdAt) : null;
                    return (
                      <Link key={player.id} href="/players">
                        <div className="flex cursor-pointer items-start gap-4 rounded-md p-3 transition-colors hover:bg-muted/55">
                          <Avatar className="h-10 w-10 rounded-md">
                            {player.profilePicture && <AvatarImage src={player.profilePicture} />}
                            <AvatarFallback className="rounded-md text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-foreground">{displayName}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {t(`position.${player.position}`)} · {t("admin.joinedSquad")}
                              {addedAt && ` · ${format(addedAt, "d MMM yyyy", { locale: dateLocale })}`}
                            </p>
                          </div>
                          <Badge variant="secondary" className="rounded-sm text-xs">
                            {player.shirtNumber ? `${t("admin.shirtNo")} ${player.shirtNumber}` : t(`position.${player.position}`)}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming training sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{t("admin.upcomingTraining")}</CardTitle>
                  <CardDescription>{t("admin.upcomingTrainingDesc")}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary" asChild>
                  <Link href="/training">
                    {t("dashboard.viewAll")} <ArrowUpRight className={cn("ms-1 h-4 w-4", isRtl && "rotate-180")} />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("admin.noTrainingSessions")}</p>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => {
                    const teamName = teams.find((tm) => tm.id === session.teamId)?.name;
                    const scheduledAt = new Date(`${session.date}T${session.startTime}`);
                    return (
                      <Link key={session.id} href={`/training/attendance?session=${session.id}`}>
                        <div className="flex cursor-pointer items-center gap-4 rounded-md bg-muted/45 p-4 transition-all hover:bg-muted/80">
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                            <Activity className="text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{session.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {teamName} · {session.duration} {locale === "ar" ? "دقيقة" : "min"} · {session.location}
                            </p>
                          </div>
                          <div className={cn("font-mono", isRtl ? "text-start" : "text-end")}>
                            <p className="text-sm font-medium text-foreground">
                              {format(scheduledAt, "EEE, MMM d", { locale: dateLocale })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(scheduledAt, "h:mm a", { locale: dateLocale })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column — quick actions + squad overview */}
        <div className="space-y-6">

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.quickActions")}</CardTitle>
              <CardDescription>{t("dashboard.quickActionsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {quickActions.map(({ titleKey, descKey, icon: Icon, color, bgColor, link }) => (
                  <Button
                    key={link}
                    variant="ghost"
                    className="h-auto w-full justify-start p-3 hover:bg-muted"
                    asChild
                  >
                    <Link href={link}>
                      <div className={cn("me-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md", bgColor)}>
                        <Icon className={cn("h-5 w-5", color)} />
                      </div>
                      <div className="text-start">
                        <p className="font-medium text-foreground">{t(titleKey)}</p>
                        <p className="text-sm text-muted-foreground">{t(descKey)}</p>
                      </div>
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Squad overview — real players, no fake ratings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{t("admin.squadOverview")}</CardTitle>
                  <CardDescription>{t("admin.squadOverviewDesc")}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary" asChild>
                  <Link href="/players">
                    {t("dashboard.viewAll")} <ArrowUpRight className={cn("ms-1 h-4 w-4", isRtl && "rotate-180")} />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {squadSample.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("admin.noSquadData")}</p>
              ) : (
                <div className="space-y-2">
                  {squadSample.map((player) => {
                    const displayName = isRtl && player.firstNameAr
                      ? `${player.firstNameAr} ${player.lastNameAr ?? ""}`.trim()
                      : `${player.firstName} ${player.lastName}`;
                    const initials = `${player.firstName[0]}${player.lastName[0]}`;
                    return (
                      <Link key={player.id} href="/players">
                        <div className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/55">
                          <Avatar className="h-8 w-8 rounded-md">
                            {player.profilePicture && <AvatarImage src={player.profilePicture} />}
                            <AvatarFallback className="rounded-md text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-foreground">{displayName}</p>
                            <p className="text-xs text-muted-foreground">{t(`position.${player.position}`)}</p>
                          </div>
                          {player.shirtNumber && (
                            <span className="font-mono text-xs font-semibold text-muted-foreground">
                              #{player.shirtNumber}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
