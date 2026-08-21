import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock3, MapPin, ShieldCheck, Timer, Trophy } from "lucide-react";
import type { Match, Player } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";

interface PlayerMatchSummary {
  player: Player | null;
  totalMatchesPlayed: number;
  totalMinutes: number;
  upcomingMatches: Match[];
  lastMatches: Match[];
}

function MatchRow({ match, completed = false }: { match: Match; completed?: boolean }) {
  const { t } = useI18n();

  return (
    <div className="grid gap-4 rounded-md bg-muted/45 p-4 transition-colors hover:bg-muted/75 md:grid-cols-[120px_1fr_auto] md:items-center">
      <div>
        <p className="font-mono text-sm font-semibold text-primary">
          {new Date(`${match.date}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" /> {match.kickoffTime}
        </p>
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{translateWithParams(t, "playerMatches.vs", { team: match.awayTeam })}</h3>
          <Badge variant="outline" className="rounded-sm capitalize">{match.competition}</Badge>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {match.venue}
        </p>
      </div>
      {completed && match.homeScore !== null && match.awayScore !== null ? (
        <div className="min-w-24 rounded-md bg-card px-4 py-3 text-center shadow-sm">
          <p className="font-mono text-2xl font-bold">{match.homeScore} - {match.awayScore}</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("playerMatches.fullTime")}</p>
        </div>
      ) : (
        <Badge className="w-fit rounded-sm">{t("playerMatches.upcomingBadge")}</Badge>
      )}
    </div>
  );
}

export default function PlayerMatches() {
  const { isRtl, t } = useI18n();
  const { data, isLoading } = useQuery<PlayerMatchSummary>({
    queryKey: ["/api/player/matches-summary"],
  });

  if (isLoading) {
    return <div className="mx-auto max-w-[1480px] p-6"><div className="h-48 animate-pulse rounded-lg bg-muted" /></div>;
  }

  const upcomingMatches = data?.upcomingMatches ?? [];
  const lastMatches = data?.lastMatches ?? [];

  return (
    <div className="mx-auto max-w-[1480px] space-y-6 p-5 sm:p-6 xl:p-8">
      <section className="relative overflow-hidden rounded-lg border border-border/70 bg-card/90 p-6 shadow-[0_24px_70px_-52px_hsl(var(--foreground)/0.7)] md:p-8">
        <Trophy className={cn("absolute -bottom-10 h-48 w-48 text-primary/[0.06]", isRtl ? "-left-5" : "-right-5")} />
        <div className="relative max-w-3xl">
          <Badge variant="secondary" className="mb-4 rounded-sm">{t("playerMatches.badge")}</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">{t("playerMatches.title")}</h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
            {t("playerMatches.description")}
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="stats-card">
          <CardContent className="flex items-center justify-between p-0">
            <div><p className="text-sm font-semibold text-muted-foreground">{t("playerMatches.totalPlayed")}</p><p className="mt-2 font-mono text-4xl font-semibold">{data?.totalMatchesPlayed ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">{t("playerMatches.totalPlayedNote")}</p></div>
            <div className="rounded-md bg-primary/10 p-4 text-primary"><ShieldCheck className="h-6 w-6" /></div>
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="flex items-center justify-between p-0">
            <div><p className="text-sm font-semibold text-muted-foreground">{t("playerMatches.totalMinutes")}</p><p className="mt-2 font-mono text-4xl font-semibold">{data?.totalMinutes ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">{t("playerMatches.totalMinutesNote")}</p></div>
            <div className="rounded-md bg-primary/10 p-4 text-primary"><Timer className="h-6 w-6" /></div>
          </CardContent>
        </Card>
      </div>

      {!data?.player && (
        <div className="rounded-md border border-amber-300/60 bg-amber-100/60 p-4 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
          {t("playerMatches.noLinkedProfile")}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-start justify-between"><div><CardTitle>{t("playerMatches.upcomingTitle")}</CardTitle><CardDescription>{t("playerMatches.upcomingDescription")}</CardDescription></div><CalendarDays className="h-5 w-5 text-primary" /></CardHeader>
          <CardContent className="space-y-3">
            {upcomingMatches.length ? upcomingMatches.map((match) => <MatchRow key={match.id} match={match} />) : <p className="rounded-md bg-muted/45 p-6 text-center text-sm text-muted-foreground">{t("playerMatches.noUpcoming")}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-start justify-between"><div><CardTitle>{t("playerMatches.lastTitle")}</CardTitle><CardDescription>{t("playerMatches.lastDescription")}</CardDescription></div><Trophy className="h-5 w-5 text-primary" /></CardHeader>
          <CardContent className="space-y-3">
            {lastMatches.length ? lastMatches.map((match) => <MatchRow key={match.id} match={match} completed />) : <p className="rounded-md bg-muted/45 p-6 text-center text-sm text-muted-foreground">{t("playerMatches.noCompleted")}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
