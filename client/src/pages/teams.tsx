import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Edit, Trash2, UserPlus, Shield } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import TeamForm from "@/components/team-form";
import TeamPlayerManagement from "@/components/team-player-management";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";
import type { Team } from "@shared/schema";

export default function Teams() {
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isManagePlayersOpen, setIsManagePlayersOpen] = useState(false);
  const [selectedTeamForManagement, setSelectedTeamForManagement] = useState<Team | null>(null);
  const { isRtl, t } = useI18n();

  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: teamPlayers = [], isLoading: playersLoading } = useQuery<any[]>({
    queryKey: [`/api/teams/${selectedTeam?.id}/players`],
    enabled: !!selectedTeam,
    staleTime: 0, // Always refetch to get latest data
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: number) => 
      apiRequest("DELETE", `/api/teams/${teamId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
  });

  const handleDeleteTeam = (teamId: number) => {
    if (confirm(t("teams.confirmDelete"))) {
      deleteTeamMutation.mutate(teamId);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'first_team':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'reserves':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'under_21':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'under_19':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
      case 'under_17':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      case 'under_15':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'academy_rootgrass':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400';
      case 'youth':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatCategoryName = (category: string) => {
    const key = `teamCategory.${category.toLowerCase()}`;
    const translated = t(key);
    return translated === key
      ? category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      : translated;
  };

  if (teamsLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-foreground">{t("teams.title")}</h1>
          <p className="text-muted-foreground">{t("teams.description")}</p>
        </div>
        <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
          <DialogTrigger asChild>
            <Button className="action-button bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className={cn("w-4 h-4", isRtl ? "ml-2" : "mr-2")} />
              {t("teams.create")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("teams.createTitle")}</DialogTitle>
              <DialogDescription>
                {t("teams.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <TeamForm
              onSuccess={() => setIsAddTeamOpen(false)}
              onCancel={() => setIsAddTeamOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {teams?.map((team: Team) => (
          <Card 
            key={team.id} 
            className="stats-card hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedTeam(team)}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-3" : "space-x-3")}>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                    <Badge className={getCategoryColor(team.category)}>
                      {formatCategoryName(team.category)}
                    </Badge>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTeam(team.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {team.description && (
                <p className="text-sm text-muted-foreground mb-4">{team.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div className={cn("flex items-center text-sm text-muted-foreground", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                  <Users className="w-4 h-4" />
                  <span>{t("teams.viewSquad")}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTeamForManagement(team);
                    setIsManagePlayersOpen(true);
                  }}
                >
                  <Edit className={cn("w-3 h-3", isRtl ? "ml-1" : "mr-1")} />
                  {t("teams.manage")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {teams?.length === 0 && (
        <Card className="text-center p-12">
          <CardContent>
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{t("teams.noTeams")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("teams.noTeamsDescription")}
            </p>
            <Button onClick={() => setIsAddTeamOpen(true)}>
              <Plus className={cn("w-4 h-4", isRtl ? "ml-2" : "mr-2")} />
              {t("teams.createFirst")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Team Players Modal */}
      <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className={cn("flex items-center", isRtl ? "space-x-reverse space-x-3" : "space-x-3")}>
              <Shield className="w-6 h-6 text-primary" />
              <span>{selectedTeam?.name} {t("teams.squad")}</span>
              <Badge className={getCategoryColor(selectedTeam?.category || '')}>
                {formatCategoryName(selectedTeam?.category || '')}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6">
            {playersLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : teamPlayers?.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{t("teams.noPlayersAssigned")}</h3>
                <p className="text-muted-foreground mb-4">
                  {t("teams.noPlayersAssignedDescription")}
                </p>
                <Button onClick={() => {
                  setSelectedTeamForManagement(selectedTeam);
                  setIsManagePlayersOpen(true);
                  setSelectedTeam(null);
                }}>
                  <UserPlus className={cn("w-4 h-4", isRtl ? "ml-2" : "mr-2")} />
                  {t("teams.addPlayers")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{translateWithParams(t, "teams.squadMembers", { count: String(teamPlayers?.length || 0) })}</h3>
                  <Button size="sm" onClick={() => {
                    setSelectedTeamForManagement(selectedTeam);
                    setIsManagePlayersOpen(true);
                    setSelectedTeam(null);
                  }}>
                    <UserPlus className={cn("w-4 h-4", isRtl ? "ml-2" : "mr-2")} />
                    {t("teams.addPlayer")}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamPlayers?.map((teamPlayer: any) => {
                    if (!teamPlayer?.player) {
                      return null;
                    }
                    
                    return (
                      <Card key={teamPlayer.id} className="p-4">
                        <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-3" : "space-x-3")}>
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={teamPlayer.player.profilePicture || `https://images.unsplash.com/photo-150${teamPlayer.player.id || 1}0794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face`} />
                              <AvatarFallback>
                                {teamPlayer.player.firstName?.[0] || 'P'}{teamPlayer.player.lastName?.[0] || 'L'}
                              </AvatarFallback>
                            </Avatar>
                            {teamPlayer.player.shirtNumber && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-primary-foreground">
                                  {teamPlayer.player.shirtNumber}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">
                              {teamPlayer.player.firstName} {teamPlayer.player.lastName}
                            </h4>
                            <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                              <Badge variant="outline" className="text-xs">
                                {t(`position.${teamPlayer.player.position}`)}
                              </Badge>
                              {teamPlayer.isStarter && (
                                <Badge className="text-xs bg-primary/10 text-primary">
                                  {t("teams.starter")}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Player Management Dialog */}
      {selectedTeamForManagement && (
        <TeamPlayerManagement
          team={selectedTeamForManagement}
          isOpen={isManagePlayersOpen}
          onClose={() => {
            setIsManagePlayersOpen(false);
            setSelectedTeamForManagement(null);
          }}
        />
      )}
    </div>
  );
}
