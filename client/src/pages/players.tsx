import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProfileImage } from "@/components/ui/profile-image";
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, User } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AddPlayerDialog from "@/components/players/add-player-dialog";
import type { Player } from "@shared/schema";

export default function Players() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const deletePlayerMutation = useMutation({
    mutationFn: (playerId: number) => 
      apiRequest("DELETE", `/api/players/${playerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
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
    if (confirm("Are you sure you want to delete this player?")) {
      deletePlayerMutation.mutate(playerId);
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
          <Card key={player.id} className="stats-card hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium overflow-hidden">
                    {player.profilePicture ? (
                      <img
                        src={`http://localhost:5000${player.profilePicture}`}
                        alt={`${player.firstName} ${player.lastName}`}
                        className="w-full h-full object-cover"
                        style={{ display: 'block' }}
                      />
                    ) : (
                      <span className="text-sm font-medium">
                        {player.firstName[0]}{player.lastName[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {player.firstName} {player.lastName}
                    </h3>
                    {player.shirtNumber && (
                      <p className="text-sm text-muted-foreground">#{player.shirtNumber}</p>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setEditingPlayer(player)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Badge className={getPositionColor(player.position)}>
                  {player.position}
                </Badge>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Age: {new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear()}</p>
                  <p>Nationality: {player.nationality}</p>
                  {player.height && player.weight && (
                    <p>{player.height}cm • {player.weight}kg</p>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setEditingPlayer(player)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleDeletePlayer(player.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
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
    </div>
  );
}
