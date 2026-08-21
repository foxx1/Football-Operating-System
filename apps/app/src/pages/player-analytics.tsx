import { useQuery } from "@tanstack/react-query";
import { Activity, BarChart3, Dumbbell, Footprints, Target, Timer } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Player, PlayerStats } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/contexts/I18nContext";
import { cn, getDisplayName } from "@/lib/utils";

interface PlayerAnalyticsSummary {
  player: Player | null;
  stats: PlayerStats[];
  totals: {
    goals: number;
    assists: number;
    minutesPlayed: number;
    averageFitnessScore: number;
    averageTechnicalScore: number;
    averageTacticalScore: number;
    sessionsTracked: number;
  };
}

export default function PlayerAnalytics() {
  const { isRtl, t } = useI18n();
  const { data, isLoading } = useQuery<PlayerAnalyticsSummary>({
    queryKey: ["/api/player/analytics-summary"],
  });

  if (isLoading) {
    return <div className="mx-auto max-w-[1480px] p-6"><div className="h-48 animate-pulse rounded-lg bg-muted" /></div>;
  }

  const totals = data?.totals;
  const stats = data?.stats ?? [];
  const chartData = stats.map((stat, index) => ({
    session: `S${index + 1}`,
    goals: stat.goals,
    assists: stat.assists,
    minutes: stat.minutesPlayed,
    fitness: stat.fitnessScore ?? 0,
    technical: stat.technicalScore ?? 0,
    tactical: stat.tacticalScore ?? 0,
  }));

  return (
    <div className="mx-auto max-w-[1480px] space-y-6 p-5 sm:p-6 xl:p-8">
      <section className="relative overflow-hidden rounded-lg border border-border/70 bg-card/90 p-6 shadow-[0_24px_70px_-52px_hsl(var(--foreground)/0.7)] md:p-8">
        <BarChart3 className={cn("absolute -bottom-10 h-48 w-48 text-primary/[0.06]", isRtl ? "-left-5" : "-right-5")} />
        <div className="relative max-w-3xl">
          <Badge variant="secondary" className="mb-4 rounded-sm">{t("playerAnalytics.badge")}</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            {data?.player ? getDisplayName(data.player, isRtl) : t("playerAnalytics.titleFallback")}
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
            {t("playerAnalytics.description")}
          </p>
        </div>
      </section>

      {!data?.player && (
        <div className="rounded-md border border-amber-300/60 bg-amber-100/60 p-4 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
          {t("playerAnalytics.noLinkedProfile")}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t("playerAnalytics.goals"), value: totals?.goals ?? 0, icon: Target },
          { label: t("playerAnalytics.assists"), value: totals?.assists ?? 0, icon: Footprints },
          { label: t("playerAnalytics.minutes"), value: totals?.minutesPlayed ?? 0, icon: Timer },
          { label: t("playerAnalytics.trackedSessions"), value: totals?.sessionsTracked ?? 0, icon: Activity },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="stats-card">
            <CardContent className="flex items-center justify-between p-0">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">{label}</p>
                <p className="mt-2 font-mono text-4xl font-semibold">{value}</p>
              </div>
              <div className="rounded-md bg-primary/10 p-4 text-primary"><Icon className="h-6 w-6" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("playerAnalytics.trendTitle")}</CardTitle>
            <CardDescription>{t("playerAnalytics.trendDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="session" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="goals" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="assists" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-md bg-muted/45 text-sm text-muted-foreground">
                {t("playerAnalytics.noRecords")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("playerAnalytics.scoreProfileTitle")}</CardTitle>
            <CardDescription>{t("playerAnalytics.scoreProfileDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              [t("playerAnalytics.fitness"), totals?.averageFitnessScore ?? 0],
              [t("playerAnalytics.technical"), totals?.averageTechnicalScore ?? 0],
              [t("playerAnalytics.tactical"), totals?.averageTacticalScore ?? 0],
            ].map(([label, value]) => (
              <div key={label as string}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium"><Dumbbell className="h-4 w-4 text-primary" />{label}</span>
                  <span className="font-mono font-semibold">{value}%</span>
                </div>
                <Progress value={value as number} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("playerAnalytics.breakdownTitle")}</CardTitle>
          <CardDescription>{t("playerAnalytics.breakdownDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          {chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="session" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="fitness" fill="hsl(var(--primary))" />
                <Bar dataKey="technical" fill="#22c55e" />
                <Bar dataKey="tactical" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center rounded-md bg-muted/45 text-sm text-muted-foreground">
              {t("playerAnalytics.noScores")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
