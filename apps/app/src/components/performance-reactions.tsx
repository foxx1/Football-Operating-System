import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Smile, TrendingUp, Users, Calendar, Target, MessageCircle, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  shirtNumber: number | null;
}

interface PerformanceReaction {
  id: number;
  playerId: number;
  coachId: number;
  performanceType: string;
  performanceId: number | null;
  emoji: string;
  category: string;
  comment: string | null;
  isPositive: boolean;
  intensity: number;
  contextDate: string;
  createdAt: string;
}

interface ReactionsProps {
  playerId?: number;
  performanceType?: string;
  showAddReaction?: boolean;
}

const EMOJI_OPTIONS = [
  { emoji: "👍", label: "Good Job", category: "effort", isPositive: true },
  { emoji: "⚡", label: "High Energy", category: "effort", isPositive: true },
  { emoji: "🔥", label: "On Fire", category: "skill", isPositive: true },
  { emoji: "💪", label: "Strong Performance", category: "fitness", isPositive: true },
  { emoji: "⭐", label: "Star Player", category: "skill", isPositive: true },
  { emoji: "🎯", label: "Great Focus", category: "attitude", isPositive: true },
  { emoji: "💯", label: "Perfect", category: "skill", isPositive: true },
  { emoji: "❤️", label: "Team Spirit", category: "teamwork", isPositive: true },
  { emoji: "👎", label: "Needs Work", category: "effort", isPositive: false },
  { emoji: "😴", label: "Low Energy", category: "effort", isPositive: false },
  { emoji: "⚠️", label: "Attention Needed", category: "attitude", isPositive: false },
  { emoji: "📈", label: "Improving", category: "improvement", isPositive: true },
];

const CATEGORIES = [
  { value: "effort", label: "Effort", icon: TrendingUp },
  { value: "skill", label: "Skill", icon: Target },
  { value: "attitude", label: "Attitude", icon: Smile },
  { value: "fitness", label: "Fitness", icon: TrendingUp },
  { value: "teamwork", label: "Teamwork", icon: Users },
  { value: "improvement", label: "Improvement", icon: TrendingUp },
];

const PERFORMANCE_TYPES = [
  { value: "training", label: "Training Session" },
  { value: "match", label: "Match" },
  { value: "individual_session", label: "Individual Session" },
  { value: "assessment", label: "Assessment" },
];

