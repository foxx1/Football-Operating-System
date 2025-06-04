import { useQuery } from "@tanstack/react-query";
import { Users, Layers, CalendarCheck, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardStats {
  totalPlayers: number;
  activeTeams: number;
  weeklySessions: number;
  attendanceRate: number;
  playerGrowth: string;
  nextSession: string;
  attendanceChange: string;
}

const statsConfig = [
  {
    title: "Total Players",
    key: "totalPlayers" as keyof DashboardStats,
    icon: Users,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    change: "playerGrowth" as keyof DashboardStats,
    changeColor: "text-green-600",
  },
  {
    title: "Active Teams",
    key: "activeTeams" as keyof DashboardStats,
    icon: Layers,
    iconBg: "bg-green-100 dark:bg-green-900/20",
    iconColor: "text-green-600 dark:text-green-400",
    change: null,
    description: "First Team, Reserves, Youth",
  },
  {
    title: "This Week's Sessions",
    key: "weeklySessions" as keyof DashboardStats,
    icon: CalendarCheck,
    iconBg: "bg-orange-100 dark:bg-orange-900/20",
    iconColor: "text-orange-600 dark:text-orange-400",
    change: "nextSession" as keyof DashboardStats,
    changeColor: "text-orange-600",
  },
  {
    title: "Attendance Rate",
    key: "attendanceRate" as keyof DashboardStats,
    icon: TrendingUp,
    iconBg: "bg-red-100 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
    change: "attendanceChange" as keyof DashboardStats,
    changeColor: "text-green-600",
    isPercentage: true,
  },
];

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="stat-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-8 bg-muted rounded w-16"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
                  <div className="w-12 h-12 bg-muted rounded-lg"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load dashboard statistics</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((config) => {
        const Icon = config.icon;
        const value = stats[config.key];
        const changeValue = config.change ? stats[config.change] : null;
        
        return (
          <Card key={config.title} className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {config.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {value}{config.isPercentage ? "%" : ""}
                  </p>
                  {changeValue && (
                    <p className={`text-sm mt-1 ${config.changeColor}`}>
                      <TrendingUp className="inline w-3 h-3 mr-1" />
                      {changeValue}
                    </p>
                  )}
                  {config.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {config.description}
                    </p>
                  )}
                </div>
                <div className={`icon-wrapper ${config.iconBg}`}>
                  <Icon className={`w-6 h-6 ${config.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
