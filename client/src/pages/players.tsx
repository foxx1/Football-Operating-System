import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, User, Users, Grid3X3, List, LayoutGrid, Clock, ChevronDown, Link2, Mail, Copy, Check, Send, UserRoundCheck, AlertCircle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { calculateTimeRemaining, cn, getDisplayName } from "@/lib/utils";
import AddPlayerDialog from "@/components/players/add-player-dialog";
import PlayerCard from "@/components/players/player-card";
import DetailedPreview from "@/components/cards/DetailedPreview";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/lib/auth";
import { isTechnicalStaffRole, type Player, type Team } from "@shared/schema";

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

export default function Players() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isInvitePlayerOpen, setIsInvitePlayerOpen] = useState(false);
  const [inviteTeamId, setInviteTeamId] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [generatedInviteLink, setGeneratedInviteLink] = useState("");
  const [isInviteLinkCopied, setIsInviteLinkCopied] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set());
  const [previewPlayer, setPreviewPlayer] = useState<Player | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTeamAssignOpen, setIsTeamAssignOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [isPlayerRegistrationStatusOpen, setIsPlayerRegistrationStatusOpen] = useState(false);
  const { toast } = useToast();
  const { isRtl, t } = useI18n();

  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { user } = useAuth();
  const canManageRegistration = user?.role === "club_super_admin" || user?.role === "admin";
  // Technical staff (coaches, analysts, physio, etc.) can review and edit
  // players, but only club administration can add or remove them.
  const canManageRoster = !isTechnicalStaffRole(user?.role);

  const { data: registrationStatuses = [], isLoading: registrationStatusesLoading } = useQuery<RegistrationStatus[]>({
    queryKey: ["/api/admin/registration-status"],
    enabled: canManageRegistration,
    refetchInterval: 30_000,
  });

  const playerRegistrationStatuses = registrationStatuses.filter((status) => status.type === "player" && !status.isComplete);

  const sendRegistrationReminderMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("POST", "/api/admin/registration-reminders", { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/registration-status"] });
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (playerId: number) =>
      apiRequest("DELETE", `/api/players/${playerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
    },
  });

  const assignPlayersToTeamMutation = useMutation({
    mutationFn: async ({ playerIds, teamId }: { playerIds: number[], teamId: number }) => {
      const promises = playerIds.map(playerId =>
        apiRequest("POST", "/api/team-players", { teamId, playerId })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team-players"] });
      setSelectedPlayers(new Set());
      setIsTeamAssignOpen(false);
      setSelectedTeamId(null);
      toast({
        title: t("players.assignedToastTitle"),
        description: t("players.assignedToastDescription"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("players.errorToastTitle"),
        description: error.message || t("players.assignError"),
        variant: "destructive",
      });
    },
  });

  const createInvitationMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/invitations", {
      teamId: Number(inviteTeamId),
      email: inviteEmail.trim() || undefined,
    }),
    onSuccess: (result) => {
      const selectedTeam = teams.find((team) => team.id.toString() === inviteTeamId);
      setGeneratedInviteLink(result.link);
      setIsInviteLinkCopied(false);

      if (inviteEmail.trim()) {
        console.log("[Player invite email simulation]", {
          to: inviteEmail.trim(),
          team: selectedTeam?.name,
          inviteLink: result.link,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/invitations"] });
      toast({
        title: t("players.inviteLinkGenerated"),
        description: inviteEmail.trim()
          ? translateWithParams(t, "players.inviteLinkGeneratedEmail", { email: inviteEmail.trim() })
          : t("players.inviteLinkGeneratedDefault"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("players.inviteLinkErrorTitle"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredPlayers = players.filter((player: Player) => {
    if (!player || !player.id) {
      console.warn('Invalid player object:', player);
      return false;
    }

    const fullName = `${player.firstName ?? ""} ${player.lastName ?? ""}`.trim();
    const normalizedQuery = searchQuery.toLowerCase();
    const position = player.position ?? "";

    return (
      fullName.toLowerCase().includes(normalizedQuery) ||
      position.toLowerCase().includes(normalizedQuery)
    );
  });

  const getPositionColor = (position: string) => {
    switch (position.toLowerCase()) {
      case 'goalkeeper':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'defender':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'midfielder':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'forward':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleDeletePlayer = (playerId: number) => {
    deletePlayerMutation.mutate(playerId);
  };

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(player.id)) {
        newSet.delete(player.id);
      } else {
        newSet.add(player.id);
      }
      return newSet;
    });
  };

  const handlePlayerPreview = (player: Player) => {
    setPreviewPlayer(player);
    setIsPreviewOpen(true);
  };

  const handlePlayerEdit = (player: Player) => {
    setEditingPlayer(player);
  };

  const handleGenerateInviteLink = () => {
    if (!inviteTeamId) {
      toast({
        title: t("players.teamRequired"),
        description: t("players.teamRequiredDescription"),
        variant: "destructive",
      });
      return;
    }

    createInvitationMutation.mutate();
  };

  const handleCopyInviteLink = async () => {
    if (!generatedInviteLink) return;
    try {
      await navigator.clipboard.writeText(generatedInviteLink);
      setIsInviteLinkCopied(true);
      toast({ title: t("players.inviteLinkCopySuccess") });
    } catch {
      toast({
        title: t("players.copyLinkErrorTitle"),
        description: t("players.copyLinkErrorDescription"),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("players.title")}</h1>
          <p className="text-muted-foreground">{t("players.description")}</p>
        </div>
        {canManageRoster && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="action-button bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className={cn("w-4 h-4", isRtl ? "ml-2" : "mr-2")} />
                {t("players.add")}
                <ChevronDown className={cn("h-4 w-4", isRtl ? "mr-2" : "ml-2")} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onSelect={() => setIsAddPlayerOpen(true)}>
                <User className="h-4 w-4" />
                {t("players.addPlayerManually")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsInvitePlayerOpen(true)}>
                <Link2 className="h-4 w-4" />
                {t("players.invitePlayerLink")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {canManageRoster && (
          <AddPlayerDialog
            open={isAddPlayerOpen}
            onOpenChange={setIsAddPlayerOpen}
          />
        )}
      </div>

      {canManageRegistration && (
        <Card className="overflow-hidden border-border/70 mb-6">
          <CardHeader className="border-b border-border/60 bg-muted/20">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <UserRoundCheck className="h-5 w-5 text-primary" />
                  <CardTitle>Player registration status</CardTitle>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Monitor player onboarding details and remind players about missing information.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-sm">
                  {playerRegistrationStatuses.length} pending
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsPlayerRegistrationStatusOpen((open) => !open)}
                  aria-expanded={isPlayerRegistrationStatusOpen}
                  aria-controls="player-registration-status-content"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isPlayerRegistrationStatusOpen && "rotate-180")} />
                </Button>
              </div>
            </div>
          </CardHeader>
          {isPlayerRegistrationStatusOpen && (
            <CardContent id="player-registration-status-content" className="p-0">
              {registrationStatusesLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading player registration status...</div>
              ) : playerRegistrationStatuses.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No pending player registrations.</div>
              ) : (
                <div className="divide-y divide-border/60">
                {playerRegistrationStatuses.map((status) => (
                  <div key={status.userId} className="grid gap-4 p-4 lg:grid-cols-[minmax(220px,0.9fr)_120px_minmax(260px,1.4fr)_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">{status.firstName} {status.lastName}</p>
                        <Badge variant="outline" className="rounded-sm text-[10px] uppercase">{status.type}</Badge>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{status.email}</p>
                    </div>

                    <div>
                      {status.isComplete ? (
                        <Badge className="gap-1 rounded-sm bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                          <Check className="h-3.5 w-3.5" /> Complete
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

                    <div className="flex flex-col items-start gap-1 lg:items-end">
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

      <Dialog
        open={isInvitePlayerOpen}
        onOpenChange={(open) => {
          setIsInvitePlayerOpen(open);
          if (!open) {
            setInviteTeamId("");
            setInviteEmail("");
            setGeneratedInviteLink("");
            setIsInviteLinkCopied(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              {t("players.inviteDialogTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <p className="text-sm leading-6 text-muted-foreground">
              {t("players.inviteDialogDescription")}
            </p>

            <div className="space-y-2">
              <Label htmlFor="invite-team">{t("players.teamLabel")} <span className="text-destructive">*</span></Label>
              <Select value={inviteTeamId} onValueChange={(value) => {
                setInviteTeamId(value);
                setGeneratedInviteLink("");
              }}>
                <SelectTrigger id="invite-team">
                  <SelectValue placeholder={t("players.chooseTeam")} />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name} ({team.category.replace(/_/g, " ")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!inviteTeamId && <p className="text-xs text-muted-foreground">{t("players.teamRequiredHint")}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-email">{t("players.playerEmail")} <span className="font-normal text-muted-foreground">({t("players.optional")})</span></Label>
              <div className="relative">
                <Mail className={cn("absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground", isRtl ? "right-3" : "left-3")} />
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder={t("players.playerEmailPlaceholder")}
                  className={cn("w-full", isRtl ? "pr-10" : "pl-10")}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("players.emailHelp")}</p>
            </div>

            <Button onClick={handleGenerateInviteLink} disabled={!inviteTeamId || createInvitationMutation.isPending} className="w-full">
              <Link2 className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />
              {createInvitationMutation.isPending ? t("players.generating") : t("players.generateLink")}
            </Button>

            {generatedInviteLink && (
              <div className="space-y-2 rounded-md border border-primary/20 bg-primary/[0.06] p-4">
                <Label htmlFor="generated-invite-link">{t("players.generatedLinkLabel")}</Label>
                <div className={cn("flex gap-2", isRtl ? "flex-row-reverse" : "") }>
                  <Input id="generated-invite-link" value={generatedInviteLink} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={handleCopyInviteLink} aria-label={t("players.copyLinkAria")}>
                    {isInviteLinkCopied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className={cn("absolute top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4", isRtl ? "right-3" : "left-3")} />
          <Input
            type="text"
            placeholder={t("players.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("form-input", isRtl ? "pr-10" : "pl-10")}
          />
        </div>
        <Button variant="outline" className="action-button">
          <Filter className={cn("w-4 h-4", isRtl ? "ml-2" : "mr-2")} />
          {t("players.filter")}
        </Button>

        {/* View Mode Controls */}
        <div className={cn("flex items-center border rounded-md p-1", isRtl ? "flex-row-reverse space-x-reverse space-x-1" : "space-x-1")}>
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

        {selectedPlayers.size > 0 && (
          <Button
            variant="default"
            className="action-button bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setIsTeamAssignOpen(true)}
          >
            <Users className={cn("w-4 h-4", isRtl ? "ml-2" : "mr-2")} />
            {translateWithParams(t, "players.assignToTeam", { count: String(selectedPlayers.size) })}
          </Button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{players.length}</p>
                <p className="text-sm text-muted-foreground">{t("players.total")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {players.filter((p: Player) => p.position === 'goalkeeper').length}
                </p>
                <p className="text-sm text-muted-foreground">{t("players.goalkeepers")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {players.filter((p: Player) => p.position === 'defender').length}
                </p>
                <p className="text-sm text-muted-foreground">{t("players.defenders")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {players.filter((p: Player) => ['midfielder', 'forward'].includes(p.position)).length}
                </p>
                <p className="text-sm text-muted-foreground">{t("players.midForward")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {players.filter((p: Player) => {
                    if (!p.contractEndDate) return false;
                    const remaining = calculateTimeRemaining(p.contractEndDate);
                    return remaining && remaining.isExpiring;
                  }).length}
                </p>
                <p className="text-sm text-muted-foreground">{t("players.expiringContracts")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Players Display */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlayers.map((player: Player) => {
            // Ensure player and player.id exist before rendering
            if (!player || !player.id) {
              console.error('Invalid player in map:', player);
              return null;
            }

            return (
              <PlayerCard
                key={player.id}
                player={player}
                onEdit={handlePlayerEdit}
                onViewProfile={handlePlayerPreview}
              />
            );
          })}
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredPlayers.map((player: Player) => {
            if (!player || !player.id) {
              return null;
            }

            const age = player.dateOfBirth ? new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear() : null;

            return (
              <Card key={player.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handlePlayerPreview(player)}>
                <CardContent className="p-4">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={player.profilePicture || undefined} alt={getDisplayName(player, isRtl)} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {player.firstName[0]}{player.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      {player.shirtNumber && (
                        <Badge className={cn("absolute -top-1 w-5 h-5 p-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs", isRtl ? "-left-1" : "-right-1")}>
                          {player.shirtNumber}
                        </Badge>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-sm">{getDisplayName(player, isRtl)}</p>
                      <p className="text-xs text-muted-foreground">{t(`position.${player.position}`)}</p>
                      {age && <p className="text-xs text-muted-foreground">{translateWithParams(t, "players.years", { age: String(age) })}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {viewMode === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle>{t("players.listTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className={cn("p-4 font-medium", isRtl ? "text-right" : "text-left")}>{t("players.player")}</th>
                    <th className={cn("p-4 font-medium", isRtl ? "text-right" : "text-left")}>{t("players.position")}</th>
                    <th className={cn("p-4 font-medium", isRtl ? "text-right" : "text-left")}>{t("players.jersey")}</th>
                    <th className={cn("p-4 font-medium", isRtl ? "text-right" : "text-left")}>{t("players.age")}</th>
                    <th className={cn("p-4 font-medium", isRtl ? "text-right" : "text-left")}>{t("players.nationality")}</th>
                    <th className={cn("p-4 font-medium", isRtl ? "text-right" : "text-left")}>{t("players.passportExpiry")}</th>
                    <th className={cn("p-4 font-medium", isRtl ? "text-right" : "text-left")}>{t("players.contractEnd")}</th>
                    <th className={cn("p-4 font-medium", isRtl ? "text-right" : "text-left")}>{t("players.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player: Player) => {
                    if (!player || !player.id) {
                      return null;
                    }

                    const age = player.dateOfBirth ? new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear() : null;

                    return (
                      <tr key={player.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-3" : "space-x-3")}>
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={player.profilePicture || undefined} alt={getDisplayName(player, isRtl)} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {player.firstName[0]}{player.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{getDisplayName(player, isRtl)}</p>
                              <p className="text-sm text-muted-foreground">{player.email || t("players.noEmail")}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge>{t(`position.${player.position}`)}</Badge>
                        </td>
                        <td className="p-4">
                          {player.shirtNumber && (
                            <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                              {player.shirtNumber}
                            </Badge>
                          )}
                        </td>
                        <td className="p-4">
                          {age && <span>{translateWithParams(t, "players.years", { age: String(age) })}</span>}
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{player.nationality}</span>
                        </td>
                        <td className="p-4">
                          {(() => {
                            const expiry = calculateTimeRemaining(player.passportExpiryDate);
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
                            const expiry = calculateTimeRemaining(player.contractEndDate);
                            if (!expiry) return <span className="text-muted-foreground">-</span>;
                            return (
                              <div className={cn("text-sm font-medium", expiry.isExpiring ? "text-red-600" : "text-green-600")}>
                                {expiry.text}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="p-4">
                          <div className={cn("flex", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePlayerPreview(player)}
                            >
                              {t("players.view")}
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handlePlayerEdit(player)}
                            >
                              {t("players.edit")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredPlayers.length === 0 && !isLoading && (
        <Card className="text-center p-12">
          <CardContent>
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{t("players.noPlayersFound")}</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? t("players.noSearchResults") : t("players.emptyRoster")}
            </p>
            {!searchQuery && canManageRoster && (
              <Button onClick={() => setIsAddPlayerOpen(true)}>
                <Plus className={cn("w-4 h-4", isRtl ? "ml-2" : "mr-2")} />
                {t("players.addFirst")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Player Dialog */}
      <AddPlayerDialog
        open={!!editingPlayer}
        onOpenChange={() => setEditingPlayer(null)}
        editingPlayer={editingPlayer}
      />

      {/* Player Preview Dialog */}
      <DetailedPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={previewPlayer}
        type="player"
        onEdit={handlePlayerEdit}
        getPositionColor={getPositionColor}
      />

      {/* Team Assignment Dialog */}
      <Dialog open={isTeamAssignOpen} onOpenChange={setIsTeamAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("players.assignDialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {translateWithParams(t, "players.assignDialogDescription", {
                count: String(selectedPlayers.size),
                plural: selectedPlayers.size !== 1 ? "s" : "",
              })}
            </p>
            <div>
              <label className="text-sm font-medium">{t("players.selectTeam")}</label>
              <Select value={selectedTeamId?.toString() || ""} onValueChange={(value) => setSelectedTeamId(parseInt(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t("players.chooseTeam")} />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name} ({team.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={cn("flex justify-end pt-4", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
              <Button
                variant="outline"
                onClick={() => {
                  setIsTeamAssignOpen(false);
                  setSelectedTeamId(null);
                }}
              >
                {t("players.cancel")}
              </Button>
              <Button
                onClick={() => {
                  if (selectedTeamId) {
                    assignPlayersToTeamMutation.mutate({
                      playerIds: Array.from(selectedPlayers),
                      teamId: selectedTeamId
                    });
                  }
                }}
                disabled={!selectedTeamId || assignPlayersToTeamMutation.isPending}
              >
                {assignPlayersToTeamMutation.isPending ? t("players.assigning") : translateWithParams(t, "players.assignToTeam", { count: String(selectedPlayers.size) })}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
