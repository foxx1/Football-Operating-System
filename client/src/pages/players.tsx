import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, User, Users } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddPlayerDialog from "@/components/players/add-player-dialog";
import PlayerCard from "@/components/players/player-card";
import DetailedPreview from "@/components/cards/DetailedPreview";
import type { Player, Team } from "@shared/schema";

export default function Players() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set());
  const [previewPlayer, setPreviewPlayer] = useState<Player | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTeamAssignOpen, setIsTeamAssignOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
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
        title: "Success",
        description: "Players assigned to team successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign players to team",
        variant: "destructive",
      });
    },
  });

  const filteredPlayers = players.filter((player: Player) => {
    // Add null check to prevent undefined errors
    if (!player || !player.id) {
      console.warn('Invalid player object:', player);
      return false;
    }
    return (
      `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.position.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Players</h1>
          <p className="text-muted-foreground">Manage your team roster and player information</p>
        </div>
        <Button 
          className="action-button bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setIsAddPlayerOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Player
        </Button>
        
        <AddPlayerDialog 
          open={isAddPlayerOpen} 
          onOpenChange={setIsAddPlayerOpen}
        />
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 form-input"
          />
        </div>
        <Button variant="outline" className="action-button">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
        {selectedPlayers.size > 0 && (
          <Button 
            variant="default" 
            className="action-button bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setIsTeamAssignOpen(true)}
          >
            <Users className="w-4 h-4 mr-2" />
            Assign to Team ({selectedPlayers.size})
          </Button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{players.length}</p>
                <p className="text-sm text-muted-foreground">Total Players</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {players.filter((p: Player) => p.position === 'goalkeeper').length}
                </p>
                <p className="text-sm text-muted-foreground">Goalkeepers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {players.filter((p: Player) => p.position === 'defender').length}
                </p>
                <p className="text-sm text-muted-foreground">Defenders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {players.filter((p: Player) => ['midfielder', 'forward'].includes(p.position)).length}
                </p>
                <p className="text-sm text-muted-foreground">Mid/Forward</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Players Grid */}
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

      {/* Empty State */}
      {filteredPlayers.length === 0 && !isLoading && (
        <Card className="text-center p-12">
          <CardContent>
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Players Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No players match your search criteria.' : 'Get started by adding your first player.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsAddPlayerOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Player
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
            <DialogTitle>Assign Players to Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Assign {selectedPlayers.size} selected player{selectedPlayers.size !== 1 ? 's' : ''} to a team.
            </p>
            <div>
              <label className="text-sm font-medium">Select Team</label>
              <Select value={selectedTeamId?.toString() || ""} onValueChange={(value) => setSelectedTeamId(parseInt(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a team" />
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
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsTeamAssignOpen(false);
                  setSelectedTeamId(null);
                }}
              >
                Cancel
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
                {assignPlayersToTeamMutation.isPending ? "Assigning..." : "Assign to Team"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
