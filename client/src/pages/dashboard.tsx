import { useQuery } from "@tanstack/react-query";
import { useSettings, formatCurrency } from "@/contexts/SettingsContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Shield,
  Calendar,
  TrendingUp,
  Plus,
  UserPlus,
  Swords,
  FileText,
  Activity,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { InteractiveCalendar } from "@/components/dashboard/interactive-calendar";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";
import type { Player, Team, TrainingSession } from "@shared/schema";

export default function Dashboard() {
  const { currency, organizationName } = useSettings();
  const { locale, t, isRtl } = useI18n();
  const dateLocale = locale === "ar" ? ar : enUS;

  const { data: stats, isLoading } = useQuery<{
    totalPlayers: number;
    activeTeams: number;
    attendanceRate: number;
    upcomingSessions: TrainingSession[];
  }>({ queryKey: ["/api/dashboard/stats"] });

  const { data: teams = [] } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const { data: players = [] } = useQuery<Player[]>({ queryKey: ["/api/players"] });

  // Real data: 3 most recently added players
  const recentPlayers = [...players]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // Real data: first 5 players for squad members panel
  const squadSample = players.slice(0, 5);

  // Real data: upcoming sessions
  const today = new Date().toISOString().split("T")[0];
  const upcomingSessions = (stats?.upcomingSessions ?? [])
    .filter((s) => s.date >= today)
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1480px] p-6">
        <div className="mb-8 h-44 animate-pulse rounded-lg bg-muted/70" />
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
      titleKey: "dashboard.monthlyBudget",
      value: formatCurrency(15000, currency),
      changeKey: "dashboard.budgetChange",
      icon: Wallet,
      color: "text-amber-700 dark:text-amber-300",
      bgColor: "bg-amber-100/80 dark:bg-amber-900/20",
      link: "/monthly-budgets",
    },
    {
      titleKey: "dashboard.attendanceRate",
      value: `${stats?.attendanceRate ?? 0}%`,
      changeKey: "dashboard.attendanceChange",
      icon: TrendingUp,
      color: "text-cyan-800 dark:text-cyan-300",
      bgColor: "bg-cyan-100/80 dark:bg-cyan-900/20",
      link: "/training",
    },
  ];

  const quickActions = [
    {
      titleKey: "dashboard.quickAction.scheduleTraining",
      descKey: "dashboard.quickAction.scheduleTrainingDesc",
      icon: Plus,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/training",
    },
    {
      titleKey: "dashboard.quickAction.addPlayer",
      descKey: "dashboard.quickAction.addPlayerDesc",
      icon: UserPlus,
      color: "text-emerald-700 dark:text-emerald-300",
      bgColor: "bg-emerald-100/80 dark:bg-emerald-900/20",
      link: "/players",
    },
    {
      titleKey: "dashboard.quickAction.tacticsBoard",
      descKey: "dashboard.quickAction.tacticsBoardDesc",
      icon: Swords,
      color: "text-amber-700 dark:text-amber-300",
      bgColor: "bg-amber-100/80 dark:bg-amber-900/20",
      link: "/tactical-board",
    },
    {
      titleKey: "dashboard.quickAction.generateReport",
      descKey: "dashboard.quickAction.generateReportDesc",
      icon: FileText,
      color: "text-rose-700 dark:text-rose-300",
      bgColor: "bg-rose-100/80 dark:bg-rose-900/20",
      link: "/reports",
    },
  ];

  return (
    <div className="mx-auto max-w-[1480px] space-y-7 p-5 sm:p-6 xl:p-8">

      {/* ── Hero banner ── */}
      <section className="relative overflow-hidden rounded-lg border border-border/70 bg-card/85 p-6 shadow-[0_24px_70px_-52px_hsl(var(--foreground)/0.7)]">
        <div
          className={cn(
            "absolute inset-y-0 hidden w-1/2 bg-[linear-gradient(115deg,transparent,hsl(var(--primary)/0.14)),repeating-linear-gradient(90deg,hsl(var(--primary)/0.12)_0_1px,transparent_1px_58px),repeating-linear-gradient(0deg,hsl(var(--primary)/0.1)_0_1px,transparent_1px_42px)] md:block",
            isRtl ? "left-0" : "right-0",
          )}
        />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <Badge variant="secondary" className="mb-4 rounded-sm bg-secondary/80 text-secondary-foreground">
              {new Intl.DateTimeFormat(locale === "ar" ? "ar-BH" : "en", {
                weekday: "long",
                month: "short",
                day: "numeric",
              }).format(new Date())} {t("dashboard.commandBriefing")}
            </Badge>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[0.98] tracking-normal text-balance md:text-5xl">
              {translateWithParams(t, "dashboard.title", { organizationName })}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              {t("dashboard.description")}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-md bg-background/70 p-3 backdrop-blur">
            <div className="rounded-sm bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground">{t("dashboard.squad")}</p>
              <p className="font-mono text-2xl font-semibold">{stats?.totalPlayers ?? 0}</p>
            </div>
            <div className="rounded-sm bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground">{t("dashboard.teams")}</p>
              <p className="font-mono text-2xl font-semibold">{stats?.activeTeams ?? 0}</p>
            </div>
            <div className="rounded-sm bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground">{t("dashboard.attendanceShort")}</p>
              <p className="font-mono text-2xl font-semibold">{stats?.attendanceRate ?? 0}%</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map(({ titleKey, value, changeKey, icon: Icon, color, bgColor, link }) => (
          <Link key={link} href={link} data-testid={`stats-card-${titleKey}`}>
            <Card className="stats-card group cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-muted-foreground">{t(titleKey)}</p>
                    <p className="mt-2 truncate font-mono text-3xl font-semibold text-foreground">{value}</p>
                    <p className="mt-2 text-sm font-medium text-muted-foreground">
                      <TrendingUp className="me-1 inline h-3 w-3 text-primary" />
                      {t(changeKey)}
                    </p>
                  </div>
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-md transition-transform duration-200 group-hover:-translate-y-0.5", bgColor)}>
                    <Icon className={cn("text-xl", color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">

          {/* Upcoming training sessions — real data */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{t("dashboard.upcomingTraining")}</CardTitle>
                  <CardDescription>{t("dashboard.upcomingDescription")}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary" asChild>
                  <Link href="/training" data-testid="link-view-all-training">
                    {t("dashboard.viewAll")} <ArrowUpRight className={cn("ms-1 h-4 w-4", isRtl && "rotate-180")} />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("dashboard.noUpcomingSessions")}</p>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session, index) => {
                    const teamName = teams.find((tm) => tm.id === session.teamId)?.name;
                    const scheduledAt = new Date(`${session.date}T${session.startTime}`);
                    return (
                      <Link key={session.id} href={`/training/attendance?session=${session.id}`} data-testid={`link-session-${index}`}>
                        <div className="flex cursor-pointer items-center gap-4 rounded-md bg-muted/45 p-4 transition-all duration-200 hover:bg-muted/80" data-testid={`session-${index}`}>
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                            <Activity className="text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{session.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {teamName} · {session.duration} {locale === "ar" ? "دقيقة" : "min"} · {session.location}
                            </p>
                          </div>
                          <div className={cn("font-mono", isRtl ? "text-start" : "text-end")}>
                            <p className="text-sm font-medium text-foreground">{format(scheduledAt, "EEE, MMM d", { locale: dateLocale })}</p>
                            <p className="text-xs text-muted-foreground">{format(scheduledAt, "h:mm a", { locale: dateLocale })}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interactive calendar */}
          <InteractiveCalendar />

          {/* Recent players — real data, no dummy names */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
                  <CardDescription>{t("dashboard.recentActivityDescription")}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary" asChild>
                  <Link href="/players" data-testid="link-view-all-players">
                    {t("dashboard.viewAll")} <ArrowUpRight className={cn("ms-1 h-4 w-4", isRtl && "rotate-180")} />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentPlayers.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("dashboard.noSquadMembers")}</p>
              ) : (
                <div className="space-y-3">
                  {recentPlayers.map((player, index) => {
                    const displayName = isRtl && player.firstNameAr
                      ? `${player.firstNameAr} ${player.lastNameAr ?? ""}`.trim()
                      : `${player.firstName} ${player.lastName}`;
                    const initials = `${player.firstName[0]}${player.lastName[0]}`;
                    const addedAt = player.createdAt ? new Date(player.createdAt) : null;
                    return (
                      <Link key={player.id} href="/players" data-testid={`link-activity-${index}`}>
                        <div className="flex cursor-pointer items-start gap-4 rounded-md p-3 transition-colors hover:bg-muted/55" data-testid={`activity-${index}`}>
                          <Avatar className="h-10 w-10 rounded-md">
                            {player.profilePicture && <AvatarImage src={player.profilePicture} />}
                            <AvatarFallback className="rounded-md text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm text-foreground">
                              <span className="font-medium">{displayName}</span>{" "}
                              {t("admin.joinedSquad")}
                            </p>
                            {addedAt && (
                              <p className="text-xs text-muted-foreground">
                                {format(addedAt, "d MMM yyyy", { locale: dateLocale })}
                              </p>
                            )}
                          </div>
                          <Badge className="rounded-sm" variant="secondary">
                            {t(`position.${player.position}`)}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Quick actions — fully localized, RTL-safe */}
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
                    <Link href={link} data-testid={`link-${titleKey}`}>
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

          {/* Team performance — real attendance, no fake scores */}
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.teamPerformance")}</CardTitle>
              <CardDescription>{t("dashboard.teamPerformanceDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("dashboard.trainingAttendance")}</span>
                    <span className="font-medium text-foreground">{stats?.attendanceRate ?? 0}%</span>
                  </div>
                  <Progress value={stats?.attendanceRate ?? 0} className="h-2" />
                </div>

                {/* Squad members — real players */}
                <div className="border-t border-border pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">{t("dashboard.squadMembers")}</h4>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary hover:text-primary" asChild>
                      <Link href="/players">{t("dashboard.viewAll")}</Link>
                    </Button>
                  </div>
                  {squadSample.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">{t("dashboard.noSquadMembers")}</p>
                  ) : (
                    <div className="space-y-2">
                      {squadSample.map((player) => {
                        const displayName = isRtl && player.firstNameAr
                          ? `${player.firstNameAr} ${player.lastNameAr ?? ""}`.trim()
                          : `${player.firstName} ${player.lastName}`;
                        const initials = `${player.firstName[0]}${player.lastName[0]}`;
                        return (
                          <Link key={player.id} href="/players" data-testid={`link-top-performer-${player.id}`}>
                            <div className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/55" data-testid={`top-performer-${player.id}`}>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming sessions as tasks — real data */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{t("dashboard.tasks")}</CardTitle>
                  <CardDescription>{t("dashboard.tasksDescription")}</CardDescription>
                </div>
                {upcomingSessions.length > 0 && (
                  <Badge variant="secondary" className="rounded-sm text-xs">
                    {upcomingSessions.length}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("dashboard.noUpcomingSessions")}</p>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => {
                    const teamName = teams.find((tm) => tm.id === session.teamId)?.name;
                    const scheduledAt = new Date(`${session.date}T${session.startTime}`);
                    return (
                      <Link key={session.id} href={`/training/attendance?session=${session.id}`}>
                        <div className="flex cursor-pointer items-start gap-3 rounded-md border border-border/60 bg-muted/30 p-3 transition-colors hover:bg-muted/60">
                          <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-foreground">{session.title}</p>
                            <p className="truncate text-xs text-muted-foreground">{teamName} · {session.location}</p>
                            <p className="mt-1 text-xs text-primary">
                              {format(scheduledAt, "EEE d MMM · h:mm a", { locale: dateLocale })}
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
      </div>
    </div>
  );
}
