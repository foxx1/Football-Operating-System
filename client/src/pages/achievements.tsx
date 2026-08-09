import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Star, Crown, Target, Users, Calendar, Clock, Flame, Award } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import { cn, getDisplayName } from "@/lib/utils";

const iconMap = {
  Play: Target,
  Target: Target,
  Award: Award,
  Trophy: Trophy,
  Calendar: Calendar,
  CalendarCheck: Calendar,
  Clock: Clock,
  Dumbbell: Trophy,
  Zap: Star,
  Users: Users,
  Crown: Crown,
  Flame: Flame,
  Star: Star,
  Medal: Medal,
};

const rarityColors = {
  common: "bg-gray-100 text-gray-800 border-gray-300",
  uncommon: "bg-green-100 text-green-800 border-green-300",
  rare: "bg-blue-100 text-blue-800 border-blue-300",
  epic: "bg-purple-100 text-purple-800 border-purple-300",
  legendary: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

const categoryColors = {
  training: "bg-blue-500",
  fitness: "bg-red-500",
  skill: "bg-purple-500",
  attendance: "bg-green-500",
  leadership: "bg-yellow-500",
  team_spirit: "bg-pink-500",
};

export default function AchievementsPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const { toast } = useToast();
  const { isRtl, t } = useI18n();

  // Fetch all players
  const { data: players = [] } = useQuery<any[]>({
    queryKey: ["/api/players"],
  });

  // Fetch all achievements
  const { data: achievements = [] } = useQuery<any[]>({
    queryKey: ["/api/achievements"],
  });

  // Fetch player achievements when a player is selected
  const { data: playerAchievements = [] } = useQuery<any[]>({
    queryKey: ["/api/achievements", selectedPlayer],
    enabled: !!selectedPlayer,
  });

  // Fetch leaderboard
  const { data: leaderboard = [] } = useQuery<any[]>({
    queryKey: ["/api/achievements/leaderboard"],
  });

  // Initialize player achievements
  const initializeMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/achievements/initialize", {}),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      toast({
        title: t("achievements.toastSuccessTitle"),
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: t("achievements.toastErrorTitle"),
        description: t("achievements.toastErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const getProgressPercentage = (progress: number, threshold: number) => {
    return Math.min((progress / threshold) * 100, 100);
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Trophy;
    return IconComponent;
  };

  const getRarityColor = (rarity: string) => {
    return rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common;
  };

  const getCategoryColor = (category: string) => {
    return categoryColors[category as keyof typeof categoryColors] || categoryColors.training;
  };

  const getRarityLabel = (rarity: string) => {
    return t(`achievements.rarity.${rarity}`);
  };

  const getCategoryLabel = (category: string) => {
    return t(`achievements.category.${category}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("achievements.title")}</h1>
          <p className="text-muted-foreground">
            {t("achievements.description")}
          </p>
        </div>
        <Button
          onClick={() => initializeMutation.mutate()}
          disabled={initializeMutation.isPending}
          variant="outline"
        >
          {initializeMutation.isPending ? t("achievements.initializing") : t("achievements.initialize")}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">{t("achievements.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="player-progress">{t("achievements.tabs.playerProgress")}</TabsTrigger>
          <TabsTrigger value="leaderboard">{t("achievements.tabs.leaderboard")}</TabsTrigger>
          <TabsTrigger value="all-achievements">{t("achievements.tabs.allAchievements")}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className={cn("flex items-center justify-between space-y-0 pb-2", isRtl ? "flex-row-reverse" : "flex-row")}>
                <CardTitle className="text-sm font-medium">{t("achievements.stats.totalAchievements")}</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{achievements.length}</div>
                <p className="text-xs text-muted-foreground">{t("achievements.stats.availableToUnlock")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={cn("flex items-center justify-between space-y-0 pb-2", isRtl ? "flex-row-reverse" : "flex-row")}>
                <CardTitle className="text-sm font-medium">{t("achievements.stats.activePlayers")}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{players.length}</div>
                <p className="text-xs text-muted-foreground">{t("achievements.stats.trackingProgress")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={cn("flex items-center justify-between space-y-0 pb-2", isRtl ? "flex-row-reverse" : "flex-row")}>
                <CardTitle className="text-sm font-medium">{t("achievements.stats.categories")}</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">6</div>
                <p className={cn("text-xs text-muted-foreground", isRtl ? "text-right" : "text-left")}>{t("achievements.stats.achievementTypes")}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={cn("flex items-center justify-between space-y-0 pb-2", isRtl ? "flex-row-reverse" : "flex-row")}>
                <CardTitle className="text-sm font-medium">{t("achievements.stats.topScorer")}</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {leaderboard[0]?.total_points || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {leaderboard[0]
                    ? getDisplayName(
                        {
                          firstName: leaderboard[0].first_name,
                          lastName: leaderboard[0].last_name,
                          firstNameAr: leaderboard[0].first_name_ar,
                          lastNameAr: leaderboard[0].last_name_ar,
                        },
                        isRtl,
                      )
                    : t("achievements.stats.noData")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Achievement Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoryColors).map(([category, color]) => {
              const categoryAchievements = achievements.filter((a: any) => a.category === category);
              return (
                <Card key={category}>
                  <CardHeader className={cn(isRtl && "items-end text-right")}>
                    <CardTitle className={cn("flex items-center gap-2", isRtl && "flex-row-reverse")}>
                      <div className={`w-3 h-3 rounded-full ${color}`}></div>
                      {getCategoryLabel(category)}
                    </CardTitle>
                    <CardDescription>
                      {translateWithParams(t, "achievements.categoriesAvailable", { count: String(categoryAchievements.length) })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categoryAchievements.slice(0, 3).map((achievement: any) => (
                        <div key={achievement.id} className="flex items-center gap-2">
                          <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                            {getRarityLabel(achievement.rarity)}
                          </Badge>
                          <span className="text-sm">{achievement.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Player Progress Tab */}
        <TabsContent value="player-progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("achievements.playerProgressTitle")}</CardTitle>
              <CardDescription>
                {t("achievements.playerProgressDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Select onValueChange={setSelectedPlayer} value={selectedPlayer}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder={t("achievements.selectPlayerPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player: any) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {getDisplayName(player, isRtl)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlayer && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {playerAchievements.map((achievement: any) => {
                    const IconComponent = getIcon(achievement.icon);
                    const progressPercentage = getProgressPercentage(achievement.progress || 0, achievement.threshold || 1);
                    
                    return (
                      <Card key={achievement.id} className={achievement.is_completed ? "border-green-500 bg-green-50" : ""}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-5 w-5" />
                              <CardTitle className="text-base">{achievement.name}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                                {getRarityLabel(achievement.rarity)}
                              </Badge>
                              {achievement.is_completed && (
                                <Badge variant="default" className="bg-green-600">
                                  {t("achievements.completed")}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <CardDescription>{achievement.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span>{t("achievements.progress")}</span>
                              <span>{achievement.progress || 0} / {achievement.threshold}</span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                              <span>{achievement.points} {t("achievements.points")}</span>
                              {achievement.completed_at && (
                                <span>{translateWithParams(t, "achievements.completedOn", { date: new Date(achievement.completed_at).toLocaleDateString() })}</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("achievements.leaderboardTitle")}</CardTitle>
              <CardDescription>
                {t("achievements.leaderboardDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((player: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {getDisplayName(
                            {
                              firstName: player.first_name,
                              lastName: player.last_name,
                              firstNameAr: player.first_name_ar,
                              lastNameAr: player.last_name_ar,
                            },
                            isRtl,
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {translateWithParams(t, "achievements.achievementsCompleted", { count: String(player.completed_achievements) })}
                        </div>
                      </div>
                    </div>
                    <div className={cn(isRtl ? "text-left" : "text-right")}>
                      <div className="font-bold text-lg">{player.total_points}</div>
                      <div className="text-sm text-muted-foreground">{t("achievements.points")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Achievements Tab */}
        <TabsContent value="all-achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("achievements.allAchievementsTitle")}</CardTitle>
              <CardDescription>
                {t("achievements.allAchievementsDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement: any) => {
                  const IconComponent = getIcon(achievement.icon);

                  return (
                    <Card key={achievement.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-5 w-5" />
                            <CardTitle className="text-base">{achievement.name}</CardTitle>
                          </div>
                          <Badge variant="outline" className={getRarityColor(achievement.rarity)}>
                            {getRarityLabel(achievement.rarity)}
                          </Badge>
                        </div>
                        <CardDescription>{achievement.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{t("achievements.category")}</span>
                            <Badge variant="outline" style={{ backgroundColor: getCategoryColor(achievement.category) + '20' }}>
                              {getCategoryLabel(achievement.category)}
                            </Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>{t("achievements.requirement")}</span>
                            <span>{achievement.threshold} {achievement.criteria_type?.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>{t("achievements.pointsLabel")}</span>
                            <span className="font-semibold">{achievement.points}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
