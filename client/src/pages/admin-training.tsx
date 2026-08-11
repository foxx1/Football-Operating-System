import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Plus, Clock, MapPin, Calendar, Pencil, Trash2, Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useMyTeams } from "@/hooks/use-my-teams";
import { useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";
import type { TrainingSession } from "@shared/schema";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_NAMES_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function getDayName(date: string, isRtl: boolean) {
  const d = new Date(date);
  const idx = d.getDay();
  return isRtl ? DAY_NAMES_AR[idx] : DAY_NAMES[idx];
}

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

interface AddForm {
  teamId: string;
  date: string;
  startTime: string;
  location: string;
}

interface EditForm {
  startTime: string;
  location: string;
}

export default function AdminTraining() {
  const { t, isRtl } = useI18n();
  const { toast } = useToast();
  const { teams, isLoading: teamsLoading } = useMyTeams();

  const [showAdd, setShowAdd] = useState(false);
  const [editSession, setEditSession] = useState<TrainingSession | null>(null);
  const [deleteSession, setDeleteSession] = useState<TrainingSession | null>(null);

  const [addForm, setAddForm] = useState<AddForm>({
    teamId: "",
    date: "",
    startTime: "",
    location: "",
  });
  const [editForm, setEditForm] = useState<EditForm>({ startTime: "", location: "" });

  // Sessions come back already scoped to the administrator's teams.
  const { data: allSessions = [], isLoading: sessionsLoading } = useQuery<TrainingSession[]>({
    queryKey: ["/api/training-sessions"],
  });

  const sessions = useMemo(() => {
    return [...allSessions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [allSessions]);

  const teamMap = useMemo(
    () => new Map(teams.map((t) => [t.id, t])),
    [teams]
  );

  const addMutation = useMutation({
    mutationFn: (body: AddForm) =>
      apiRequest("POST", "/api/admin/training-sessions", {
        teamId: parseInt(body.teamId),
        date: body.date,
        startTime: body.startTime,
        location: body.location,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-sessions"] });
      setShowAdd(false);
      setAddForm({ teamId: "", date: "", startTime: "", location: "" });
      toast({ title: t("adminTraining.toast.added") });
    },
    onError: () => {
      toast({ title: t("adminTraining.toast.addFailed"), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EditForm }) =>
      apiRequest("PUT", `/api/training-sessions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-sessions"] });
      setEditSession(null);
      toast({ title: t("adminTraining.toast.updated") });
    },
    onError: () => {
      toast({ title: t("adminTraining.toast.updateFailed"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/training-sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-sessions"] });
      setDeleteSession(null);
      toast({ title: t("adminTraining.toast.deleted") });
    },
    onError: () => {
      toast({ title: t("adminTraining.toast.deleteFailed"), variant: "destructive" });
    },
  });

  const openEdit = (session: TrainingSession) => {
    setEditSession(session);
    setEditForm({ startTime: session.startTime, location: session.location });
  };

  const handleAdd = () => {
    if (!addForm.date || !addForm.startTime || !addForm.location) return;
    const teamId = teams.length === 1 ? String(teams[0].id) : addForm.teamId;
    if (!teamId) return;
    addMutation.mutate({ ...addForm, teamId });
  };

  const handleEdit = () => {
    if (!editSession || !editForm.startTime || !editForm.location) return;
    editMutation.mutate({ id: editSession.id, data: editForm });
  };

  const addValid =
    addForm.date &&
    addForm.startTime &&
    addForm.location &&
    (teams.length <= 1 || addForm.teamId);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="p-6 space-y-6">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRtl && "flex-row-reverse")}>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("adminTraining.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("adminTraining.subtitle")}</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className={cn("gap-2", isRtl && "flex-row-reverse")}>
          <Plus className="h-4 w-4" />
          {t("adminTraining.addSession")}
        </Button>
      </div>

      {/* Sessions list */}
      {sessionsLoading || teamsLoading ? (
        <div className="text-muted-foreground text-sm">{t("app.loading")}</div>
      ) : sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
          <Calendar className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p>{t("adminTraining.noSessions")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const team = teamMap.get(session.teamId ?? 0);
            return (
              <Card key={session.id} className="border border-border/60">
                <CardContent className={cn("flex items-center gap-4 py-4 px-5", isRtl && "flex-row-reverse")}>
                  {/* Day badge */}
                  <div className="w-20 shrink-0 text-center">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {getDayName(session.date, isRtl)}
                    </p>
                    <p className="text-sm font-bold text-foreground">{formatDate(session.date)}</p>
                  </div>

                  {/* Divider */}
                  <div className="h-10 w-px bg-border shrink-0" />

                  {/* Time + Venue */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className={cn("flex items-center gap-2 text-sm", isRtl && "flex-row-reverse")}>
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium">{session.startTime}</span>
                    </div>
                    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", isRtl && "flex-row-reverse")}>
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{session.location}</span>
                    </div>
                  </div>

                  {/* Team badge */}
                  {team && (
                    <div className={cn("flex items-center gap-1.5 shrink-0", isRtl && "flex-row-reverse")}>
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <Badge variant="secondary" className="text-xs">{team.name}</Badge>
                    </div>
                  )}

                  {/* Actions */}
                  <div className={cn("flex items-center gap-2 shrink-0", isRtl && "flex-row-reverse")}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(session)}
                      className="gap-1.5"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {t("adminTraining.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                      onClick={() => setDeleteSession(session)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("adminTraining.delete")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Session Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent dir={isRtl ? "rtl" : "ltr"} className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("adminTraining.addSession")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Team select — only if multiple teams */}
            {teams.length > 1 && (
              <div className="space-y-1.5">
                <Label>{t("adminTraining.team")}</Label>
                <Select
                  value={addForm.teamId}
                  onValueChange={(v) => setAddForm((f) => ({ ...f, teamId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("adminTraining.selectTeam")} />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={String(team.id)}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="add-date">{t("adminTraining.date")}</Label>
              <Input
                id="add-date"
                type="date"
                value={addForm.date}
                onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>

            {/* Start Time */}
            <div className="space-y-1.5">
              <Label htmlFor="add-time">{t("adminTraining.time")}</Label>
              <Input
                id="add-time"
                type="time"
                value={addForm.startTime}
                onChange={(e) => setAddForm((f) => ({ ...f, startTime: e.target.value }))}
              />
            </div>

            {/* Venue */}
            <div className="space-y-1.5">
              <Label htmlFor="add-venue">{t("adminTraining.venue")}</Label>
              <Input
                id="add-venue"
                placeholder={t("adminTraining.venuePlaceholder")}
                value={addForm.location}
                onChange={(e) => setAddForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className={cn(isRtl && "flex-row-reverse")}>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              {t("adminTraining.cancel")}
            </Button>
            <Button onClick={handleAdd} disabled={!addValid || addMutation.isPending}>
              {addMutation.isPending ? t("adminTraining.adding") : t("adminTraining.addSession")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={!!editSession} onOpenChange={(open) => { if (!open) setEditSession(null); }}>
        <DialogContent dir={isRtl ? "rtl" : "ltr"} className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("adminTraining.editSession")}</DialogTitle>
          </DialogHeader>
          {editSession && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                {getDayName(editSession.date, isRtl)}, {formatDate(editSession.date)}
              </p>

              {/* Start Time */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-time">{t("adminTraining.time")}</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>

              {/* Venue */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-venue">{t("adminTraining.venue")}</Label>
                <Input
                  id="edit-venue"
                  value={editForm.location}
                  onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
            </div>
          )}
          <DialogFooter className={cn(isRtl && "flex-row-reverse")}>
            <Button variant="outline" onClick={() => setEditSession(null)}>
              {t("adminTraining.cancel")}
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editForm.startTime || !editForm.location || editMutation.isPending}
            >
              {editMutation.isPending ? t("adminTraining.saving") : t("adminTraining.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSession} onOpenChange={(open) => { if (!open) setDeleteSession(null); }}>
        <AlertDialogContent dir={isRtl ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("adminTraining.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteSession && (
                <>
                  {getDayName(deleteSession.date, isRtl)}, {formatDate(deleteSession.date)} — {deleteSession.startTime} @ {deleteSession.location}
                  <br />
                  {t("adminTraining.deleteDesc")}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={cn(isRtl && "flex-row-reverse")}>
            <AlertDialogCancel>{t("adminTraining.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteSession && deleteMutation.mutate(deleteSession.id)}
              disabled={deleteMutation.isPending}
            >
              {t("adminTraining.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
