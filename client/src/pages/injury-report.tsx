import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  HeartPulse,
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  Users,
  Calendar,
  Shield,
  Bone,
  Zap,
} from "lucide-react";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import { translateBodyPart } from "@/components/body-map-selector";
import { cn } from "@/lib/utils";

// Mock report data. `part`/`month` are translation-key fragments (bodyPart.*,
// month.short.*), not display text — they're translated at render time.
const injuryByBodyPart = [
  { part: "Hamstring", count: 8, percentage: 24 },
  { part: "Knee", count: 6, percentage: 18 },
  { part: "Ankle", count: 5, percentage: 15 },
  { part: "Groin", count: 4, percentage: 12 },
  { part: "Thigh", count: 3, percentage: 9 },
  { part: "Calf", count: 3, percentage: 9 },
  { part: "Shin", count: 2, percentage: 6 },
  { part: "Other", count: 2, percentage: 6 },
];

const monthlyTrend = [
  { month: "jan", injuries: 2 },
  { month: "feb", injuries: 3 },
  { month: "mar", injuries: 1 },
  { month: "apr", injuries: 4 },
  { month: "may", injuries: 5 },
  { month: "jun", injuries: 6 },
  { month: "jul", injuries: 3 },
];

const injuryBySeverity = {
  mild: { count: 12, percentage: 36, color: "text-emerald-400", bg: "bg-emerald-500" },
  moderate: { count: 14, percentage: 42, color: "text-amber-400", bg: "bg-amber-500" },
  severe: { count: 7, percentage: 21, color: "text-rose-400", bg: "bg-rose-500" },
};

const recurrenceData = [
  { player: "Ahmed Hassan", injury: "Hamstring Strain", occurrences: 3, lastDate: "2026-06-15" },
  { player: "Mohamed Ali", injury: "Ankle Sprain", occurrences: 2, lastDate: "2026-05-10" },
  { player: "Omar Fathy", injury: "Groin Pull", occurrences: 2, lastDate: "2026-07-01" },
];

const teamBreakdown = [
  { team: "First Team", total: 15, active: 4, recovered: 11, avgRecovery: 18 },
  { team: "Reserves", total: 10, active: 2, recovered: 8, avgRecovery: 14 },
  { team: "Youth", total: 8, active: 1, recovered: 7, avgRecovery: 12 },
];

