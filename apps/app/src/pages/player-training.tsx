import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, CalendarDays, Check, CheckCircle2, Clock3, MapPin, MessageSquareText, TimerReset, UserRoundCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import type { Player, SessionAttendance, Team, TeamPlayer, TrainingSession } from "@shared/schema";

type AttendanceChoice = "confirmed" | "leave" | "late";
type RosterStatus = "pending" | "confirmed" | "leave_requested" | "late" | "present" | "absent" | "excused";

function statusLabelKey(status: RosterStatus) {
  if (status === "pending") return "playerTraining.status.awaiting";
  if (status === "leave_requested") return "playerTraining.status.leaveRequested";
  return `playerTraining.status.${status}`;
}

export default function PlayerTraining() {
  const { isRtl, t } = useI18n();
  const { toast } = useToast();

  const { data: myTeams = [] } = useQuery<Team[]>({ queryKey: ["/api/dashboard/my-teams"] });
  const { data: allSessions = [] } = useQuery<TrainingSession[]>({ queryKey: ["/api/training-sessions"] });
  const { data: profile } = useQuery<{ player: Player | null }>({ queryKey: ["/api/player/profile"] });

  const teamIds = myTeams.map((team) => team.id);
  const today = new Date().toISOString().split("T")[0];
  const sessions = allSessions
    .filter((session) => teamIds.includes(session.teamId) && session.date >= today)
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));

  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [choice, setChoice] = useState<AttendanceChoice>("confirmed");
  const [reason, setReason] = useState("");

  const activeSession = sessions.find((session) => session.id === selectedSessionId) ?? sessions[0] ?? null;
  const myPlayerId = profile?.player?.id ?? null;

  const { data: roster = [] } = useQuery<(TeamPlayer & { player: Player })[]>({
    queryKey: [`/api/teams/${activeSession?.teamId}/players`],
    enabled: !!activeSession,
  });
  const { data: attendance = [] } = useQuery<(SessionAttendance & { player: Player })[]>({
    queryKey: [`/api/training-sessions/${activeSession?.id}/attendance`],
    enabled: !!activeSession,
  });

  const myRecord = attendance.find((a) => a.playerId === myPlayerId);
  const myStatus: RosterStatus = (myRecord?.status as RosterStatus) ?? "pending";
  const needsReason = choice === "leave" || choice === "late";

  const rosterRows = roster
    .map(({ player }) => {
      const record = attendance.find((a) => a.playerId === player.id);
      return {
        playerId: player.id,
        name: player.id === myPlayerId ? t("playerTraining.you") : `${player.firstName} ${player.lastName}`,
        initials: `${player.firstName[0] ?? ""}${player.lastName[0] ?? ""}`,
        status: (record?.status as RosterStatus) ?? "pending",
        isMe: player.id === myPlayerId,
      };
    })
    .sort((a, b) => (a.isMe === b.isMe ? 0 : a.isMe ? -1 : 1));

  const submitMutation = useMutation({
    mutationFn: () => {
      const status: RosterStatus = choice === "confirmed" ? "confirmed" : choice === "leave" ? "leave_requested" : "late";
      return apiRequest("POST", "/api/session-attendance", {
        sessionId: activeSession!.id,
        playerId: myPlayerId,
        status,
        notes: reason.trim() || undefined,
      });
    },
    onSuccess: (_data, _vars) => {
      queryClient.invalidateQueries({ queryKey: [`/api/training-sessions/${activeSession?.id}/attendance`] });
      const status: RosterStatus = choice === "confirmed" ? "confirmed" : choice === "leave" ? "leave_requested" : "late";
      toast({
        title: t("playerTraining.toastUpdatedTitle"),
        description: translateWithParams(t, "playerTraining.toastUpdatedDescription", {
          title: activeSession?.title ?? "",
          status: t(statusLabelKey(status)).toLowerCase(),
        }),
      });
      setReason("");
    },
    onError: () => {
      toast({ title: t("playerTraining.toastErrorTitle"), variant: "destructive" });
    },
  });

  const submitAttendance = () => {
    if (needsReason && !reason.trim()) {
      toast({
        title: t("playerTraining.toastReasonRequiredTitle"),
        description: translateWithParams(t, "playerTraining.toastReasonRequiredDescription", {
          type: choice === "leave" ? t("playerTraining.leaveRequestType") : t("playerTraining.lateArrivalType"),
        }),
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-[1480px] space-y-6 p-5 sm:p-6 xl:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><Badge variant="secondary" className="mb-3 rounded-sm">{t("playerTraining.badge")}</Badge><h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t("playerTraining.title")}</h1><p className="mt-2 text-muted-foreground">{t("playerTraining.description")}</p></div>
        <div className="flex items-center gap-3 rounded-md border border-border/70 bg-card/75 px-4 py-3"><UserRoundCheck className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">{t("playerTraining.attendanceThisMonth")}</p><p className="font-mono text-lg font-semibold">94%</p></div></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
        <div className="space-y-3">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{t("playerTraining.scheduledTraining")}</h2><Badge variant="outline" className="rounded-sm">{translateWithParams(t, "playerTraining.upcomingCount", { count: String(sessions.length) })}</Badge></div>
          {sessions.length === 0 && (
            <p className="rounded-md border border-dashed border-border/70 p-4 text-sm text-muted-foreground">{t("playerTraining.noUpcomingSessions")}</p>
          )}
          {sessions.map((session) => (
            <button key={session.id} onClick={() => { setSelectedSessionId(session.id); setChoice("confirmed"); setReason(""); }} className={cn("w-full rounded-lg border p-4 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isRtl ? "text-right" : "text-left", (activeSession?.id ?? sessions[0]?.id) === session.id ? "border-primary/45 bg-card shadow-[0_20px_45px_-34px_hsl(var(--primary)/0.8)]" : "border-border/60 bg-card/60 hover:border-primary/25 hover:bg-card")}>
              <div className="flex items-start justify-between gap-3"><div className="flex gap-3"><div className={cn("rounded-md p-2.5", (activeSession?.id ?? sessions[0]?.id) === session.id ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}><Activity className="h-5 w-5" /></div><div><p className="font-semibold">{session.title}</p><p className="mt-1 text-sm text-muted-foreground">{session.sessionType}</p></div></div><Badge variant="secondary" className="rounded-sm">{session.date}</Badge></div>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-border/50 pt-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{session.startTime} · {session.duration} min</span><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{session.location}</span></div>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden border-primary/20">
            <CardHeader className="bg-primary/[0.06]">
              <div className="flex items-start justify-between gap-4"><div><CardTitle>{t("playerTraining.confirmAttendance")}</CardTitle><CardDescription className="mt-1">{activeSession ? translateWithParams(t, "playerTraining.sessionAt", { title: activeSession.title, date: activeSession.date, time: activeSession.startTime }) : t("playerTraining.noUpcomingSessions")}</CardDescription></div><CalendarDays className="h-5 w-5 text-primary" /></div>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { id: "confirmed", label: t("playerTraining.choice.confirmed.label"), note: t("playerTraining.choice.confirmed.note"), icon: CheckCircle2 },
                  { id: "leave", label: t("playerTraining.choice.leave.label"), note: t("playerTraining.choice.leave.note"), icon: MessageSquareText },
                  { id: "late", label: t("playerTraining.choice.late.label"), note: t("playerTraining.choice.late.note"), icon: TimerReset },
                ].map(({ id, label, note, icon: Icon }) => (
                  <button key={id} disabled={!activeSession} onClick={() => setChoice(id as AttendanceChoice)} className={cn("rounded-md border p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50", isRtl ? "text-right" : "text-left", choice === id ? "border-primary bg-primary/10 text-foreground" : "border-border/70 hover:border-primary/35")}>
                    <div className="flex items-center justify-between"><Icon className={cn("h-5 w-5", choice === id ? "text-primary" : "text-muted-foreground")} />{choice === id && <Check className="h-4 w-4 text-primary" />}</div><p className="mt-3 text-sm font-semibold">{label}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p>
                  </button>
                ))}
              </div>
              {needsReason && <div className="space-y-2"><label htmlFor="attendance-reason" className="text-sm font-semibold">{t("playerTraining.reasonLabel")} <span className="text-destructive">*</span></label><Textarea id="attendance-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder={choice === "leave" ? t("playerTraining.reasonPlaceholder.leave") : t("playerTraining.reasonPlaceholder.late")} className="min-h-24 resize-none" /></div>}
              {myStatus !== "pending" && <div className="rounded-md bg-primary/10 p-3 text-sm"><p className="font-semibold text-primary">{translateWithParams(t, "playerTraining.currentResponse", { status: t(statusLabelKey(myStatus)) })}</p>{myRecord?.notes && <p className="mt-1 text-muted-foreground">{myRecord.notes}</p>}</div>}
              <Button onClick={submitAttendance} disabled={!activeSession || !myPlayerId || submitMutation.isPending} className="w-full sm:w-auto">{t("playerTraining.updateAttendance")}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between"><div><CardTitle>{t("playerTraining.attendanceList")}</CardTitle><CardDescription>{activeSession ? translateWithParams(t, "playerTraining.responsesFor", { title: activeSession.title }) : ""}</CardDescription></div><Users className="h-5 w-5 text-primary" /></CardHeader>
            <CardContent className="space-y-2">
              {rosterRows.map((row) => (
                <div key={row.playerId} className={cn("flex items-center justify-between gap-3 rounded-md p-3", row.isMe ? "bg-primary/[0.07]" : "bg-muted/40")}>
                  <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-md bg-card text-xs font-bold text-primary shadow-sm">{row.initials}</div><div><p className="text-sm font-semibold">{row.name}</p>{row.isMe && <p className="text-xs text-muted-foreground">{t("playerTraining.yourResponseHint")}</p>}</div></div>
                  <Badge variant={row.status === "confirmed" || row.status === "present" ? "default" : row.status === "pending" ? "outline" : "secondary"} className="rounded-sm">{t(statusLabelKey(row.status))}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
