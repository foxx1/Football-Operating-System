import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Trophy, Calendar, MapPin, Users, Edit, Clock, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Match } from "@shared/schema";
import MatchForm from "@/components/match-form";
import MatchResultForm from "@/components/match-result-form";
import MatchSquadManager from "@/components/match-squad-manager";
import { useI18n, translateWithParams } from "@/contexts/I18nContext";

interface GoalEvent {
  minute: number;
  half: 1 | 2;
  team: "home" | "away";
  scorerName: string;
  assistName?: string;
}

export default function MatchesPage() {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [squadMatch, setSquadMatch] = useState<Match | null>(null);
  const [resultMatch, setResultMatch] = useState<Match | null>(null);
  const { toast } = useToast();

  const { data: matches = [], isLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const filteredMatches = matches.filter((match: Match) => {
    const matchesSearch =
      match.awayTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.competition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || match.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300",
      ongoing: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300",
      completed: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
      cancelled: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300",
      postponed: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300",
    };
    return colors[status] ?? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
  };

  const getCompetitionColor = (competition: string) => {
    const colors: Record<string, string> = {
      league: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900",
      cup: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900",
      friendly: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900",
    };
    return colors[competition] ?? "bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("matches.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("matches.description")}</p>
        </div>

        <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t("matches.scheduleMatch")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("matches.scheduleNewMatch")}</DialogTitle>
            </DialogHeader>
            <MatchForm onSuccess={() => setIsScheduleOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={t("matches.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">{t("matches.allMatches")}</option>
          <option value="scheduled">{t("matches.status.scheduled")}</option>
          <option value="ongoing">{t("matches.status.ongoing")}</option>
          <option value="completed">{t("matches.status.completed")}</option>
          <option value="cancelled">{t("matches.status.cancelled")}</option>
          <option value="postponed">{t("matches.status.postponed")}</option>
        </select>
      </div>

      {/* ── Edit Match Dialog ── */}
      <Dialog open={!!editMatch} onOpenChange={(open) => { if (!open) setEditMatch(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("matches.editMatch")}</DialogTitle>
          </DialogHeader>
          {editMatch && (
            <MatchForm match={editMatch} onSuccess={() => setEditMatch(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Result Dialog ── */}
      <Dialog open={!!resultMatch} onOpenChange={(open) => { if (!open) setResultMatch(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-green-600" />
              {t("matches.matchResult")}
            </DialogTitle>
          </DialogHeader>
          {resultMatch && (
            <MatchResultForm match={resultMatch} onSuccess={() => setResultMatch(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Squad Dialog ── */}
      <Dialog open={!!squadMatch} onOpenChange={(open) => { if (!open) setSquadMatch(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{translateWithParams(t, "matches.squadVs", { team: squadMatch?.awayTeam || "" })}</DialogTitle>
          </DialogHeader>
          {squadMatch && <MatchSquadManager match={squadMatch} />}
        </DialogContent>
      </Dialog>

      {/* ── Matches Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMatches.map((match: Match) => {
          const goals = (match.goalEvents as GoalEvent[] | null) ?? [];
          const homeGoals = goals.filter((g) => g.team === "home");
          const awayGoals = goals.filter((g) => g.team === "away");

          return (
            <Card
              key={match.id}
              className={`hover:shadow-lg transition-shadow ${getCompetitionColor(match.competition)}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`text-xs ${getStatusColor(match.status)}`}>
                        {t(`matches.status.${match.status}`) || match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {match.competition}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mb-1">
                      {translateWithParams(t, "matches.firstTeamVs", { team: match.awayTeam })}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground capitalize">
                      {translateWithParams(t, "matches.matchType", { type: match.matchType })}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{new Date(match.date).toLocaleDateString()}</span>
                  <Clock className="w-4 h-4 ml-4 mr-1" />
                  <span>{match.kickoffTime}</span>
                </div>

                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="truncate">{match.venue}</span>
                </div>

                {/* ── Result block for completed matches ── */}
                {match.status === "completed" &&
                  match.homeScore !== null &&
                  match.awayScore !== null && (
                    <div className="bg-gray-900 rounded-xl p-3 text-center">
                      {/* Full time */}
                      <p className="text-3xl font-extrabold text-white">
                        {match.homeScore}
                        <span className="text-gray-500 mx-2">–</span>
                        {match.awayScore}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{t("matches.fullTime")}</p>

                      {/* Half-time breakdown */}
                      {match.firstHalfHomeScore !== null &&
                        match.firstHalfAwayScore !== null && (
                          <p className="text-xs text-gray-500 mt-1">
                            {t("matches.ht")} {match.firstHalfHomeScore}–{match.firstHalfAwayScore}
                            {match.secondHalfHomeScore !== null &&
                              match.secondHalfAwayScore !== null && (
                                <span>
                                  &nbsp;| {t("matches.secondHalf")} {match.secondHalfHomeScore}–{match.secondHalfAwayScore}
                                </span>
                              )}
                          </p>
                        )}

                      {/* Goal scorers */}
                      {goals.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-700 space-y-0.5 text-left">
                          {[...goals]
                            .sort((a, b) => a.minute - b.minute)
                            .map((g, i) => (
                              <p key={i} className="text-xs text-gray-300">
                                <span className="text-green-400 font-mono mr-1">{g.minute}&apos;</span>
                                <span className="font-medium">{g.scorerName}</span>
                                {g.assistName && (
                                  <span className="text-gray-500"> (A: {g.assistName})</span>
                                )}
                                <span className={`ml-1 text-gray-600`}>
                                  {g.team === "away" ? "✈️" : ""}
                                </span>
                              </p>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                {match.attendance && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{translateWithParams(t, "matches.attendance", { attendance: match.attendance.toLocaleString() })}</span>
                  </div>
                )}

                {match.weatherConditions && (
                  <div className="text-xs text-muted-foreground">
                    {translateWithParams(t, "matches.weather", { weather: match.weatherConditions })}
                  </div>
                )}

                {/* ── Action buttons ── */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditMatch(match)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    {t("matches.edit")}
                  </Button>

                  {match.status !== "cancelled" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30"
                      onClick={() => setResultMatch(match)}
                    >
                      <ClipboardList className="w-4 h-4 mr-1" />
                      {t("matches.result")}
                    </Button>
                  )}

                  {match.status === "scheduled" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSquadMatch(match)}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      {t("matches.squad")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMatches.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">{t("matches.noMatches")}</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedStatus !== "all"
                ? t("matches.noSearchResults")
                : t("matches.getStarted")}
            </p>
            {!searchTerm && selectedStatus === "all" && (
              <Button onClick={() => setIsScheduleOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t("matches.scheduleMatch")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
