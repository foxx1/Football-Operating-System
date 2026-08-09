import { Link } from "wouter";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth, getRoleDisplayName } from "@/lib/auth";
import { useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";

function getGreetingPeriod(hour: number) {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function getGreeting(period: string, name: string): string {
  if (period === "morning") return `Good morning, ${name}`;
  if (period === "afternoon") return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

function getGreetingAr(period: string, name: string): string {
  if (period === "morning") return `صباح الخير، ${name}`;
  if (period === "afternoon") return `مساء الخير، ${name}`;
  return `مساء النور، ${name}`;
}

export default function AdminDashboard() {
  const { organizationName } = useSettings();
  const { user } = useAuth();
  const { t, isRtl } = useI18n();

  if (!user) return null;

  const roleName = getRoleDisplayName(user.role);
  const greetingPeriod = getGreetingPeriod(new Date().getHours());
  const greeting = isRtl
    ? getGreetingAr(greetingPeriod, user.firstName)
    : getGreeting(greetingPeriod, user.firstName);

  const sections = [
    {
      titleKey: "admin.players",
      descKey: "admin.playersDesc",
      icon: Users,
      link: "/players",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      titleKey: "admin.squads",
      descKey: "admin.squadsDesc",
      icon: Shield,
      link: "/teams",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100/80 dark:bg-blue-900/20",
    },
    {
      titleKey: "admin.staff",
      descKey: "admin.staffDesc",
      icon: UserCheck,
      link: "/staff",
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-100/80 dark:bg-violet-900/20",
    },
    {
      titleKey: "admin.training",
      descKey: "admin.trainingDesc",
      icon: Calendar,
      link: "/training",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100/80 dark:bg-emerald-900/20",
    },
    {
      titleKey: "admin.attendance",
      descKey: "admin.attendanceDesc",
      icon: ClipboardCheck,
      link: "/training/attendance",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100/80 dark:bg-amber-900/20",
    },
    {
      titleKey: "admin.matches",
      descKey: "admin.matchesDesc",
      icon: Trophy,
      link: "/matches",
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-100/80 dark:bg-rose-900/20",
    },
    {
      titleKey: "admin.budgets",
      descKey: "admin.budgetsDesc",
      icon: Wallet,
      link: "/monthly-budgets",
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-100/80 dark:bg-teal-900/20",
    },
    {
      titleKey: "admin.reports",
      descKey: "admin.reportsDesc",
      icon: FileText,
      link: "/reports",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100/80 dark:bg-orange-900/20",
    },
    {
      titleKey: "admin.settings",
      descKey: "admin.settingsDesc",
      icon: Settings,
      link: "/settings",
      color: "text-slate-600 dark:text-slate-400",
      bgColor: "bg-slate-100/80 dark:bg-slate-900/20",
    },
  ];

  return (
    <div className="mx-auto max-w-[1480px] space-y-7 p-5 sm:p-6 xl:p-8">
      {/* Hero banner */}
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

      {/* Feature cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(({ titleKey, descKey, icon: Icon, link, color, bgColor }) => (
          <Link key={link} href={link}>
            <Card className="group cursor-pointer border border-border/60 bg-card transition-all duration-200 hover:border-primary/30 hover:shadow-md">
              <CardHeader className="flex flex-row items-start gap-4 pb-3">
                <div className={cn("rounded-lg p-2.5", bgColor)}>
                  <Icon className={cn("h-5 w-5", color)} />
                </div>
                <div className="flex-1 space-y-0.5">
                  <CardTitle className="text-base font-semibold leading-snug">
                    {t(titleKey)}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {t(descKey)}
                  </CardDescription>
                </div>
                <ArrowUpRight
                  className={cn(
                    "h-4 w-4 flex-shrink-0 text-muted-foreground/40 transition-all duration-200 group-hover:text-primary",
                    isRtl ? "rotate-180" : "",
                  )}
                />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
