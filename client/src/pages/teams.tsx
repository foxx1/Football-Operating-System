import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Edit, Trash2, UserPlus, Shield } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Team } from "@shared/schema";

export default function Teams() {
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["/api/teams"],
  });

  const { data: teamPlayers, isLoading: playersLoading } = useQuery({
    queryKey: ["/api/teams", selectedTeam?.id, "players"],
    enabled: !!selectedTeam,
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: number) => 
      apiRequest("DELETE", `/api/teams/${teamId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
    },
  });

  const handleDeleteTeam = (teamId: number) => {
    if (confirm("Are you sure you want to delete this team?")) {
      deleteTeamMutation.mutate(teamId);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'first_team':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'reserves':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'youth':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatCategoryName = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teams & Squads</h1>
          <p className="text-muted-foreground">Manage your team squads and player assignments</p>
        </div>
        <Dialog open={isAddTeamOpen} onOpenChange={setIsAddTeamOpen}>
          <DialogTrigger asChild>
            <Button className="action-button bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p className="text-muted-foreground">Team creation form would be implemented here.</p>
            </div>
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
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
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
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>View Squad</span>
                </div>
                <Button variant="outline" size="sm">
                  <Edit className="w-3 h-3 mr-1" />
                  Manage
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
            <h3 className="text-lg font-semibold text-foreground mb-2">No Teams Found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first team squad.
            </p>
            <Button onClick={() => setIsAddTeamOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Team
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Team Players Modal */}
      <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-primary" />
              <span>{selectedTeam?.name} Squad</span>
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
                <h3 className="text-lg font-semibold text-foreground mb-2">No Players Assigned</h3>
                <p className="text-muted-foreground mb-4">
                  This team doesn't have any players assigned yet.
                </p>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Players
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Squad Members ({teamPlayers?.length || 0})</h3>
                  <Button size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Player
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamPlayers?.map((teamPlayer: any) => {
                    if (!teamPlayer?.player) {
                      return null;
                    }
                    
                    return (
                      <Card key={teamPlayer.id} className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={`https://images.unsplash.com/photo-150${teamPlayer.player.id || 1}0794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face`} />
                            <AvatarFallback>
                              {teamPlayer.player.firstName?.[0] || 'P'}{teamPlayer.player.lastName?.[0] || 'L'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">
                              {teamPlayer.player.firstName} {teamPlayer.player.lastName}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {teamPlayer.player.position}
                              </Badge>
                              {teamPlayer.player.shirtNumber && (
                                <span className="text-xs text-muted-foreground">
                                  #{teamPlayer.player.shirtNumber}
                                </span>
                              )}
                              {teamPlayer.isStarter && (
                                <Badge className="text-xs bg-primary/10 text-primary">
                                  Starter
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
    </div>
  );
}
