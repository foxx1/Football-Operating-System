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
  Clock,
  Activity,
  Star,
  Wallet,
  ArrowUpRight,
  ClipboardCheck
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { InteractiveCalendar } from "@/components/dashboard/interactive-calendar";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import type { Team, TrainingSession } from "@shared/schema";

export default function Dashboard() {
  const { currency, organizationName } = useSettings();
  const { locale, t } = useI18n();
  const dateLocale = locale === "ar" ? ar : enUS;
  const { data: stats, isLoading } = useQuery<{
    totalPlayers: number;
    activeTeams: number;
    attendanceRate: number;
    upcomingSessions: TrainingSession[];
  }>({
    queryKey: ["/api/dashboard/stats"],
  });
  const { data: teams = [] } = useQuery<Team[]>({ queryKey: ["/api/teams"] });



  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1480px] p-6">
        <div className="mb-8 h-44 animate-pulse rounded-lg bg-muted/70" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Players",
      titleKey: "dashboard.totalPlayers",
      value: stats?.totalPlayers || 0,
      change: t("dashboard.playersChange"),
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/players"
    },
    {
      title: "Active Teams",
      titleKey: "dashboard.activeTeams",
      value: stats?.activeTeams || 0,
      subtitle: t("dashboard.teamSubtitle"),
      icon: Shield,
      color: "text-emerald-700 dark:text-emerald-300",
      bgColor: "bg-emerald-100/80 dark:bg-emerald-900/20",
      link: "/teams"
    },
    {
      title: "Monthly Budget",
      titleKey: "dashboard.monthlyBudget",
      value: formatCurrency(15000, currency),
      change: t("dashboard.budgetChange"),
      icon: Wallet,
      color: "text-amber-700 dark:text-amber-300",
      bgColor: "bg-amber-100/80 dark:bg-amber-900/20",
      link: "/monthly-budgets"
    },
    {
      title: "Attendance Rate",
      titleKey: "dashboard.attendanceRate",
      value: `${stats?.attendanceRate || 0}%`,
      change: t("dashboard.attendanceChange"),
      icon: TrendingUp,
      color: "text-cyan-800 dark:text-cyan-300",
      bgColor: "bg-cyan-100/80 dark:bg-cyan-900/20",
      link: "/training"
    }
  ];

  const quickActions = [
    {
      title: "Schedule Training",
      description: "Create new training session",
      icon: Plus,
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/training"
    },
    {
      title: "Add Player",
      description: "Register new player",
      icon: UserPlus,
      color: "text-emerald-700 dark:text-emerald-300",
      bgColor: "bg-emerald-100/80 dark:bg-emerald-900/20",
      link: "/players"
    },
    {
      title: "Tactics Board",
      description: "Plan team formations",
      icon: Swords,
      color: "text-amber-700 dark:text-amber-300",
      bgColor: "bg-amber-100/80 dark:bg-amber-900/20",
      link: "/tactical-board"
    },
    {
      title: "Generate Report",
      description: "Export session data",
      icon: FileText,
      color: "text-rose-700 dark:text-rose-300",
      bgColor: "bg-rose-100/80 dark:bg-rose-900/20",
      link: "/reports"
    }
  ];

  const recentActivity = [
    {
      playerName: "Alex Johnson",
      action: "completed fitness assessment with excellent results",
      timestamp: "2 hours ago",
      status: "Completed",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face"
    },
    {
      playerName: "Michael Roberts",
      action: "updated availability for next week's matches",
      timestamp: "4 hours ago",
      status: "Updated",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face"
    },
    {
      playerName: "David Chen",
      action: "submitted injury report - minor ankle sprain",
      timestamp: "6 hours ago",
      status: "Injury Report",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&h=120&fit=crop&crop=face"
    }
  ];

  const topPerformers = [
    {
      name: "Sarah Wilson",
      position: "Midfielder",
      rating: 9.2,
      avatar: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "James Martinez",
      position: "Forward",
      rating: 8.8,
      avatar: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const tasks = [
    {
      title: "Update medical certificates",
      description: "5 players need renewed certificates",
      dueDate: "Due: Tomorrow",
      color: "bg-amber-100 dark:bg-amber-900/20 border-amber-200",
      dotColor: "bg-amber-500"
    },
    {
      title: "Match preparation meeting",
      description: "Schedule tactics review with assistant coaches",
      dueDate: "Due: Friday",
      color: "bg-primary/10 border-primary/20",
      dotColor: "bg-primary"
    },
    {
      title: "Equipment inventory",
      description: "Review and order new training equipment",
      dueDate: "Due: Next week",
      color: "bg-emerald-100/70 dark:bg-emerald-900/20 border-emerald-200/80",
      dotColor: "bg-emerald-600"
    }
  ];

  return (
    <div className="mx-auto max-w-[1480px] space-y-7 p-5 sm:p-6 xl:p-8">
      <section className="relative overflow-hidden rounded-lg border border-border/70 bg-card/85 p-6 shadow-[0_24px_70px_-52px_hsl(var(--foreground)/0.7)]">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[linear-gradient(115deg,transparent,hsl(var(--primary)/0.14)),repeating-linear-gradient(90deg,hsl(var(--primary)/0.12)_0_1px,transparent_1px_58px),repeating-linear-gradient(0deg,hsl(var(--primary)/0.1)_0_1px,transparent_1px_42px)] md:block" />
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
              <p className="font-mono text-2xl font-semibold">{stats?.totalPlayers || 0}</p>
            </div>
            <div className="rounded-sm bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground">{t("dashboard.teams")}</p>
              <p className="font-mono text-2xl font-semibold">{stats?.activeTeams || 0}</p>
            </div>
            <div className="rounded-sm bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground">{t("dashboard.attendanceShort")}</p>
              <p className="font-mono text-2xl font-semibold">{stats?.attendanceRate || 0}%</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link key={index} href={stat.link} data-testid={`stats-card-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
              <Card className="stats-card group cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-muted-foreground">{t(stat.titleKey)}</p>
                      <p className="mt-2 truncate font-mono text-3xl font-semibold text-foreground">{stat.value}</p>
                      {stat.change && (
                        <p className="mt-2 text-sm font-medium text-muted-foreground">
                          <TrendingUp className="inline w-3 h-3 mr-1 text-primary" />
                          {stat.change}
                        </p>
                      )}
                      {stat.subtitle && (
                        <p className="text-sm text-muted-foreground mt-1">{stat.subtitle}</p>
                      )}
                    </div>
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-md flex items-center justify-center transition-transform duration-200 group-hover:-translate-y-0.5`}>
                      <Icon className={`${stat.color} text-xl`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Recent Activity & Training Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Training Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{t("dashboard.upcomingTraining")}</CardTitle>
                  <CardDescription>{t("dashboard.upcomingDescription")}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary" asChild>
                  <Link href="/training" data-testid="link-view-all-training">
                    {t("dashboard.viewAll")} <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(stats?.upcomingSessions ?? []).length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("dashboard.noUpcomingSessions")}</p>
              ) : (
                <div className="space-y-3">
                  {(stats?.upcomingSessions ?? []).map((session, index) => {
                    const teamName = teams.find((tm) => tm.id === session.teamId)?.name;
                    const scheduledAt = new Date(`${session.date}T${session.startTime}`);
                    return (
                      <Link
                        key={session.id}
                        href={`/training/attendance?session=${session.id}`}
                        data-testid={`link-session-${index}`}
                      >
                        <div className="flex items-center gap-4 rounded-md bg-muted/45 p-4 transition-all duration-200 hover:bg-muted/80 hover:translate-x-0.5 cursor-pointer" data-testid={`session-${index}`}>
                          <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                            <Activity className="text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{session.title}</h4>
                            <p className="text-sm text-muted-foreground">{teamName} • {session.duration} min • {session.location}</p>
                          </div>
                          <div className="text-right font-mono">
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

          {/* Interactive Calendar */}
          <InteractiveCalendar />

          {/* Recent Player Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
                  <CardDescription>{t("dashboard.recentActivityDescription")}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary" asChild>
                  <Link href="/players" data-testid="link-view-all-players">
                    {t("dashboard.viewAll")} <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <Link
                    key={index}
                    href="/players"
                    data-testid={`link-activity-${index}`}
                  >
                    <div className="flex items-start gap-4 rounded-md p-3 transition-all duration-200 hover:bg-muted/55 cursor-pointer" data-testid={`activity-${index}`}>
                      <Avatar className="w-10 h-10 rounded-md">
                        <AvatarImage src={activity.avatar} />
                        <AvatarFallback>{activity.playerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{activity.playerName}</span>{' '}
                          {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                      <Badge className="rounded-sm" variant={activity.status === 'Completed' ? 'default' : activity.status === 'Updated' ? 'secondary' : 'destructive'}>
                        {activity.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Team Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.quickActions")}</CardTitle>
              <CardDescription>{t("dashboard.quickActionsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto hover:bg-muted"
                      asChild
                    >
                      <Link
                        href={action.link}
                        data-testid={`link-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <div className={`w-10 h-10 ${action.bgColor} rounded-md flex items-center justify-center mr-3`}>
                          <Icon className={action.color} />
                        </div>
                        <div className="text-left">
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

          {/* Team Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.teamPerformance")}</CardTitle>
              <CardDescription>{t("dashboard.teamPerformanceDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Training Attendance</span>
                    <span className="font-medium text-foreground">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Fitness Level</span>
                    <span className="font-medium text-foreground">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Tactical Understanding</span>
                    <span className="font-medium text-foreground">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>

                {/* Top Performers */}
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Top performers this week</h4>
                  <div className="space-y-3">
                    {topPerformers.map((player, index) => (
                      <Link
                        key={index}
                        href="/players"
                        data-testid={`link-top-performer-${index}`}
                      >
                        <div className="flex items-center space-x-3 rounded-md p-2 transition-colors hover:bg-muted/55 cursor-pointer" data-testid={`top-performer-${index}`}>
                          <Avatar className="w-8 h-8 rounded-md">
                            <AvatarImage src={player.avatar} />
                            <AvatarFallback>{player.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{player.name}</p>
                            <p className="text-xs text-muted-foreground">{player.position}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="text-amber-400 w-3 h-3 fill-current" />
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
                  3 pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <div key={index} className={`flex items-start space-x-3 rounded-md border p-3 ${task.color}`}>
                    <ClipboardCheck className={`mt-0.5 h-4 w-4 ${task.dotColor.replace("bg-", "text-")}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                      <p className="text-xs text-primary mt-1">{task.dueDate}</p>
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
