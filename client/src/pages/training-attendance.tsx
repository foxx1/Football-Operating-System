import { useMemo, useState } from "react";
import { useSearch } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Clock3,
  MapPin,
  ThumbsDown,
  ThumbsUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import type { Player, SessionAttendance, Team, TeamPlayer, TrainingSession } from "@shared/schema";

type StaffStatus = "present" | "absent" | "excused" | "late";
type RosterStatus = "pending" | "confirmed" | "leave_requested" | "late" | "present" | "absent" | "excused";

const staffSettableStatuses: StaffStatus[] = ["present", "late", "excused", "absent"];

function statusBadgeVariant(status: RosterStatus): "default" | "secondary" | "outline" | "destructive" {
  if (status === "pending") return "outline";
  if (status === "confirmed" || status === "present") return "default";
  if (status === "absent") return "destructive";
  return "secondary";
}

export default function TrainingAttendance() {
  const { t, isRtl } = useI18n();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("canScheduleTraining");

  const urlParams = new URLSearchParams(useSearch());
  const initialSessionId = urlParams.get("session") ? Number(urlParams.get("session")) : null;

  const { data: teams = [] } = useQuery<Team[]>({ queryKey: ["/api/teams"] });
  const { data: sessions = [] } = useQuery<TrainingSession[]>({ queryKey: ["/api/training-sessions"] });

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(initialSessionId);

  const effectiveTeamId =
    selectedTeamId ??
    (selectedSessionId ? sessions.find((s) => s.id === selectedSessionId)?.teamId : undefined) ??
    teams[0]?.id ??
    null;

  const teamSessions = useMemo(() => {
    return sessions
      .filter((s) => s.teamId === effectiveTeamId)
      .sort((a, b) => `${b.date}T${b.startTime}`.localeCompare(`${a.date}T${a.startTime}`));
  }, [sessions, effectiveTeamId]);

  const effectiveSessionId = selectedSessionId ?? teamSessions[0]?.id ?? null;
  const activeSession = teamSessions.find((s) => s.id === effectiveSessionId) ?? null;

  const { data: roster = [] } = useQuery<(TeamPlayer & { player: Player })[]>({
    queryKey: [`/api/teams/${effectiveTeamId}/players`],
    enabled: !!effectiveTeamId,
  });

  const { data: attendance = [] } = useQuery<(SessionAttendance & { player: Player })[]>({
    queryKey: [`/api/training-sessions/${effectiveSessionId}/attendance`],
    enabled: !!effectiveSessionId,
  });

  const setStatusMutation = useMutation({
    mutationFn: ({ playerId, status }: { playerId: number; status: RosterStatus }) =>
      apiRequest("POST", "/api/session-attendance", { sessionId: effectiveSessionId, playerId, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/training-sessions/${effectiveSessionId}/attendance`] });
    },
    onError: () => {
      toast({ title: t("trainingAttendance.toastErrorTitle"), variant: "destructive" });
    },
  });

  const rosterRows = roster.map(({ player }) => {
    const record = attendance.find((a) => a.playerId === player.id);
    return {
      player,
      status: (record?.status as RosterStatus) ?? "pending",
      notes: record?.notes ?? null,
    };
  });

  const confirmedCount = rosterRows.filter((r) => r.status === "confirmed" || r.status === "present").length;

  return (
    <div className="mx-auto max-w-[1480px] space-y-6 p-5 sm:p-6 xl:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge variant="secondary" className="mb-3 rounded-sm">{t("trainingAttendance.badge")}</Badge>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t("trainingAttendance.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("trainingAttendance.description")}</p>
        </div>
        <Select
          value={effectiveTeamId ? effectiveTeamId.toString() : undefined}
          onValueChange={(value) => {
            setSelectedTeamId(Number(value));
            setSelectedSessionId(null);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder={t("trainingAttendance.selectTeam")} />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
        <div className="space-y-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">{t("trainingAttendance.sessions")}</h2>
            <Badge variant="outline" className="rounded-sm">
              {translateWithParams(t, "trainingAttendance.sessionCount", { count: String(teamSessions.length) })}
            </Badge>
          </div>
          {teamSessions.length === 0 && (
            <p className="rounded-md border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
              {t("trainingAttendance.noSessions")}
            </p>
          )}
          {teamSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setSelectedSessionId(session.id)}
              className={cn(
                "w-full rounded-lg border p-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isRtl ? "text-right" : "text-left",
                effectiveSessionId === session.id
                  ? "border-primary/45 bg-card shadow-[0_20px_45px_-34px_hsl(var(--primary)/0.8)]"
                  : "border-border/60 bg-card/60 hover:border-primary/25 hover:bg-card"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{session.title}</p>
                <Badge variant="secondary" className="rounded-sm">{session.date}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{session.startTime}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{session.location}</span>
              </div>
            </button>
          ))}
        </div>

        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>{t("trainingAttendance.roster")}</CardTitle>
              <CardDescription>
                {activeSession
                  ? translateWithParams(t, "trainingAttendance.rosterFor", { title: activeSession.title })
                  : t("trainingAttendance.noSessionSelected")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 rounded-md border border-border/70 bg-card/75 px-3 py-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="font-mono text-sm font-semibold">
                {translateWithParams(t, "trainingAttendance.confirmedOf", { confirmed: String(confirmedCount), total: String(rosterRows.length) })}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {!activeSession && (
              <p className="p-3 text-sm text-muted-foreground">{t("trainingAttendance.noSessionSelected")}</p>
            )}
            {activeSession && rosterRows.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">{t("trainingAttendance.noPlayers")}</p>
            )}
            {activeSession && rosterRows.map(({ player, status, notes }) => (
              <div key={player.id} className="flex flex-col gap-3 rounded-md bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-md bg-card text-xs font-bold text-primary shadow-sm">
                    {player.firstName[0]}{player.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{player.firstName} {player.lastName}</p>
                    {notes && <p className="text-xs text-muted-foreground">{notes}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusBadgeVariant(status)} className="rounded-sm">
                    {t(`trainingAttendance.status.${status}`)}
                  </Badge>
                  {canEdit && status === "leave_requested" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2 text-xs"
                        disabled={setStatusMutation.isPending}
                        onClick={() => setStatusMutation.mutate({ playerId: player.id, status: "excused" })}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />{t("trainingAttendance.approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2 text-xs"
                        disabled={setStatusMutation.isPending}
                        onClick={() => setStatusMutation.mutate({ playerId: player.id, status: "absent" })}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />{t("trainingAttendance.decline")}
                      </Button>
                    </>
                  )}
                  {canEdit && (
                    <Select
                      value={staffSettableStatuses.includes(status as StaffStatus) ? status : undefined}
                      onValueChange={(value) => setStatusMutation.mutate({ playerId: player.id, status: value as RosterStatus })}
                    >
                      <SelectTrigger className="h-7 w-32 text-xs">
                        <SelectValue placeholder={t("trainingAttendance.setStatus")} />
                      </SelectTrigger>
                      <SelectContent>
                        {staffSettableStatuses.map((option) => (
                          <SelectItem key={option} value={option}>{t(`trainingAttendance.status.${option}`)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
