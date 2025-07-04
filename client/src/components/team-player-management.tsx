import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, UserPlus } from "lucide-react";
import PlayerForm from "@/components/player-form";
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

  const { data: teamPlayers = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/teams", team.id, "players"],
    enabled: !!team.id && isOpen,
  });

  const { data: allPlayers = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    enabled: isOpen,
  });

  const unassignedPlayers = allPlayers.filter(
    player => !teamPlayers.some(tp => tp.id === player.id)
  );

  const formatCategoryName = (category: string) => {
    switch (category.toLowerCase()) {
      case 'first_team': return 'First Team';
      case 'reserves': return 'Reserves';
      case 'under_21': return 'Under 21';
      case 'under_19': return 'Under 19';
      case 'under_17': return 'Under 17';
      case 'under_15': return 'Under 15';
      case 'academy_rootgrass': return 'Academy - Rootgrass';
      case 'youth': return 'Youth Team';
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Users className="w-6 h-6" />
            <span>Manage Players - {team.name}</span>
            <Badge className={getCategoryColor(team.category)}>
              {formatCategoryName(team.category)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Add players to {team.name} and manage team squad assignments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="current">Current Squad ({teamPlayers.length})</TabsTrigger>
              <TabsTrigger value="available">Available Players ({unassignedPlayers.length})</TabsTrigger>
              <TabsTrigger value="add-new">Add New Player</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Current Squad</h3>
                <div className="text-sm text-muted-foreground">
                  {teamPlayers.length} players assigned
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
                    <p className="text-lg font-medium">No players assigned</p>
                    <p className="text-sm">Add players to build your squad</p>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teamPlayers.map((player) => (
                    <Card key={player.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
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
                              {player.position}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="available" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Available Players</h3>
                <div className="text-sm text-muted-foreground">
                  {unassignedPlayers.length} players available
                </div>
              </div>

              {unassignedPlayers.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                  <div className="text-muted-foreground">
                    <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No available players</p>
                    <p className="text-sm">All players are already assigned to teams</p>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unassignedPlayers.map((player) => (
                    <Card key={player.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
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
                                {player.position}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Plus className="w-4 h-4 mr-1" />
                            Add
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
                <h3 className="text-lg font-semibold">Add New Player</h3>
                <Badge variant="outline">
                  {needsFullContract(team.category) ? 'Full Contract' : 'Simplified Form'}
                </Badge>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {needsFullContract(team.category) 
                      ? 'Professional Player Registration' 
                      : 'Youth Player Registration'
                    }
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {needsFullContract(team.category) 
                      ? 'Complete form with contract details and salary information.'
                      : 'Simplified form for youth players without contract requirements.'
                    }
                  </div>
                </CardHeader>
                <CardContent>
                  <PlayerForm 
                    onSuccess={() => {
                      setIsAddPlayerOpen(false);
                      // Will automatically refresh the player lists through React Query
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}