import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useInjuries } from "@/lib/injuries";
import type { Match, MatchSquad, Player, TeamPlayer } from "@shared/schema";

type TeamPlayerWithPlayer = TeamPlayer & { player: Player };
type MatchSquadWithPlayer = MatchSquad & { player: Player };

const STARTING_XI_SIZE = 11;

const squadStatuses = [
  { value: "starting_xi", label: "Starting XI" },
  { value: "substitute", label: "Substitute" },
];

interface MatchSquadManagerProps {
  match: Match;
}

export default function MatchSquadManager({ match }: MatchSquadManagerProps) {
  const [playerId, setPlayerId] = useState("");
  const [status, setStatus] = useState("starting_xi");
  const [position, setPosition] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const squadKey = ["/api/matches", match.id, "squad"];
  const teamPlayersKey = ["/api/teams", match.homeTeamId, "players"];

  const { data: squad = [], isLoading: isSquadLoading } = useQuery<MatchSquadWithPlayer[]>({
    queryKey: squadKey,
    queryFn: () => apiRequest("GET", `/api/matches/${match.id}/squad`),
  });

  const { data: teamPlayers = [] } = useQuery<TeamPlayerWithPlayer[]>({
    queryKey: teamPlayersKey,
    queryFn: () => apiRequest("GET", `/api/teams/${match.homeTeamId}/players`),
  });

  const { data: injuries = [] } = useInjuries();

  // Players carrying an active injury are flagged when picking the squad.
  const injuredPlayerIds = useMemo(
    () => new Set(injuries.filter((injury) => injury.status !== "available").map((injury) => injury.playerId)),
    [injuries],
  );

  const assignedPlayerIds = useMemo(() => new Set(squad.map((item) => item.playerId)), [squad]);
  const availablePlayers = teamPlayers.filter(
    (item) => item.player.isActive && !assignedPlayerIds.has(item.playerId),
  );

  const startingXiCount = squad.filter((item) => item.status === "starting_xi").length;
  const defaultStatus = startingXiCount < STARTING_XI_SIZE ? "starting_xi" : "substitute";

  // Default the picker to Starting XI until the first 11 spots are filled,
  // then default to Substitute — the coach can still switch either way.
  useEffect(() => {
    setStatus(defaultStatus);
  }, [defaultStatus]);

  const addMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/matches/${match.id}/squad`, {
        playerId: Number(playerId),
        status,
        position: position || undefined,
      }),
    onSuccess: () => {
      setPlayerId("");
      setPosition("");
      queryClient.invalidateQueries({ queryKey: squadKey });
      toast({ title: "Squad updated", description: "Player added to the match squad." });
    },
    onError: (error: Error) => {
      toast({ title: "Unable to add player", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Partial<MatchSquad> }) =>
      apiRequest("PATCH", `/api/match-squad/${id}`, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: squadKey });
    },
    onError: (error: Error) => {
      toast({ title: "Unable to update squad", description: error.message, variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/match-squad/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: squadKey });
      toast({ title: "Squad updated", description: "Player removed from the match squad." });
    },
    onError: (error: Error) => {
      toast({ title: "Unable to remove player", description: error.message, variant: "destructive" });
    },
  });

  const addDisabled = !playerId || addMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_140px_auto] gap-3 items-end">
        <div className="space-y-2">
          <Label htmlFor="squad-player">Player</Label>
          <Select value={playerId} onValueChange={setPlayerId}>
            <SelectTrigger id="squad-player">
              <SelectValue placeholder="Select player" />
            </SelectTrigger>
            <SelectContent>
              {availablePlayers.map(({ player }) => {
                const isInjured = injuredPlayerIds.has(player.id);
                return (
                  <SelectItem key={player.id} value={player.id.toString()} disabled={isInjured}>
                    <span className={isInjured ? "text-muted-foreground" : undefined}>
                      {player.firstName} {player.lastName} - {player.position}
                    </span>
                    {isInjured && <span className="ml-2 font-medium text-red-600">Injured</span>}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="squad-status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="squad-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {squadStatuses.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="squad-position">Position</Label>
          <Input id="squad-position" value={position} onChange={(event) => setPosition(event.target.value)} placeholder="CM" />
        </div>

        <Button onClick={() => addMutation.mutate()} disabled={addDisabled}>
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      {isSquadLoading ? (
        <div className="text-sm text-muted-foreground">Loading squad...</div>
      ) : squad.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
            No players selected for this match yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {squad.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-[1fr_150px_90px_100px_90px_auto] gap-3 items-center">
                <div>
                  <div className="font-medium">{item.player.firstName} {item.player.lastName}</div>
                  <div className="text-sm text-muted-foreground">{item.player.position}</div>
                </div>

                <select
                  value={item.status}
                  onChange={(event) => updateMutation.mutate({ id: item.id, patch: { status: event.target.value } })}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {squadStatuses.map((statusItem) => (
                    <option key={statusItem.value} value={statusItem.value}>{statusItem.label}</option>
                  ))}
                </select>

                <Input
                  value={item.position || ""}
                  onChange={(event) => updateMutation.mutate({ id: item.id, patch: { position: event.target.value || null } })}
                  placeholder="Pos"
                />

                <div className="space-y-1">
                  <Label htmlFor={`minutes-${item.id}`} className="text-xs text-muted-foreground">Minutes</Label>
                  <Input
                    id={`minutes-${item.id}`}
                    type="number"
                    min={0}
                    max={130}
                    value={item.minutesPlayed ?? 0}
                    onChange={(event) => updateMutation.mutate({
                      id: item.id,
                      patch: { minutesPlayed: Math.max(0, Number(event.target.value) || 0) },
                    })}
                  />
                </div>

                <Badge variant="outline" className="justify-center">
                  #{item.shirtNumber || item.player.shirtNumber || "-"}
                </Badge>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeMutation.mutate(item.id)}
                  disabled={removeMutation.isPending}
                  aria-label="Remove player from squad"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
