import { useRef, useState } from "react";
import { useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  HeartPulse,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Activity,
  Users,
  TrendingDown,
  CalendarDays,
  Stethoscope,
  ClipboardList,
} from "lucide-react";
import type { Player, Team } from "@shared/schema";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";
import { BodyPartPreview, SEVERITY_COLORS, translateBodyPart } from "@/components/body-map-selector";
import { getDaysRemaining, mockInjuries, severityConfig, statusConfig, type InjuryStatus, type MockInjury, type Severity } from "@/lib/mock-injuries";

export default function InjuryList() {
  // Cards on the injury report page deep-link here with these params
  // (e.g. /injuries?team=First+Team&stat=severe) so a click there lands
  // directly on the matching filtered view instead of just the bare list.
  const urlParams = new URLSearchParams(useSearch());
  const initialStat = urlParams.get("stat");

  const [searchTerm, setSearchTerm] = useState(urlParams.get("search") ?? "");
  const [teamFilter, setTeamFilter] = useState(urlParams.get("team") ?? "all");
  const [statusFilter, setStatusFilter] = useState(urlParams.get("status") ?? "all");
  const [severityFilter, setSeverityFilter] = useState(urlParams.get("severity") ?? "all");
  const [bodyPartFilter, setBodyPartFilter] = useState(urlParams.get("bodyPart") ?? "");
  const [activeOnly, setActiveOnly] = useState(initialStat === "active");
  const [selectedInjury, setSelectedInjury] = useState<MockInjury | null>(null);
  const { t, isRtl, locale } = useI18n();

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const filteredInjuries = mockInjuries.filter((injury) => {
    const matchesSearch =
      injury.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      injury.injuryType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = teamFilter === "all" || injury.teamName === teamFilter;
    const matchesStatus = statusFilter === "all" || injury.status === statusFilter;
    const matchesSeverity = severityFilter === "all" || injury.severity === severityFilter;
    const matchesBodyPart = !bodyPartFilter || injury.bodyPart.toLowerCase().includes(bodyPartFilter.toLowerCase());
    const matchesActive = !activeOnly || injury.status !== "available";
    return matchesSearch && matchesTeam && matchesStatus && matchesSeverity && matchesBodyPart && matchesActive;
  });

  const stats = {
    totalInjuries: mockInjuries.length,
    activeInjuries: mockInjuries.filter((i) => i.status !== "available").length,
    severeCount: mockInjuries.filter((i) => i.severity === "severe").length,
    recovering: mockInjuries.filter((i) => i.status === "recovering").length,
  };

  const isAllClear = teamFilter === "all" && statusFilter === "all" && severityFilter === "all" && !bodyPartFilter && !activeOnly;

  const resetToAll = () => {
    setTeamFilter("all");
    setStatusFilter("all");
    setSeverityFilter("all");
    setBodyPartFilter("");
    setActiveOnly(false);
  };

  const toggleActiveOnly = () => setActiveOnly((prev) => !prev);
  const toggleSeverityCard = (level: Severity) =>
    setSeverityFilter((prev) => (prev === level ? "all" : level));
  const toggleStatusCard = (status: InjuryStatus) =>
    setStatusFilter((prev) => (prev === status ? "all" : status));

  const tableRef = useRef<HTMLDivElement>(null);
  const scrollToTable = () => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const selectedSeverity = selectedInjury ? severityConfig[selectedInjury.severity] : null;
  const selectedStatus = selectedInjury ? statusConfig[selectedInjury.status] : null;
  const SelectedStatusIcon = selectedStatus?.icon;
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
            <h1 className="text-2xl font-bold tracking-tight">{t("injury.list.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("injury.list.description")}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards — click one to filter the records below to that subset */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          onClick={() => { resetToAll(); scrollToTable(); }}
          className={cn(
            "bg-gradient-to-br from-card to-card/80 border-border/50 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400/50 hover:shadow-md",
            isAllClear && "ring-2 ring-blue-400/60 border-blue-400/50"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("injury.list.statTotal")}</p>
                <p className="text-2xl font-bold mt-1">{stats.totalInjuries}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/15">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => { toggleActiveOnly(); scrollToTable(); }}
          className={cn(
            "bg-gradient-to-br from-card to-card/80 border-border/50 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400/50 hover:shadow-md",
            activeOnly && "ring-2 ring-amber-400/60 border-amber-400/50"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("injury.list.statActive")}</p>
                <p className="text-2xl font-bold mt-1 text-amber-400">{stats.activeInjuries}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/15">
                <TrendingDown className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => { toggleSeverityCard("severe"); scrollToTable(); }}
          className={cn(
            "bg-gradient-to-br from-card to-card/80 border-border/50 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-400/50 hover:shadow-md",
            severityFilter === "severe" && "ring-2 ring-rose-400/60 border-rose-400/50"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("injury.list.statSevere")}</p>
                <p className="text-2xl font-bold mt-1 text-rose-400">{stats.severeCount}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/15">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => { toggleStatusCard("recovering"); scrollToTable(); }}
          className={cn(
            "bg-gradient-to-br from-card to-card/80 border-border/50 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/50 hover:shadow-md",
            statusFilter === "recovering" && "ring-2 ring-emerald-400/60 border-emerald-400/50"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("injury.list.statRecovering")}</p>
                <p className="text-2xl font-bold mt-1 text-emerald-400">{stats.recovering}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/15">
                <Clock className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRtl ? "right-3" : "left-3")} />
              <Input
                placeholder={t("injury.list.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn("h-10", isRtl ? "pr-10" : "pl-10")}
              />
            </div>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <Users className="w-4 h-4 me-2 text-muted-foreground" />
                <SelectValue placeholder={t("injury.list.allTeams")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("injury.list.allTeams")}</SelectItem>
                <SelectItem value="First Team">First Team</SelectItem>
                <SelectItem value="Reserves">Reserves</SelectItem>
                <SelectItem value="Youth">Youth</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-10">
                <Filter className="w-4 h-4 me-2 text-muted-foreground" />
                <SelectValue placeholder={t("injury.list.allStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("injury.list.allStatus")}</SelectItem>
                <SelectItem value="recovering">{t("status.recovering")}</SelectItem>
                <SelectItem value="out">{t("status.out")}</SelectItem>
                <SelectItem value="available">{t("status.available")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Injury Table */}
      <Card ref={tableRef} className="border-border/50 overflow-hidden scroll-mt-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t("injury.list.recordsTitle")}</CardTitle>
          <CardDescription>
            {translateWithParams(t, "injury.list.showingCount", {
              shown: String(filteredInjuries.length),
              total: String(mockInjuries.length),
            })}
            {" · "}
            {t("injury.list.viewDetailsHint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold">{t("injury.list.colPlayer")}</TableHead>
                  <TableHead className="font-semibold">{t("injury.list.colTeam")}</TableHead>
                  <TableHead className="font-semibold">{t("injury.list.colInjury")}</TableHead>
                  <TableHead className="font-semibold">{t("injury.list.colBodyPart")}</TableHead>
                  <TableHead className="font-semibold">{t("injury.list.colSeverity")}</TableHead>
                  <TableHead className="font-semibold">{t("injury.list.colStatus")}</TableHead>
                  <TableHead className="font-semibold">{t("injury.list.colDate")}</TableHead>
                  <TableHead className="font-semibold">{t("injury.list.colDaysToReturn")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInjuries.map((injury) => {
                  const severity = severityConfig[injury.severity];
                  const status = statusConfig[injury.status];
                  const StatusIcon = status.icon;
                  const daysRemaining = getDaysRemaining(injury.expectedReturn);

                  return (
                    <TableRow
                      key={injury.id}
                      onClick={() => setSelectedInjury(injury)}
                      className="border-border/30 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <TableCell className="font-medium text-primary hover:underline">{injury.playerName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal border-border/50">
                          {injury.teamName}
                        </Badge>
                      </TableCell>
                      <TableCell>{t(`injuryType.${injury.injuryType}`)}</TableCell>
                      <TableCell className="text-muted-foreground">{translateBodyPart(t, injury.bodyPart)}</TableCell>
                      <TableCell>
                        <Badge className={cn("border font-medium", severity.bgColor, severity.color)}>
                          {t(severity.label)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <StatusIcon className={cn("w-3.5 h-3.5", status.color)} />
                          <Badge className={cn("border font-medium", status.bgColor, status.color)}>
                            {t(status.label)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {formatDate(injury.injuryDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {injury.status === "available" ? (
                          <span className="text-emerald-400 font-medium">{t("injury.list.cleared")}</span>
                        ) : (
                          <span className={cn(
                            "font-medium",
                            daysRemaining > 30 ? "text-rose-400" : daysRemaining > 14 ? "text-amber-400" : "text-emerald-400"
                          )}>
                            {translateWithParams(t, "injury.list.daysSuffix", { count: String(daysRemaining) })}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredInjuries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <HeartPulse className="w-8 h-8 text-muted-foreground/50" />
                        <p>{t("injury.list.noResults")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Full injury record — mirrors the sections captured in Record New Injury */}
      <Dialog open={!!selectedInjury} onOpenChange={(open) => !open && setSelectedInjury(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedInjury && selectedSeverity && selectedStatus && SelectedStatusIcon && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/20 shrink-0">
                    <HeartPulse className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <DialogTitle>{selectedInjury.playerName}</DialogTitle>
                    <DialogDescription>
                      {t(`injuryType.${selectedInjury.injuryType}`)} · {selectedInjury.teamName}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-5 pt-1">
                {/* Injury Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-rose-400">
                    <Stethoscope className="w-4 h-4" />
                    {t("injury.add.detailsSectionTitle")}
                  </div>
                  <div className="flex gap-4">
                    <BodyPartPreview
                      bodyPart={selectedInjury.bodyPart}
                      color={SEVERITY_COLORS[selectedInjury.severity]}
                      className="w-20 shrink-0 rounded-md border border-border/50 bg-muted/20 p-1"
                    />
                    <div className="grid grid-cols-2 gap-3 text-sm flex-1">
                      <div>
                        <p className="text-xs text-muted-foreground">{t("injury.list.colBodyPart")}</p>
                        <p className="font-medium">{translateBodyPart(t, selectedInjury.bodyPart)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t("injury.add.severityLabel")}</p>
                        <Badge className={cn("border font-medium mt-0.5", selectedSeverity.bgColor, selectedSeverity.color)}>
                          {t(selectedSeverity.label)}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">{t("injury.list.mechanismLabel")}</p>
                        <p className="font-medium">{selectedInjury.mechanism || t("injury.list.notProvided")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/50" />

                {/* Timeline */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                    <CalendarDays className="w-4 h-4" />
                    {t("injury.add.timelineSectionTitle")}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("injury.list.injuryDateLabel")}</p>
                      <p className="font-medium">{formatDate(selectedInjury.injuryDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("injury.list.expectedReturnLabel")}</p>
                      <p className="font-medium">{formatDate(selectedInjury.expectedReturn)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("injury.list.statusLabel")}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <SelectedStatusIcon className={cn("w-3.5 h-3.5", selectedStatus.color)} />
                        <Badge className={cn("border font-medium", selectedStatus.bgColor, selectedStatus.color)}>
                          {t(selectedStatus.label)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("injury.list.colDaysToReturn")}</p>
                      <p className={cn(
                        "font-medium",
                        selectedInjury.status === "available" ? "text-emerald-400" : ""
                      )}>
                        {selectedInjury.status === "available"
                          ? t("injury.list.cleared")
                          : translateWithParams(t, "injury.list.daysSuffix", { count: String(getDaysRemaining(selectedInjury.expectedReturn)) })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/50" />

                {/* Treatment & Notes */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                    <ClipboardList className="w-4 h-4" />
                    {t("injury.add.treatmentSectionTitle")}
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("injury.add.treatmentLabel")}</p>
                      <p className="font-medium">{selectedInjury.treatment || t("injury.list.notProvided")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("injury.add.notesLabel")}</p>
                      <p className="font-medium">{selectedInjury.notes || t("injury.list.notProvided")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
