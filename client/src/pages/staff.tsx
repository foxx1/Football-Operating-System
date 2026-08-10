import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Users, UserCheck, Briefcase, Phone, Mail, Edit, Trash2, Grid3X3, List, LayoutGrid, ChevronDown, Link2, User, Copy, Check, CheckCircle2, AlertCircle, Send, UserRoundCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSettings, formatCurrency } from "@/contexts/SettingsContext";
import { useI18n, translateWithParams } from "@/contexts/I18nContext";
import { calculateTimeRemaining, cn } from "@/lib/utils";
import { Activity, ShieldAlert, Clock } from "lucide-react";
import { employeeRoles, type EmployeeRole, type Staff, type Team } from "@shared/schema";
import StaffForm from "@/components/staff-form";
import { StaffTeamAssignment } from "@/components/staff-team-assignment";
import StaffCard from "@/components/cards/StaffCard";
import DetailedPreview from "@/components/cards/DetailedPreview";
import DeleteConfirmationDialog from "@/components/ui/delete-confirmation-dialog";
import { useAuth, getRoleDisplayName } from "@/lib/auth";

type ViewMode = 'grid' | 'list' | 'cards';

interface RegistrationStatus {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  type: "player" | "staff";
  profileId: number | null;
  missingFields: string[];
  isComplete: boolean;
  lastReminderAt: string | null;
}

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isInviteEmployeeOpen, setIsInviteEmployeeOpen] = useState(false);
  const [inviteEmployeeRole, setInviteEmployeeRole] = useState<EmployeeRole | "">("");
  const [inviteEmployeeTeamId, setInviteEmployeeTeamId] = useState<number | null>(null);
  const [inviteEmployeeEmail, setInviteEmployeeEmail] = useState("");
  const [generatedEmployeeInviteLink, setGeneratedEmployeeInviteLink] = useState("");
  const [isEmployeeInviteLinkCopied, setIsEmployeeInviteLinkCopied] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>();
  const [selectedStaff, setSelectedStaff] = useState<Set<number>>(new Set());
  const [previewStaff, setPreviewStaff] = useState<Staff | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTeamAssignOpen, setIsTeamAssignOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [isStaffRegistrationStatusOpen, setIsStaffRegistrationStatusOpen] = useState(false);
  const [deleteRegistrationTarget, setDeleteRegistrationTarget] = useState<RegistrationStatus | null>(null);
  const { toast } = useToast();
  const { currency } = useSettings();
  const { t } = useI18n();
  const { user } = useAuth();
  const canManageRegistration = user?.role === "club_super_admin" || user?.role === "admin";

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["/api/staff"],
    refetchInterval: canManageRegistration ? 30_000 : false,
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: registrationStatuses = [], isLoading: registrationStatusesLoading } = useQuery<RegistrationStatus[]>({
    queryKey: ["/api/admin/registration-status"],
    enabled: canManageRegistration,
    refetchInterval: 30_000,
  });

  const staffRegistrationStatuses = registrationStatuses.filter((status) => status.type === "staff" && !status.isComplete);

  const deleteStaffMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/registration-status"] });
      toast({
        title: t("staff.deleteSuccessTitle"),
        description: t("staff.deleteSuccessDescription"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("staff.deleteErrorTitle"),
        description: error.message || t("staff.deleteErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const createEmployeeInvitationMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/employee-invitations", {
      role: inviteEmployeeRole,
      teamId: inviteEmployeeTeamId ?? undefined,
      email: inviteEmployeeEmail.trim() || undefined,
    }),
    onSuccess: (result) => {
      setGeneratedEmployeeInviteLink(result.link);
      setIsEmployeeInviteLinkCopied(false);

      if (inviteEmployeeEmail.trim()) {
        console.log("[Employee invite email simulation]", {
          to: inviteEmployeeEmail.trim(),
          role: inviteEmployeeRole,
          inviteLink: result.link,
        });
      }

      toast({
        title: t("invite.toast.generated"),
        description: inviteEmployeeEmail.trim()
          ? translateWithParams(t, "invite.toast.emailSimulated", { email: inviteEmployeeEmail.trim() })
          : t("invite.toast.ready"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("invite.toast.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendRegistrationReminderMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("POST", "/api/admin/registration-reminders", { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/registration-status"] });
      toast({
        title: "Reminder sent",
        description: "The registration message will appear for this user when they sign in.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to send reminder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const assignStaffToTeamMutation = useMutation({
    mutationFn: async ({ staffIds, teamId }: { staffIds: number[], teamId: number }) => {
      const promises = staffIds.map(staffId =>
        apiRequest("POST", "/api/staff-teams", { teamId, staffId })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff-teams"] });
      setSelectedStaff(new Set());
      setIsTeamAssignOpen(false);
      setSelectedTeamId(null);
      toast({
        title: t("staff.assignSuccessTitle"),
        description: t("staff.assignSuccessDescription"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("staff.assignErrorTitle"),
        description: error.message || t("staff.assignErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const filteredStaff = (staff as Staff[]).filter((member: Staff) => {
    const matchesSearch =
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = selectedDepartment === "all" || member.department === selectedDepartment;

    return matchesSearch && matchesDepartment && member.isActive;
  });

  const handleAddStaff = () => {
    setEditingStaff(undefined);
    setDialogOpen(true);
  };

  const handleEditStaff = (member: Staff) => {
    setEditingStaff(member);
    setDialogOpen(true);
  };

  const handleDeleteStaff = (id: number) => {
    deleteStaffMutation.mutate(id);
  };

  const handleFormSuccess = () => {
    setDialogOpen(false);
    setEditingStaff(undefined);
  };

  const handleGenerateEmployeeInviteLink = () => {
    if (!inviteEmployeeRole) {
      toast({
        title: t("invite.toast.roleRequired"),
        description: t("invite.toast.roleRequiredDesc"),
        variant: "destructive",
      });
      return;
    }
    createEmployeeInvitationMutation.mutate();
  };

  const handleCopyEmployeeInviteLink = async () => {
    if (!generatedEmployeeInviteLink) return;
    try {
      await navigator.clipboard.writeText(generatedEmployeeInviteLink);
      setIsEmployeeInviteLinkCopied(true);
      toast({ title: t("invite.toast.copied") });
    } catch {
      toast({
        title: t("invite.toast.copyFailed"),
        description: t("invite.toast.copyFailedDesc"),
        variant: "destructive",
      });
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      head_coach: "bg-blue-100 text-blue-800",
      assistant_coach: "bg-green-100 text-green-800",
      fitness_coach: "bg-purple-100 text-purple-800",
      goalkeeping_coach: "bg-orange-100 text-orange-800",
      physiotherapist: "bg-red-100 text-red-800",
      analyst: "bg-indigo-100 text-indigo-800",
      kit_manager: "bg-gray-100 text-gray-800",
      team_manager: "bg-cyan-100 text-cyan-800",
      team_administrative: "bg-amber-100 text-amber-800",
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      coaching: "bg-blue-50 border-blue-200",
      medical: "bg-red-50 border-red-200",
      analysis: "bg-purple-50 border-purple-200",
      operations: "bg-green-50 border-green-200",
    };
    return colors[department as keyof typeof colors] || "bg-gray-50 border-gray-200";
  };

  const formatRole = (role: string) => {
    return t(`staff.role.${role}`);
  };

  const handleStaffSelect = (staff: Staff) => {
    setSelectedStaff(prev => {
      const newSet = new Set(prev);
      if (newSet.has(staff.id)) {
        newSet.delete(staff.id);
      } else {
        newSet.add(staff.id);
      }
      return newSet;
    });
  };

  const handleStaffPreview = (staff: Staff) => {
    setPreviewStaff(staff);
    setIsPreviewOpen(true);
  };

  const handleStaffEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">{t("staff.title")}</h1>
          <p className="text-gray-600 mt-1">{t("staff.description")}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Employee
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuItem onSelect={handleAddStaff}>
              <User className="h-4 w-4" />
              Add Employee Manually
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIsInviteEmployeeOpen(true)}>
              <Link2 className="h-4 w-4" />
              Invite Employee via Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? t("staff.editStaffMember") : t("staff.addNewStaffMember")}
              </DialogTitle>
            </DialogHeader>
            <StaffForm staff={editingStaff} onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog
        open={isInviteEmployeeOpen}
        onOpenChange={(open) => {
          setIsInviteEmployeeOpen(open);
          if (!open) {
            setInviteEmployeeRole("");
            setInviteEmployeeTeamId(null);
            setInviteEmployeeEmail("");
            setGeneratedEmployeeInviteLink("");
            setIsEmployeeInviteLinkCopied(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg" dir={isRtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className={cn("flex items-center gap-2", isRtl ? "flex-row-reverse justify-end" : "")}>
              <Link2 className="h-5 w-5 text-primary" />
              {t("invite.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <p className="text-sm leading-6 text-muted-foreground text-start">
              {t("invite.subtitle")}
            </p>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="invite-employee-role" className="flex items-center gap-1">
                {t("invite.roleLabel")} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={inviteEmployeeRole}
                onValueChange={(value: EmployeeRole) => {
                  setInviteEmployeeRole(value);
                  setGeneratedEmployeeInviteLink("");
                }}
              >
                <SelectTrigger id="invite-employee-role">
                  <SelectValue placeholder={t("invite.rolePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {employeeRoles.map((role) => (
                    <SelectItem key={role} value={role}>{t(`staff.role.${role}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!inviteEmployeeRole && <p className="text-xs text-muted-foreground">{t("invite.roleRequiredNote")}</p>}
            </div>

            {/* Team (required before generating) */}
            <div className="space-y-2">
              <Label htmlFor="invite-employee-team" className="flex items-center gap-1">
                {t("invite.teamLabel")} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={inviteEmployeeTeamId ? String(inviteEmployeeTeamId) : ""}
                onValueChange={(value) => {
                  setInviteEmployeeTeamId(value ? Number(value) : null);
                  setGeneratedEmployeeInviteLink("");
                }}
              >
                <SelectTrigger id="invite-employee-team">
                  <SelectValue placeholder={t("invite.teamPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {(teams as Team[]).map((team) => (
                    <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t("invite.teamHelp")}</p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="invite-employee-email" className="flex items-center gap-1">
                {t("invite.emailLabel")}
                <span className="font-normal text-muted-foreground">({t("invite.emailOptional")})</span>
              </Label>
              <div className="relative">
                <Mail className={cn("absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground", isRtl ? "right-3" : "left-3")} />
                <Input
                  id="invite-employee-email"
                  type="email"
                  value={inviteEmployeeEmail}
                  onChange={(event) => {
                    setInviteEmployeeEmail(event.target.value);
                    setGeneratedEmployeeInviteLink("");
                  }}
                  placeholder={t("invite.emailPlaceholder")}
                  className={isRtl ? "pr-10" : "pl-10"}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("invite.emailHelp")}</p>
            </div>

            <Button
              onClick={handleGenerateEmployeeInviteLink}
              disabled={!inviteEmployeeRole || !inviteEmployeeTeamId || createEmployeeInvitationMutation.isPending}
              className="w-full"
            >
              <Link2 className={cn("h-4 w-4", isRtl ? "ms-2" : "me-2")} />
              {createEmployeeInvitationMutation.isPending ? t("invite.generating") : t("invite.generate")}
            </Button>

            {generatedEmployeeInviteLink && (
              <div className="space-y-2 rounded-md border border-primary/20 bg-primary/[0.06] p-4">
                <Label htmlFor="generated-employee-invite-link">{t("invite.generatedLabel")}</Label>
                <div className="flex gap-2">
                  <Input id="generated-employee-invite-link" value={generatedEmployeeInviteLink} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={handleCopyEmployeeInviteLink} aria-label={t("invite.copyAria")}>
                    {isEmployeeInviteLinkCopied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {canManageRegistration && (
        <Card className="overflow-hidden border-border/70">
          <CardHeader className="border-b border-border/60 bg-muted/20">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <UserRoundCheck className="h-5 w-5 text-primary" />
                  <CardTitle>Registration status</CardTitle>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Monitor staff onboarding details and remind staff members about missing information.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-sm">
                  {staffRegistrationStatuses.length} pending
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsStaffRegistrationStatusOpen((open) => !open)}
                  aria-expanded={isStaffRegistrationStatusOpen}
                  aria-controls="staff-registration-status-content"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isStaffRegistrationStatusOpen && "rotate-180")} />
                </Button>
              </div>
            </div>
          </CardHeader>
          {isStaffRegistrationStatusOpen && (
            <CardContent id="staff-registration-status-content" className="p-0">
              {registrationStatusesLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading registration status...</div>
              ) : staffRegistrationStatuses.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No pending staff registrations.</div>
              ) : (
                <div className="divide-y divide-border/60">
                {staffRegistrationStatuses.map((status) => (
                  <div key={status.userId} className="grid gap-4 p-4 lg:grid-cols-[minmax(220px,0.9fr)_120px_minmax(260px,1.4fr)_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">{status.firstName} {status.lastName}</p>
                        <Badge variant="outline" className="rounded-sm text-[10px] uppercase">{status.type}</Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{status.email}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{getRoleDisplayName(status.role)}</p>
                    </div>

                    <div>
                      {status.isComplete ? (
                        <Badge className="gap-1 rounded-sm bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                        </Badge>
                      ) : (
                        <Badge className="gap-1 rounded-sm bg-amber-100 text-amber-900 hover:bg-amber-100">
                          <AlertCircle className="h-3.5 w-3.5" /> Incomplete
                        </Badge>
                      )}
                    </div>

                    <div className="min-w-0">
                      {status.isComplete ? (
                        <p className="text-sm text-muted-foreground">All required registration information is available.</p>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Missing inputs</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {status.missingFields.map((field) => (
                              <Badge key={field} variant="outline" className="rounded-sm font-normal">{field}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-2 lg:items-end">
                      <div className="flex flex-wrap items-center gap-2">
                        {!status.isComplete && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendRegistrationReminderMutation.mutate(status.userId)}
                            disabled={sendRegistrationReminderMutation.isPending}
                          >
                            <Send className="mr-2 h-3.5 w-3.5" />
                            Send reminder
                          </Button>
                        )}
                        {status.profileId != null && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const member = (staff as Staff[]).find((s) => s.id === status.profileId);
                                if (member) handleStaffEdit(member);
                              }}
                            >
                              <Edit className="mr-2 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => setDeleteRegistrationTarget(status)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                      {status.lastReminderAt && (
                        <p className="text-[11px] text-muted-foreground">
                          Last sent {new Date(status.lastReminderAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      <DeleteConfirmationDialog
        isOpen={!!deleteRegistrationTarget}
        onClose={() => setDeleteRegistrationTarget(null)}
        onConfirm={() => {
          if (deleteRegistrationTarget?.profileId != null) {
            deleteStaffMutation.mutate(deleteRegistrationTarget.profileId);
          }
          setDeleteRegistrationTarget(null);
        }}
        title="Delete Staff Member"
        name={deleteRegistrationTarget ? `${deleteRegistrationTarget.firstName} ${deleteRegistrationTarget.lastName}` : ""}
        type="staff"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t("staff.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("staff.filterAll")}</SelectItem>
            <SelectItem value="coaching">{t("staff.filterCoaching")}</SelectItem>
            <SelectItem value="medical">{t("staff.filterMedical")}</SelectItem>
            <SelectItem value="analysis">{t("staff.filterAnalysis")}</SelectItem>
            <SelectItem value="operations">{t("staff.filterOperations")}</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode Controls */}
        <div className="flex items-center space-x-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="h-8 px-2"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 px-2"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 px-2"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {selectedStaff.size > 0 && (
          <Button
            variant="default"
            className="action-button bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setIsTeamAssignOpen(true)}
          >
            <Users className="w-4 h-4 mr-2" />
            {translateWithParams(t, "staff.assignToTeam", { count: selectedStaff.size.toString() })}
          </Button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(staff as Staff[]).length}</p>
                <p className="text-sm text-muted-foreground">{t("staff.totalStaff")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(staff as Staff[]).filter(m => m.department === 'coaching').length}
                </p>
                <p className="text-sm text-muted-foreground">{t("staff.coaching")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(staff as Staff[]).filter(m => m.department === 'medical').length}
                </p>
                <p className="text-sm text-muted-foreground">{t("staff.medical")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(staff as Staff[]).filter(m => {
                    if (!m.contractEndDate) return false;
                    const remaining = calculateTimeRemaining(m.contractEndDate);
                    return remaining && remaining.isExpiring;
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">{t("staff.expiringContracts")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Display */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map((member: Staff) => (
            <StaffCard
              key={member.id}
              staff={member}
              isSelected={selectedStaff.has(member.id)}
              onEdit={handleStaffEdit}
              onDelete={handleDeleteStaff}
              onPreview={handleStaffPreview}
              onSelect={handleStaffSelect}
              getDepartmentColor={getDepartmentColor}
              getRoleColor={getRoleColor}
              formatRole={formatRole}
              formatCurrency={(amount: string, currency: string) => formatCurrency(Number(amount) || 0, currency)}
              currency={currency}
            />
          ))}
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredStaff.map((member: Staff) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleStaffPreview(member)}>
              <CardContent className="p-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={member.profilePicture || undefined} alt={`${member.firstName} ${member.lastName}`} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {member.firstName[0]}{member.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{member.firstName} {member.lastName}</p>
                    <p className="text-xs text-muted-foreground">{formatRole(member.role)}</p>
                    <p className="text-xs text-muted-foreground">{member.department}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle>{t("staff.staffListTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">{t("staff.staffMember")}</th>
                    <th className="text-left p-4 font-medium">{t("staff.role")}</th>
                    <th className="text-left p-4 font-medium">{t("staff.department")}</th>
                    <th className="text-left p-4 font-medium">{t("staff.email")}</th>
                    <th className="text-left p-4 font-medium">{t("staff.passportExpiry")}</th>
                    <th className="text-left p-4 font-medium">{t("staff.contractEnd")}</th>
                    <th className="text-left p-4 font-medium">{t("staff.salary")}</th>
                    <th className="text-left p-4 font-medium">{t("staff.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((member: Staff) => (
                    <tr key={member.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.profilePicture || undefined} alt={`${member.firstName} ${member.lastName}`} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {member.firstName[0]}{member.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{member.firstName} {member.lastName}</p>
                            <p className="text-sm text-muted-foreground">{member.nationality}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge>{formatRole(member.role)}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{member.department}</Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{member.email}</span>
                      </td>
                      <td className="p-4">
                        {(() => {
                          const expiry = calculateTimeRemaining(member.passportExpiryDate);
                          if (!expiry) return <span className="text-muted-foreground">-</span>;
                          return (
                            <div className={cn("text-sm font-medium", expiry.isExpiring ? "text-red-600" : "text-green-600")}>
                              {expiry.text}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-4">
                        {(() => {
                          const expiry = calculateTimeRemaining(member.contractEndDate);
                          if (!expiry) return <span className="text-muted-foreground">-</span>;
                          return (
                            <div className={cn("text-sm font-medium", expiry.isExpiring ? "text-red-600" : "text-green-600")}>
                              {expiry.text}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{formatCurrency(Number(member.salary || 0), currency)}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStaffPreview(member)}
                          >
                            {t("staff.view")}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStaffEdit(member)}
                          >
                            {t("staff.edit")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredStaff.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t("staff.noStaffFound")}</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedDepartment !== "all"
                ? t("staff.tryAdjustingSearch")
                : t("staff.getStartedStaff")
              }
            </p>
            {!searchTerm && selectedDepartment === "all" && (
              <Button onClick={handleAddStaff}>
                <Plus className="w-4 h-4 mr-2" />
                {t("staff.addStaff")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Staff Preview Dialog */}
      <DetailedPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={previewStaff}
        type="staff"
        onEdit={handleStaffEdit}
        getDepartmentColor={getDepartmentColor}
        getRoleColor={getRoleColor}
        formatRole={formatRole}
        formatCurrency={(amount: string, currency: string) => formatCurrency(Number(amount) || 0, currency)}
        currency={currency}
      />

      {/* Team Assignment Dialog */}
      <Dialog open={isTeamAssignOpen} onOpenChange={setIsTeamAssignOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("staff.assignStaffToTeamDialogTitle")}</DialogTitle>
            <p className="text-sm text-gray-500 mt-2">
              {translateWithParams(t, "staff.assignToTeamDescription", { count: selectedStaff.size.toString() })}
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("staff.assignTeamLabel")}</label>
              <Select value={selectedTeamId?.toString() || ""} onValueChange={(value) => setSelectedTeamId(Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("staff.selectTeam")}/>
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsTeamAssignOpen(false);
                  setSelectedTeamId(null);
                }}
              >
                {t("staff.cancel")}
              </Button>
              <Button
                onClick={() => {
                  if (selectedTeamId) {
                    assignStaffToTeamMutation.mutate({
                      staffIds: Array.from(selectedStaff),
                      teamId: selectedTeamId
                    });
                  }
                }}
                disabled={!selectedTeamId || assignStaffToTeamMutation.isPending}
              >
                {assignStaffToTeamMutation.isPending ? t("staff.assigning") : t("staff.assignStaff")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