export default function InjuryReport() {
  const [period, setPeriod] = useState("season");
  const { t, locale } = useI18n();

  const totalInjuries = 33;
  const avgRecoveryDays = 15.3;
  const recurrenceRate = 18;

  const maxMonthlyInjuries = Math.max(...monthlyTrend.map((m) => m.injuries));

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/20">
            <HeartPulse className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("injury.report.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("injury.report.description")}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px] h-10">
              <Calendar className="w-4 h-4 me-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">{t("injury.report.periodMonth")}</SelectItem>
              <SelectItem value="quarter">{t("injury.report.periodQuarter")}</SelectItem>
              <SelectItem value="season">{t("injury.report.periodSeason")}</SelectItem>
              <SelectItem value="year">{t("injury.report.periodYear")}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="h-10 gap-2">
            <Download className="w-4 h-4" />
            {t("injury.report.exportPdf")}
          </Button>
        </div>
      </div>

      {/* Summary Stats — each card links to the matching filtered view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/injuries">
          <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/50 hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("injury.report.statTotal")}</p>
                  <p className="text-3xl font-bold mt-1">{totalInjuries}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">{translateWithParams(t, "injury.report.trendLess", { percent: "12" })}</span> {t("injury.report.vsLastSeason")}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Activity className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/injuries?status=recovering">
          <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/50 hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("injury.report.statAvgRecovery")}</p>
                  <p className="text-3xl font-bold mt-1">{avgRecoveryDays}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("injury.report.daysAverage")}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <Clock className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card
          onClick={() => document.getElementById("recurring-injuries")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="bg-gradient-to-br from-card to-card/80 border-border/50 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-400/50 hover:shadow-md"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("injury.report.statRecurrence")}</p>
                <p className="text-3xl font-bold mt-1 text-amber-400">{recurrenceRate}%</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-rose-400" />
                  <span className="text-rose-400">{translateWithParams(t, "injury.report.trendIncrease", { percent: "3" })}</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/injuries?status=available">
          <Card className="bg-gradient-to-br from-card to-card/80 border-border/50 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/50 hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("injury.report.statCleared")}</p>
                  <p className="text-3xl font-bold mt-1 text-emerald-400">26</p>
                  <p className="text-xs text-muted-foreground mt-1">{translateWithParams(t, "injury.report.ofRecovered", { total: "33" })}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend - Visual Bar Chart */}
        <Link href="/injuries">
          <Card className="border-border/50 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/50 hover:shadow-md h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <CardTitle className="text-base">{t("injury.report.monthlyTrendTitle")}</CardTitle>
              </div>
              <CardDescription>{t("injury.report.monthlyTrendDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-48">
                {monthlyTrend.map((month) => (
                  <div key={month.month} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-xs font-medium text-muted-foreground">{month.injuries}</span>
                    <div className="w-full relative" style={{ height: "160px" }}>
                      <div
                        className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-blue-500/80 to-blue-400/60 transition-all duration-500 hover:from-blue-500 hover:to-blue-400"
                        style={{
                          height: `${(month.injuries / maxMonthlyInjuries) * 100}%`,
                          minHeight: "8px",
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{t(`month.short.${month.month}`)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Severity Distribution — each row links to that severity, filtered */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <CardTitle className="text-base">{t("injury.report.severityDistTitle")}</CardTitle>
            </div>
            <CardDescription>{t("injury.report.severityDistDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(injuryBySeverity).map(([key, data]) => (
              <Link key={key} href={`/injuries?severity=${key}`}>
                <div className="space-y-2 cursor-pointer rounded-md -mx-2 px-2 py-1 transition-colors hover:bg-muted/50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2.5 h-2.5 rounded-full", data.bg)} />
                      <span className="text-sm font-medium">{t(`severity.${key}.label`)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-bold", data.color)}>{data.count}</span>
                      <span className="text-xs text-muted-foreground">({data.percentage}%)</span>
                    </div>
                  </div>
                  <Progress value={data.percentage} className="h-2.5" />
                </div>
              </Link>
            ))}

            <div className="pt-4 border-t border-border/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("injury.report.totalInjuriesLabel")}</span>
                <span className="font-bold">{totalInjuries}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Body Part Breakdown + Recurrence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Injuries by Body Part */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bone className="w-4 h-4 text-purple-400" />
              <CardTitle className="text-base">{t("injury.report.bodyPartTitle")}</CardTitle>
            </div>
            <CardDescription>{t("injury.report.bodyPartDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {injuryByBodyPart.map((item, index) => (
              <Link key={item.part} href={`/injuries?bodyPart=${encodeURIComponent(item.part)}`}>
                <div className="flex items-center gap-3 cursor-pointer rounded-md -mx-2 px-2 py-1 transition-colors hover:bg-muted/50">
                  <span className="text-xs text-muted-foreground w-5 text-end font-mono">{index + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{translateBodyPart(t, item.part)}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-xs border-border/50 px-1.5">
                          {item.count}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-400 transition-all duration-700"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Recurrence Alert */}
        <Card id="recurring-injuries" className="border-border/50 scroll-mt-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <CardTitle className="text-base">{t("injury.report.recurringTitle")}</CardTitle>
            </div>
            <CardDescription>{t("injury.report.recurringDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recurrenceData.map((item) => (
              <Link key={item.player} href={`/injuries?search=${encodeURIComponent(item.player)}`}>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/30 space-y-2 cursor-pointer transition-colors hover:bg-muted/60">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{item.player}</span>
                    <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20">
                      {translateWithParams(t, "injury.report.recurrenceSuffix", { count: String(item.occurrences) })}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t(`injuryType.${item.injury}`)}</span>
                    <span>{translateWithParams(t, "injury.report.lastLabel", { date: new Date(item.lastDate).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US") })}</span>
                  </div>
                </div>
              </Link>
            ))}

            <div className="pt-3 border-t border-border/30">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("injury.report.recurringNote")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Breakdown */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <CardTitle className="text-base">{t("injury.report.teamBreakdownTitle")}</CardTitle>
          </div>
          <CardDescription>{t("injury.report.teamBreakdownDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {teamBreakdown.map((team) => (
              <Link key={team.team} href={`/injuries?team=${encodeURIComponent(team.team)}`}>
                <div className="p-4 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 border border-border/30 space-y-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/50 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{team.team}</h4>
                    <Badge variant="outline" className="border-border/50 text-xs">
                      {translateWithParams(t, "injury.report.totalSuffix", { count: String(team.total) })}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-background/50">
                      <p className="text-lg font-bold text-amber-400">{team.active}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("injury.report.activeLabel")}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-background/50">
                      <p className="text-lg font-bold text-emerald-400">{team.recovered}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("injury.report.recoveredLabel")}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{t("injury.report.avgRecoveryLabel")}</span>
                    <span className="font-medium">{translateWithParams(t, "injury.report.daysSuffix", { count: String(team.avgRecovery) })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
