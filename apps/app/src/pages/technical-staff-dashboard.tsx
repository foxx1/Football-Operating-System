import { useQuery } from "@tanstack/react-query";
import { Link, Redirect } from "wouter";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  ArrowUpRight,
  ClipboardCheck,
  FileText,
  HeartPulse,
  Plus,
  Star,
  Swords,
  TrendingUp,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { InteractiveCalendar } from "@/components/dashboard/interactive-calendar";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth, getRoleDisplayName } from "@/lib/auth";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import { useMyDisplayName } from "@/hooks/use-my-display-name";
import { cn } from "@/lib/utils";
import { useInjuries } from "@/lib/injuries";
import { isTechnicalStaffRole, type Team, type TrainingSession } from "@shared/schema";

function getWorkspaceGroup(role: string | undefined, t: (key: string) => string) {
  if (role === "analyst") return t("technicalStaff.group.analysis");
  if (role === "physiotherapist") return t("technicalStaff.group.medical");
  return t("technicalStaff.group.technical");
}

function getGreetingPeriod(hour: number) {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export default function TechnicalStaffDashboard() {
  const { organizationName } = useSettings();
  const { user } = useAuth();
  const { t, isRtl, locale } = useI18n();
  const dateLocale = locale === "ar" ? ar : enUS;
  const { fullName: greetingName } = useMyDisplayName();

  // Every card on this dashboard is restricted to the team(s) the signed-in
  // staff member is assigned to (via the team_staff assignment), not the
  // whole club.
  const { data: myTeams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/dashboard/my-teams"],
  });

  const teamIds = myTeams.map((team) => team.id);
  const teamNames = myTeams.map((team) => team.name);
  const hasAssignedTeams = teamIds.length > 0;
  const assignedTeamLabel = teamNames.length > 0 ? teamNames.join(", ") : t("technicalStaff.dashboard.noTeamAssigned");

  const { data: stats } = useQuery<{
    totalPlayers: number;
    attendanceRate: number;
  }>({
    queryKey: [`/api/dashboard/stats?teamIds=${teamIds.join(",")}`],
    enabled: hasAssignedTeams,
  });

  const { data: injuries = [] } = useInjuries();

  const { data: allTrainingSessions = [] } = useQuery<TrainingSession[]>({
    queryKey: ["/api/training-sessions"],
    enabled: hasAssignedTeams,
  });

  if (!user) {
    return null;
  }

  if (!isTechnicalStaffRole(user.role)) {
    return <Redirect to={user.role === "player" ? "/player-dashboard" : "/"} />;
  }

  const roleName = getRoleDisplayName(user.role);
  const workspaceGroup = getWorkspaceGroup(user.role, t);
  const greetingPeriod = getGreetingPeriod(new Date().getHours());
  const greeting = translateWithParams(t, `technicalStaff.dashboard.greeting.${greetingPeriod}`, {
    name: greetingName || user.firstName,
  });

  const quickActions = [
    {
      title: t("technicalStaff.dashboard.quickAction.scheduleTraining.title"),
      description: t("technicalStaff.dashboard.quickAction.scheduleTraining.description"),
      icon: Plus,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/training",
    },
    {
      title: t("technicalStaff.dashboard.quickAction.tacticsBoard.title"),
      description: t("technicalStaff.dashboard.quickAction.tacticsBoard.description"),
      icon: Swords,
      color: "text-amber-700 dark:text-amber-300",
      bgColor: "bg-amber-100/80 dark:bg-amber-900/20",
      link: "/interactive-tactical-board",
    },
    {
      title: t("technicalStaff.dashboard.injuryReportLabel"),
      description: t("technicalStaff.dashboard.quickAction.injuryReport.description"),
      icon: FileText,
      color: "text-rose-700 dark:text-rose-300",
      bgColor: "bg-rose-100/80 dark:bg-rose-900/20",
      link: "/injuries/report",
    },
  ];

  const recentActivity = [
    {
      playerName: "Alex Johnson",
      action: t("technicalStaff.dashboard.activity.fitnessAssessment"),
      timestamp: "2 hours ago",
      statusKey: "completed" as const,
      statusLabel: t("technicalStaff.dashboard.status.completed"),
    },
    {
      playerName: "Michael Roberts",
      action: t("technicalStaff.dashboard.activity.availabilityUpdate"),
      timestamp: "4 hours ago",
      statusKey: "updated" as const,
      statusLabel: t("technicalStaff.dashboard.status.updated"),
    },
    {
      playerName: "David Chen",
      action: t("technicalStaff.dashboard.activity.injuryReportNote"),
      timestamp: "6 hours ago",
      statusKey: "injury" as const,
      statusLabel: t("technicalStaff.dashboard.injuryReportLabel"),
    },
  ];

  const topPerformers = [
    { name: "Sarah Wilson", position: t("position.midfielder"), rating: 9.2 },
    { name: "James Martinez", position: t("position.forward"), rating: 8.8 },
  ];

  const tasks = [
    {
      title: t("technicalStaff.dashboard.task.medicalCerts.title"),
      description: t("technicalStaff.dashboard.task.medicalCerts.description"),
      dueDate: t("technicalStaff.dashboard.task.medicalCerts.due"),
      color: "bg-amber-100 dark:bg-amber-900/20 border-amber-200",
      dotColor: "bg-amber-500",
    },
    {
      title: t("technicalStaff.dashboard.task.matchPrep.title"),
      description: t("technicalStaff.dashboard.task.matchPrep.description"),
      dueDate: t("technicalStaff.dashboard.task.matchPrep.due"),
      color: "bg-primary/10 border-primary/20",
      dotColor: "bg-primary",
    },
    {
      title: t("technicalStaff.dashboard.task.equipment.title"),
      description: t("technicalStaff.dashboard.task.equipment.description"),
      dueDate: t("technicalStaff.dashboard.task.equipment.due"),
      color: "bg-emerald-100/70 dark:bg-emerald-900/20 border-emerald-200/80",
      dotColor: "bg-emerald-600",
    },
  ];

  const totalInjuries = hasAssignedTeams
    ? injuries.filter((injury) => teamNames.includes(injury.teamName)).length
    : 0;
  const activeInjuries = hasAssignedTeams
    ? injuries.filter((injury) => teamNames.includes(injury.teamName) && injury.status !== "available").length
    : 0;

  const today = new Date().toISOString().split("T")[0];
  const upcomingSessions = allTrainingSessions
    .filter((session) => teamIds.includes(session.teamId) && session.date >= today)
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))
    .slice(0, 3);

  const totalPlayersDisplay = teamsLoading ? "—" : hasAssignedTeams ? stats?.totalPlayers ?? "—" : 0;
  const attendanceRateDisplay = teamsLoading
    ? "—"
    : hasAssignedTeams
    ? stats
      ? `${stats.attendanceRate}%`
      : "—"
    : "0%";
  const totalInjuriesDisplay = teamsLoading ? "—" : totalInjuries;

  return (
    <div className="mx-auto max-w-[1480px] space-y-7 p-5 sm:p-6 xl:p-8">
      <section className="relative overflow-hidden rounded-lg border border-border/70 bg-card p-6 shadow-[0_24px_70px_-52px_hsl(var(--foreground)/0.75)] md:p-8">
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 hidden w-[44%] bg-[linear-gradient(120deg,transparent,hsl(var(--primary)/0.13)),repeating-linear-gradient(90deg,hsl(var(--primary)/0.1)_0_1px,transparent_1px_54px),repeating-linear-gradient(0deg,hsl(var(--primary)/0.08)_0_1px,transparent_1px_42px)] md:block",
            isRtl ? "left-0" : "right-0",
          )}
        />
        <div className="relative max-w-3xl">
          <Badge variant="secondary" className="mb-4 rounded-sm">
            {workspaceGroup} · {roleName}
          </Badge>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl">
            {greeting}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            {translateWithParams(t, "technicalStaff.description", { organizationName })}
          </p>
        </div>
      </section>

      {!teamsLoading && !hasAssignedTeams && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
          {t("technicalStaff.dashboard.unassignedBanner")}
        </div>
      )}

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link href="/players">
          <Card className="stats-card group h-full cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{t("dashboard.totalPlayers")}</p>
                  <p className="mt-2 font-mono text-3xl font-semibold text-foreground">{totalPlayersDisplay}</p>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">{assignedTeamLabel}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 transition-transform duration-200 group-hover:-translate-y-0.5">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="stats-card h-full">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-muted-foreground">{t("dashboard.attendanceRate")}</p>
                <p className="mt-2 font-mono text-3xl font-semibold text-foreground">{attendanceRateDisplay}</p>
                <p className="mt-2 truncate text-sm font-medium text-muted-foreground">{assignedTeamLabel}</p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-cyan-100/80 dark:bg-cyan-900/20">
                <TrendingUp className="h-5 w-5 text-cyan-800 dark:text-cyan-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/injuries">
          <Card className="stats-card group h-full cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {t("technicalStaff.dashboard.totalInjuries")}
                  </p>
                  <p className="mt-2 font-mono text-3xl font-semibold text-foreground">{totalInjuriesDisplay}</p>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    {hasAssignedTeams
                      ? translateWithParams(t, "technicalStaff.dashboard.activeCount", {
                          count: String(activeInjuries),
                        })
                      : assignedTeamLabel}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-rose-100/80 transition-transform duration-200 group-hover:-translate-y-0.5 dark:bg-rose-900/20">
                  <HeartPulse className="h-5 w-5 text-rose-700 dark:text-rose-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Events Calendar */}
      <InteractiveCalendar teamIds={hasAssignedTeams ? teamIds : undefined} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 xl:col-span-2">
          {/* Upcoming Training Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{t("dashboard.upcomingTraining")}</CardTitle>
                  <CardDescription>{assignedTeamLabel}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary" asChild>
                  <Link href="/training">
                    {t("dashboard.viewAll")}{" "}
                    <ArrowUpRight className={cn("h-4 w-4", isRtl ? "mr-1" : "ml-1")} />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {hasAssignedTeams
                    ? t("technicalStaff.dashboard.noUpcomingSessions")
                    : t("technicalStaff.dashboard.noTeamAssignedPeriod")}
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => {
                    const teamName = myTeams.find((team) => team.id === session.teamId)?.name;
                    const scheduledAt = new Date(`${session.date}T${session.startTime}`);
                    const minutesLabel = translateWithParams(t, "technicalStaff.dashboard.sessionMinutes", {
                      duration: String(session.duration),
                    });
                    return (
                      <Link key={session.id} href={`/training/attendance?session=${session.id}`}>
                        <div
                          className={cn(
                            "flex items-center gap-4 rounded-md bg-muted/45 p-4 transition-all duration-200 hover:bg-muted/80",
                            isRtl ? "hover:-translate-x-0.5" : "hover:translate-x-0.5",
                          )}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{session.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {teamName} • {minutesLabel} • {session.location}
                            </p>
                          </div>
                          <div className="text-end font-mono">
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

          {/* Recent Player Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
                  <CardDescription>{t("dashboard.recentActivityDescription")}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary" asChild>
                  <Link href="/players">
                    {t("dashboard.viewAll")}{" "}
                    <ArrowUpRight className={cn("h-4 w-4", isRtl ? "mr-1" : "ml-1")} />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <Link key={index} href="/players">
                    <div className="flex items-start gap-4 rounded-md p-3 transition-all duration-200 hover:bg-muted/55">
                      <Avatar className="h-10 w-10 rounded-md">
                        <AvatarFallback>
                          {activity.playerName.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{activity.playerName}</span> {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                      <Badge
                        className="rounded-sm"
                        variant={
                          activity.statusKey === "completed"
                            ? "default"
                            : activity.statusKey === "updated"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {activity.statusLabel}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.quickActions")}</CardTitle>
              <CardDescription>{t("dashboard.quickActionsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      className="h-auto w-full justify-start p-3 hover:bg-muted"
                      asChild
                    >
                      <Link href={action.link}>
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-md",
                            action.bgColor,
                            isRtl ? "ml-3" : "mr-3",
                          )}
                        >
                          <Icon className={action.color} />
                        </div>
                        <div className="text-start">
                          <p className="font-medium text-foreground">{action.title}</p>
                          <p className="text-sm text-muted-foreground">{action.description}</p>
                        </div>
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Team Performance */}
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.teamPerformance")}</CardTitle>
              <CardDescription>
                {t("technicalStaff.dashboard.weeklyReadiness")} · {assignedTeamLabel}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("technicalStaff.dashboard.trainingAttendance")}</span>
                    <span className="font-medium text-foreground">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("technicalStaff.dashboard.fitnessLevel")}</span>
                    <span className="font-medium text-foreground">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("technicalStaff.dashboard.tacticalUnderstanding")}
                    </span>
                    <span className="font-medium text-foreground">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="mb-3 text-sm font-semibold text-foreground">
                    {t("technicalStaff.dashboard.topPerformersThisWeek")}
                  </h4>
                  <div className="space-y-3">
                    {topPerformers.map((player, index) => (
                      <Link key={index} href="/players">
                        <div
                          className={cn(
                            "flex items-center rounded-md p-2 transition-colors hover:bg-muted/55",
                            isRtl ? "space-x-reverse space-x-3" : "space-x-3",
                          )}
                        >
                          <Avatar className="h-8 w-8 rounded-md">
                            <AvatarFallback>
                              {player.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{player.name}</p>
                            <p className="text-xs text-muted-foreground">{player.position}</p>
                          </div>
                          <div
                            className={cn(
                              "flex items-center",
                              isRtl ? "space-x-reverse space-x-1" : "space-x-1",
                            )}
                          >
                            <Star className="h-3 w-3 fill-current text-amber-400" />
                            <span className="text-xs font-medium text-foreground">{player.rating}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks & Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{t("dashboard.tasks")}</CardTitle>
                  <CardDescription>{t("dashboard.tasksDescription")}</CardDescription>
                </div>
                <Badge variant="destructive" className="rounded-sm text-xs">
                  {translateWithParams(t, "technicalStaff.dashboard.pendingCount", { count: String(tasks.length) })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start rounded-md border p-3",
                      task.color,
                      isRtl ? "space-x-reverse space-x-3" : "space-x-3",
                    )}
                  >
                    <ClipboardCheck className={`mt-0.5 h-4 w-4 ${task.dotColor.replace("bg-", "text-")}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                      <p className="mt-1 text-xs text-primary">{task.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
