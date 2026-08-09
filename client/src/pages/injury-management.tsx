import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  ClipboardList,
  HeartPulse,
  Plus,
  Stethoscope,
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { BodyPartPreview, SEVERITY_COLORS, translateBodyPart } from "@/components/body-map-selector";
import {
  getDaysRemaining,
  mockInjuries,
  mockTreatmentLogs,
  severityConfig,
  statusConfig,
  treatmentTypes,
  type InjuryStatus,
  type MockInjury,
  type TreatmentLogEntry,
} from "@/lib/mock-injuries";

const daysSinceInjury = (injuryDate: string) => {
  const now = new Date();
  const start = new Date(injuryDate);
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

export default function InjuryManagement() {
  const { t, locale } = useI18n();
  const dateLocale = locale === "ar" ? ar : enUS;
  const { toast } = useToast();

  // Session-local copy: statuses updated and treatment entries logged here
  // don't persist to the shared mock dataset (no backend yet), same as the
  // rest of the injury module.
  const [injuries, setInjuries] = useState<MockInjury[]>(() => mockInjuries.map((i) => ({ ...i })));
  const [logsByInjury, setLogsByInjury] = useState<Record<number, TreatmentLogEntry[]>>(() =>
    Object.fromEntries(mockInjuries.map((i) => [i.id, mockTreatmentLogs[i.id] ? [...mockTreatmentLogs[i.id]] : []]))
  );
  const [managingId, setManagingId] = useState<number | null>(null);
  const [logDate, setLogDate] = useState<Date | undefined>(new Date());
  const [logType, setLogType] = useState("");
  const [logMedicine, setLogMedicine] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [caseFilter, setCaseFilter] = useState<"all" | "out" | "recovering">("all");

  const activeInjuries = injuries.filter((i) => i.status !== "available");
  const visibleInjuries = activeInjuries.filter((i) => caseFilter === "all" || i.status === caseFilter);
  const managingInjury = injuries.find((i) => i.id === managingId) ?? null;
  const managingLogs = managingId ? logsByInjury[managingId] ?? [] : [];

  const stats = {
    activeCases: activeInjuries.length,
    out: activeInjuries.filter((i) => i.status === "out").length,
    recovering: activeInjuries.filter((i) => i.status === "recovering").length,
    totalLogged: Object.values(logsByInjury).reduce((sum, logs) => sum + logs.length, 0),
  };

  const casesRef = useRef<HTMLDivElement>(null);
  const scrollToCases = () => casesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const toggleCaseFilter = (status: "out" | "recovering") =>
    setCaseFilter((prev) => (prev === status ? "all" : status));

  const resetLogForm = () => {
    setLogDate(new Date());
    setLogType("");
    setLogMedicine("");
    setLogNotes("");
  };

  const openManage = (injury: MockInjury) => {
    setManagingId(injury.id);
    resetLogForm();
  };

  const handleAddLog = () => {
    if (!managingInjury) return;
    if (!logType) {
      toast({
        title: t("injury.manage.toastMissingTypeTitle"),
        description: t("injury.manage.toastMissingTypeDesc"),
        variant: "destructive",
      });
      return;
    }

    const entry: TreatmentLogEntry = {
      id: Date.now(),
      date: (logDate ?? new Date()).toISOString().slice(0, 10),
      treatmentType: logType,
      medicineCourse: logMedicine.trim(),
      notes: logNotes.trim(),
    };

    setLogsByInjury((prev) => ({
      ...prev,
      [managingInjury.id]: [entry, ...(prev[managingInjury.id] ?? [])],
    }));

    toast({
      title: t("injury.manage.toastLogAddedTitle"),
      description: translateWithParams(t, "injury.manage.toastLogAddedDesc", { player: managingInjury.playerName }),
    });

    resetLogForm();
  };

  const handleStatusChange = (status: InjuryStatus) => {
    if (!managingInjury) return;
    setInjuries((prev) => prev.map((i) => (i.id === managingInjury.id ? { ...i, status } : i)));
    toast({
      title: t("injury.manage.toastStatusUpdatedTitle"),
      description: translateWithParams(t, "injury.manage.toastStatusUpdatedDesc", {
        player: managingInjury.playerName,
        status: t(statusConfig[status].label),
      }),
    });
  };

  const formatDate = (value: string) => new Date(value).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US");

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/20">
            <HeartPulse className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("injury.manage.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("injury.manage.description")}</p>
          </div>
        </div>
      </div>

      {/* Stats — click a status card to filter the cases below to that subset */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          onClick={() => { setCaseFilter("all"); scrollToCases(); }}
          className={cn(
            "bg-gradient-to-br from-card to-card/80 border-border/50 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/50 hover:shadow-md",
            caseFilter === "all" && "ring-2 ring-blue-400/60 border-blue-400/50"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("injury.manage.statActiveCases")}</p>
                <p className="text-2xl font-bold mt-1">{stats.activeCases}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/15">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          onClick={() => { toggleCaseFilter("out"); scrollToCases(); }}
          className={cn(
            "bg-gradient-to-br from-card to-card/80 border-border/50 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-400/50 hover:shadow-md",
            caseFilter === "out" && "ring-2 ring-rose-400/60 border-rose-400/50"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("injury.manage.statOut")}</p>
                <p className="text-2xl font-bold mt-1 text-rose-400">{stats.out}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/15">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          onClick={() => { toggleCaseFilter("recovering"); scrollToCases(); }}
          className={cn(
            "bg-gradient-to-br from-card to-card/80 border-border/50 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/50 hover:shadow-md",
            caseFilter === "recovering" && "ring-2 ring-amber-400/60 border-amber-400/50"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("injury.manage.statRecovering")}</p>
                <p className="text-2xl font-bold mt-1 text-amber-400">{stats.recovering}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/15">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("injury.manage.statLogged")}</p>
                <p className="text-2xl font-bold mt-1 text-emerald-400">{stats.totalLogged}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/15">
                <ClipboardList className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active cases */}
      {activeInjuries.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-10 text-center text-muted-foreground flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <p>{t("injury.manage.noActiveInjuries")}</p>
          </CardContent>
        </Card>
      ) : visibleInjuries.length === 0 ? (
        <Card ref={casesRef} className="border-border/50 scroll-mt-4">
          <CardContent className="p-10 text-center text-muted-foreground">
            <p>{t("injury.manage.noFilterResults")}</p>
          </CardContent>
        </Card>
      ) : (
        <div ref={casesRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 scroll-mt-4">
          {visibleInjuries.map((injury) => {
            const severity = severityConfig[injury.severity];
            const status = statusConfig[injury.status];
            const StatusIcon = status.icon;
            const logs = logsByInjury[injury.id] ?? [];
            const latestLog = logs[0];

            return (
              <Card key={injury.id} className="border-border/50 overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <BodyPartPreview
                      bodyPart={injury.bodyPart}
                      color={SEVERITY_COLORS[injury.severity]}
                      className="w-14 shrink-0 rounded-md border border-border/50 bg-muted/20 p-1"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{injury.playerName}</p>
                      <p className="text-xs text-muted-foreground truncate">{injury.teamName} · {t(`injuryType.${injury.injuryType}`)}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Badge className={cn("border font-medium", severity.bgColor, severity.color)}>
                          {t(severity.label)}
                        </Badge>
                        <Badge className={cn("border font-medium", status.bgColor, status.color)}>
                          <StatusIcon className="w-3 h-3 me-1" />
                          {t(status.label)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {translateWithParams(t, "injury.manage.daysSinceInjury", { count: String(daysSinceInjury(injury.injuryDate)) })}
                  </p>

                  <div className="rounded-lg bg-muted/30 border border-border/30 p-2.5 text-xs space-y-1">
                    <p className="font-medium text-muted-foreground">{t("injury.manage.treatmentHistoryTitle")}</p>
                    {latestLog ? (
                      <p className="text-foreground">
                        {formatDate(latestLog.date)} — {t(`treatmentType.${latestLog.treatmentType}`)}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">{t("injury.manage.noTreatmentLogs")}</p>
                    )}
                    {logs.length > 1 && (
                      <p className="text-muted-foreground">
                        {translateWithParams(t, "injury.manage.moreEntries", { count: String(logs.length - 1) })}
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white"
                    onClick={() => openManage(injury)}
                  >
                    <Stethoscope className="w-3.5 h-3.5 me-2" />
                    {t("injury.manage.manageButton")}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Manage Treatment Dialog */}
      <Dialog open={!!managingInjury} onOpenChange={(open) => !open && setManagingId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {managingInjury && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <BodyPartPreview
                    bodyPart={managingInjury.bodyPart}
                    color={SEVERITY_COLORS[managingInjury.severity]}
                    className="w-12 shrink-0 rounded-md border border-border/50 bg-muted/20 p-1"
                  />
                  <div>
                    <DialogTitle>{managingInjury.playerName}</DialogTitle>
                    <DialogDescription>
                      {t(`injuryType.${managingInjury.injuryType}`)} · {translateBodyPart(t, managingInjury.bodyPart)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 pt-1">
                {/* Recovery status */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-rose-400">
                    <HeartPulse className="w-4 h-4" />
                    {t("injury.manage.updateStatusTitle")}
                  </div>
                  <Select value={managingInjury.status} onValueChange={(v) => handleStatusChange(v as InjuryStatus)}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="out">{t("status.out")}</SelectItem>
                      <SelectItem value="recovering">{t("status.recovering")}</SelectItem>
                      <SelectItem value="available">{t("status.available")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t("injury.manage.markAvailableHint")}</p>
                </div>

                <div className="border-t border-border/50" />

                {/* Add new treatment */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                    <Plus className="w-4 h-4" />
                    {t("injury.manage.addLogTitle")}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("injury.manage.dateLabel")}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full h-10 justify-start text-start font-normal", !logDate && "text-muted-foreground")}
                          >
                            <CalendarDays className="me-2 h-4 w-4" />
                            {logDate ? format(logDate, "PPP", { locale: dateLocale }) : t("injury.add.pickDate")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={logDate} onSelect={setLogDate} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t("injury.manage.treatmentTypeLabel")}</Label>
                      <Select value={logType} onValueChange={setLogType}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder={t("injury.manage.treatmentTypePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {treatmentTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {t(`treatmentType.${type}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">{t("injury.manage.medicineCourseLabel")}</Label>
                      <Input
                        placeholder={t("injury.manage.medicineCoursePlaceholder")}
                        value={logMedicine}
                        onChange={(e) => setLogMedicine(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">{t("injury.manage.logNotesLabel")}</Label>
                      <Textarea
                        placeholder={t("injury.manage.logNotesPlaceholder")}
                        value={logNotes}
                        onChange={(e) => setLogNotes(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddLog} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 me-2" />
                    {t("injury.manage.addLogButton")}
                  </Button>
                </div>

                <div className="border-t border-border/50" />

                {/* Treatment history */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                    <ClipboardList className="w-4 h-4" />
                    {t("injury.manage.treatmentHistoryTitle")}
                  </div>
                  {managingLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("injury.manage.noTreatmentLogs")}</p>
                  ) : (
                    <div className="space-y-2">
                      {managingLogs.map((log) => (
                        <div key={log.id} className="rounded-lg border border-border/30 bg-muted/20 p-3 space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{t(`treatmentType.${log.treatmentType}`)}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              {formatDate(log.date)}
                            </span>
                          </div>
                          {log.medicineCourse && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">{t("injury.manage.medicineCourseLabel")}:</span> {log.medicineCourse}
                            </p>
                          )}
                          {log.notes && <p className="text-xs text-muted-foreground">{log.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
