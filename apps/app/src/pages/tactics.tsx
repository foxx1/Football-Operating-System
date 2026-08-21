import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Save, Edit, Trash2, Swords, Users, Copy, Play } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import TacticsBoard from "@/components/tactics-board";
import type { TacticalFormation, Team } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Tactics() {
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [isCreateFormationOpen, setIsCreateFormationOpen] = useState(false);
  const [editingFormation, setEditingFormation] = useState<TacticalFormation | null>(null);
  const [newFormationName, setNewFormationName] = useState("");
  const [newFormationType, setNewFormationType] = useState("");
  const { toast } = useToast();

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: formations = [], isLoading } = useQuery<TacticalFormation[]>({
    queryKey: ["/api/teams", selectedTeam, "formations"],
    enabled: !!selectedTeam,
  });

  const { data: teamPlayers = [] } = useQuery<any[]>({
    queryKey: ["/api/teams", selectedTeam, "players"],
    enabled: !!selectedTeam,
  });

  const createFormationMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("POST", "/api/formations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam, "formations"] });
      toast({
        title: "Success",
        description: "Formation created successfully",
      });
      setIsCreateFormationOpen(false);
      setNewFormationName("");
      setNewFormationType("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create formation",
        variant: "destructive",
      });
    },
  });

  const updateFormationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/formations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam, "formations"] });
      toast({
        title: "Success",
        description: "Formation updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update formation",
        variant: "destructive",
      });
    },
  });

  const deleteFormationMutation = useMutation({
    mutationFn: (formationId: number) => 
      apiRequest("DELETE", `/api/formations/${formationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam, "formations"] });
      toast({
        title: "Success",
        description: "Formation deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete formation",
        variant: "destructive",
      });
    },
  });

  const handleCreateFormation = () => {
    if (!newFormationName || !newFormationType || !selectedTeam) return;

    const defaultPositions = generateDefaultPositions(newFormationType);
    
    createFormationMutation.mutate({
      name: newFormationName,
      formation: newFormationType,
      teamId: selectedTeam,
      positions: defaultPositions,
      notes: "",
    });
  };

  const handleSaveFormation = (formationId: number, positions: any[], notes: string) => {
    updateFormationMutation.mutate({
      id: formationId,
      data: { positions, notes }
    });
  };

  const handleDeleteFormation = (formationId: number) => {
    if (confirm("Are you sure you want to delete this formation?")) {
      deleteFormationMutation.mutate(formationId);
    }
  };

  const generateDefaultPositions = (formation: string) => {
    const positions: any[] = [];
    const [defenders, midfielders, forwards] = formation.split('-').map(Number);
    
    // Goalkeeper
    positions.push({
      id: 'gk',
      playerId: null,
      position: 'goalkeeper',
      x: 50,
      y: 90,
    });

    // Defenders
    const defenderSpacing = 80 / (defenders + 1);
    for (let i = 0; i < defenders; i++) {
      positions.push({
        id: `def-${i}`,
        playerId: null,
        position: 'defender',
        x: 10 + defenderSpacing * (i + 1),
        y: 75,
      });
    }

    // Midfielders
    const midfielderSpacing = 80 / (midfielders + 1);
    for (let i = 0; i < midfielders; i++) {
      positions.push({
        id: `mid-${i}`,
        playerId: null,
        position: 'midfielder',
        x: 10 + midfielderSpacing * (i + 1),
        y: 50,
      });
    }

    // Forwards
    const forwardSpacing = 80 / (forwards + 1);
    for (let i = 0; i < forwards; i++) {
      positions.push({
        id: `fwd-${i}`,
        playerId: null,
        position: 'forward',
        x: 10 + forwardSpacing * (i + 1),
        y: 25,
      });
    }

    return positions;
  };

  const commonFormations = [
    "4-4-2", "4-3-3", "3-5-2", "4-2-3-1", "5-3-2", "3-4-3", "4-5-1"
  ];

  if (!selectedTeam) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tactics Board</h1>
            <p className="text-muted-foreground">Create and manage tactical formations for your teams</p>
          </div>
        </div>

        <Card className="text-center p-12">
          <CardContent>
            <Swords className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Select a Team</h3>
            <p className="text-muted-foreground mb-4">
              Choose a team to start creating tactical formations.
            </p>
            <Select onValueChange={(value) => setSelectedTeam(parseInt(value))}>
              <SelectTrigger className="max-w-xs mx-auto">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams?.map((team: Team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedTeamData = teams?.find((t: Team) => t.id === selectedTeam);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tactics Board</h1>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-muted-foreground">Team:</p>
            <Badge className="bg-primary/10 text-primary">
              {selectedTeamData?.name}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedTeam(null)}
            >
              Change Team
            </Button>
          </div>
        </div>
        <Dialog open={isCreateFormationOpen} onOpenChange={setIsCreateFormationOpen}>
          <DialogTrigger asChild>
            <Button className="action-button bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              New Formation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Formation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="formation-name">Formation Name</Label>
                <Input
                  id="formation-name"
                  value={newFormationName}
                  onChange={(e) => setNewFormationName(e.target.value)}
                  placeholder="e.g., Main Attack Formation"
                  className="form-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="formation-type">Formation Type</Label>
                <Select onValueChange={setNewFormationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select formation" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonFormations.map((formation) => (
                      <SelectItem key={formation} value={formation}>
                        {formation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateFormationOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateFormation}
                  disabled={!newFormationName || !newFormationType || createFormationMutation.isPending}
                >
                  {createFormationMutation.isPending ? "Creating..." : "Create Formation"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Formations List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Formations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
                  ))}
                </div>
              ) : formations?.length === 0 ? (
                <div className="text-center py-8">
                  <Swords className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No formations created</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formations?.map((formation: TacticalFormation) => (
                    <div
                      key={formation.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        editingFormation?.id === formation.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted border-border'
                      }`}
                      onClick={() => setEditingFormation(formation)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{formation.name}</h4>
                          <Badge variant="outline" className="text-xs mt-1">
                            {formation.formation}
                          </Badge>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Copy formation logic would go here
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFormation(formation.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tactics Board */}
        <div className="lg:col-span-3">
          {editingFormation ? (
            <TacticsBoard
              formation={editingFormation}
              players={teamPlayers || []}
              onSave={(positions, notes) => handleSaveFormation(editingFormation.id, positions, notes)}
              onPositionsChange={(positions) => {
                // Auto-save positions as they change
                handleSaveFormation(editingFormation.id, positions, editingFormation.notes || "");
              }}
            />
          ) : (
            <Card className="h-[600px]">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Swords className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Select a Formation</h3>
                  <p className="text-muted-foreground">
                    Choose a formation from the list to start tactical planning.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
