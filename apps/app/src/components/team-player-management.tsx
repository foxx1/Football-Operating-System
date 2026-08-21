import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, UserPlus, X } from "lucide-react";
import AddPlayerDialog from "@/components/players/add-player-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";
import type { Team, Player } from "@shared/schema";

interface TeamPlayerManagementProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
}

// Determine if team needs full contract form
const needsFullContract = (category: string) => {
  const fullContractCategories = ['first_team', 'reserves', 'under_21'];
  return fullContractCategories.includes(category.toLowerCase());
};

export default function TeamPlayerManagement({ team, isOpen, onClose }: TeamPlayerManagementProps) {
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  const { isRtl, t } = useI18n();

  const { data: teamPlayersData = [], isLoading: playersLoading } = useQuery<any[]>({
    queryKey: [`/api/teams/${team.id}/players`],
    enabled: !!team.id && isOpen,
    staleTime: 0, // Always refetch
  });

  const { data: allPlayers = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    enabled: isOpen,
    staleTime: 0, // Always refetch
  });

  // Extract just the players from team-player relationships and remove duplicates
  const teamPlayerIds = new Set(teamPlayersData.map(tp => tp.player?.id).filter(Boolean));
  const teamPlayers = teamPlayersData
    .map(tp => tp.player)
    .filter(Boolean)
    .filter((player, index, array) => array.findIndex(p => p.id === player.id) === index);
  
  const unassignedPlayers = allPlayers.filter(
    player => !teamPlayerIds.has(player.id)
  );

  const addPlayerToSquadMutation = useMutation({
    mutationFn: (playerId: number) => 
      apiRequest("POST", `/api/teams/${team.id}/players/${playerId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${team.id}/players`] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: t("teamForm.createdTitle"),
        description: t("teamManage.addedToast"),
      });
    },
    onError: (error: any) => {
      const isAlreadyAssigned = error?.message?.includes("already assigned");
      toast({
        title: "Error",
        description: isAlreadyAssigned 
          ? t("teamManage.alreadyAssigned")
          : t("teamManage.addError"),
        variant: "destructive",
      });
    },
  });

  const removePlayerFromSquadMutation = useMutation({
    mutationFn: (playerId: number) => 
      apiRequest("DELETE", `/api/teams/${team.id}/players/${playerId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${team.id}/players`] });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: t("teamForm.createdTitle"),
        description: t("teamManage.removedToast"),
      });
    },
    onError: () => {
      toast({
        title: t("teamForm.errorTitle"),
        description: t("teamManage.removeError"),
        variant: "destructive",
      });
    },
  });

  const formatCategoryName = (category: string) => {
    switch (category.toLowerCase()) {
      case 'first_team': return t("teamCategory.first_team");
      case 'reserves': return t("teamCategory.reserves");
      case 'under_21': return t("teamCategory.under_21");
      case 'under_19': return t("teamCategory.under_19");
      case 'under_17': return t("teamCategory.under_17");
      case 'under_15': return t("teamCategory.under_15");
      case 'academy_rootgrass': return t("teamCategory.academy_rootgrass");
      case 'youth': return t("teamCategory.youth");
      default: return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'first_team': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reserves': return 'bg-green-100 text-green-800 border-green-200';
      case 'under_21': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'under_19': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'under_17': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'under_15': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'academy_rootgrass': return 'bg-teal-100 text-teal-800 border-teal-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center", isRtl ? "space-x-reverse space-x-3" : "space-x-3")}>
            <Users className="w-6 h-6" />
            <span>{translateWithParams(t, "teamManage.title", { teamName: team.name })}</span>
            <Badge className={getCategoryColor(team.category)}>
              {formatCategoryName(team.category)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {translateWithParams(t, "teamManage.description", { teamName: team.name })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="current">{translateWithParams(t, "teamManage.current", { count: String(teamPlayers.length) })}</TabsTrigger>
              <TabsTrigger value="available">{translateWithParams(t, "teamManage.available", { count: String(unassignedPlayers.length) })}</TabsTrigger>
              <TabsTrigger value="add-new">{t("teamManage.addNew")}</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t("teamManage.currentTitle")}</h3>
                <div className="text-sm text-muted-foreground">
                  {translateWithParams(t, "teamManage.assignedCount", { count: String(teamPlayers.length) })}
                </div>
              </div>
              
              {playersLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4">
                        <div className="h-20 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : teamPlayers.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                  <div className="text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">{t("teamManage.noAssigned")}</p>
                    <p className="text-sm">{t("teamManage.noAssignedDescription")}</p>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamPlayers.map((player) => (
                    <Card key={player.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-3" : "space-x-3")}>
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold">
                                {player.shirtNumber || '?'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">
                                {player.firstName} {player.lastName}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {t(`position.${player.position}`)}
                              </p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removePlayerFromSquadMutation.mutate(player.id)}
                            disabled={removePlayerFromSquadMutation.isPending}
                          >
                            <X className={cn("w-4 h-4", isRtl ? "ml-1" : "mr-1")} />
                            {t("teamManage.remove")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="available" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t("teamManage.availableTitle")}</h3>
                <div className="text-sm text-muted-foreground">
                  {translateWithParams(t, "teamManage.availableCount", { count: String(unassignedPlayers.length) })}
                </div>
              </div>

              {unassignedPlayers.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                  <div className="text-muted-foreground">
                    <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">{t("teamManage.noAvailable")}</p>
                    <p className="text-sm">{t("teamManage.noAvailableDescription")}</p>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unassignedPlayers.map((player) => (
                    <Card key={player.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-3" : "space-x-3")}>
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold">
                                {player.shirtNumber || '?'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {player.firstName} {player.lastName}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {t(`position.${player.position}`)}
                              </p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => addPlayerToSquadMutation.mutate(player.id)}
                            disabled={addPlayerToSquadMutation.isPending}
                          >
                            <Plus className={cn("w-4 h-4", isRtl ? "ml-1" : "mr-1")} />
                            {addPlayerToSquadMutation.isPending ? t("teamManage.adding") : t("teamManage.addToSquad")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="add-new" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t("teamManage.addNew")}</h3>
                <Badge variant="outline">
                  {needsFullContract(team.category) ? t("teamManage.fullContract") : t("teamManage.simplifiedForm")}
                </Badge>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {needsFullContract(team.category) 
                      ? t("teamManage.professionalRegistration")
                      : t("teamManage.youthRegistration")
                    }
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {needsFullContract(team.category) 
                      ? t("teamManage.professionalHelp")
                      : t("teamManage.youthHelp")
                    }
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setIsAddPlayerOpen(true)}
                    className="w-full"
                    size="lg"
                  >
                    <Plus className={cn("w-5 h-5", isRtl ? "ml-2" : "mr-2")} />
                    {t("teamManage.addNew")}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>

      <AddPlayerDialog
        open={isAddPlayerOpen}
        onOpenChange={setIsAddPlayerOpen}
      />
    </>
  );
}