export default function PerformanceReactions({ playerId, performanceType, showAddReaction = true }: ReactionsProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<number | undefined>(playerId);
  const [selectedPerformanceType, setSelectedPerformanceType] = useState(performanceType || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReaction, setNewReaction] = useState({
    emoji: "",
    category: "",
    comment: "",
    intensity: 3,
    contextDate: new Date().toISOString().split('T')[0],
    performanceType: "training"
  });

  const queryClient = useQueryClient();

  // Fetch players
  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  // Fetch reactions
  const { data: reactions = [], isLoading } = useQuery<PerformanceReaction[]>({
    queryKey: ["/api/performance-reactions", selectedPlayer, selectedPerformanceType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedPlayer) params.append('playerId', selectedPlayer.toString());
      if (selectedPerformanceType) params.append('performanceType', selectedPerformanceType);
      const response = await fetch(`/api/performance-reactions?${params}`, { credentials: "include" });
      if (!response.ok) throw new Error('Failed to fetch reactions');
      return response.json();
    }
  });

  // Fetch player summary if specific player selected
  const { data: playerSummary } = useQuery({
    queryKey: ["/api/performance-reactions/player", selectedPlayer],
    queryFn: async () => {
      if (!selectedPlayer) return null;
      const response = await fetch(`/api/performance-reactions/player/${selectedPlayer}`, { credentials: "include" });
      if (!response.ok) throw new Error('Failed to fetch player summary');
      return response.json();
    },
    enabled: !!selectedPlayer
  });

  // Create reaction mutation
  const createReactionMutation = useMutation({
    mutationFn: async (reaction: any) => {
      const response = await apiRequest("POST", "/api/performance-reactions", reaction);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-reactions"] });
      setIsDialogOpen(false);
      setNewReaction({
        emoji: "",
        category: "",
        comment: "",
        intensity: 3,
        contextDate: new Date().toISOString().split('T')[0],
        performanceType: "training"
      });
    }
  });

  // Delete reaction mutation
  const deleteReactionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/performance-reactions/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-reactions"] });
    }
  });

  const handleAddReaction = (emojiOption: typeof EMOJI_OPTIONS[0]) => {
    if (!selectedPlayer) return;
    
    const reaction = {
      playerId: selectedPlayer,
      emoji: emojiOption.emoji,
      category: emojiOption.category,
      isPositive: emojiOption.isPositive,
      intensity: 3,
      contextDate: new Date().toISOString().split('T')[0],
      performanceType: selectedPerformanceType || "training",
      comment: null
    };

    createReactionMutation.mutate(reaction);
  };

  const handleCustomReaction = () => {
    if (!selectedPlayer || !newReaction.emoji || !newReaction.category) return;

    const selectedEmoji = EMOJI_OPTIONS.find(e => e.emoji === newReaction.emoji);
    
    const reaction = {
      playerId: selectedPlayer,
      emoji: newReaction.emoji,
      category: newReaction.category,
      isPositive: selectedEmoji?.isPositive ?? true,
      intensity: newReaction.intensity,
      contextDate: newReaction.contextDate,
      performanceType: newReaction.performanceType,
      comment: newReaction.comment || null
    };

    createReactionMutation.mutate(reaction);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPlayerName = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    return player ? `${player.firstName} ${player.lastName}` : 'Unknown Player';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Performance Reactions</h1>
          <p className="text-gray-600 mt-1">Quick emoji feedback for player performances</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPlayer?.toString() || "all"} onValueChange={(value) => setSelectedPlayer(value === "all" ? undefined : parseInt(value))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Player" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Players</SelectItem>
              {players.map((player) => (
                <SelectItem key={player.id} value={player.id.toString()}>
                  {player.firstName} {player.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showAddReaction && selectedPlayer && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Smile className="h-4 w-4 mr-2" />
                  Add Reaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Performance Reaction</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="quick" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="quick">Quick Reactions</TabsTrigger>
                    <TabsTrigger value="detailed">Detailed Reaction</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="quick" className="space-y-4">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {EMOJI_OPTIONS.map((option) => (
                        <Button
                          key={option.emoji}
                          variant="outline"
                          className="flex flex-col items-center gap-2 h-20"
                          onClick={() => handleAddReaction(option)}
                          disabled={createReactionMutation.isPending}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span className="text-xs">{option.label}</span>
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="detailed" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="emoji">Emoji</Label>
                        <Select value={newReaction.emoji} onValueChange={(value) => setNewReaction({ ...newReaction, emoji: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select emoji" />
                          </SelectTrigger>
                          <SelectContent>
                            {EMOJI_OPTIONS.map((option) => (
                              <SelectItem key={option.emoji} value={option.emoji}>
                                {option.emoji} {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={newReaction.category} onValueChange={(value) => setNewReaction({ ...newReaction, category: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="performance-type">Performance Type</Label>
                      <Select value={newReaction.performanceType} onValueChange={(value) => setNewReaction({ ...newReaction, performanceType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PERFORMANCE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="intensity">Intensity: {newReaction.intensity}</Label>
                      <Slider
                        value={[newReaction.intensity]}
                        onValueChange={(value) => setNewReaction({ ...newReaction, intensity: value[0] })}
                        max={5}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        type="date"
                        value={newReaction.contextDate}
                        onChange={(e) => setNewReaction({ ...newReaction, contextDate: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="comment">Comment (Optional)</Label>
                      <Textarea
                        value={newReaction.comment}
                        onChange={(e) => setNewReaction({ ...newReaction, comment: e.target.value })}
                        placeholder="Add additional notes..."
                        rows={3}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleCustomReaction}
                      disabled={createReactionMutation.isPending || !newReaction.emoji || !newReaction.category}
                      className="w-full"
                    >
                      Add Reaction
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Player Summary */}
      {selectedPlayer && playerSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reactions</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playerSummary.totalReactions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positive</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{playerSummary.positiveReactions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Constructive</CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{playerSummary.negativeReactions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Intensity</CardTitle>
              <Smile className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playerSummary.avgIntensity.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Reactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reactions</CardTitle>
        </CardHeader>
        <CardContent>
          {reactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Smile className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No reactions yet. Add some feedback to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reactions.map((reaction) => (
                <div key={reaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{reaction.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getPlayerName(reaction.playerId)}</span>
                        <Badge variant={reaction.isPositive ? "default" : "secondary"}>
                          {reaction.category}
                        </Badge>
                        <Badge variant="outline">
                          {reaction.performanceType}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(reaction.contextDate)} • Intensity: {reaction.intensity}/5
                      </div>
                      {reaction.comment && (
                        <div className="text-sm text-gray-700 mt-1">"{reaction.comment}"</div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReactionMutation.mutate(reaction.id)}
                    disabled={deleteReactionMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}