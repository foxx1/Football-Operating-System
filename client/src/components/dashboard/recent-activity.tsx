import { formatDistanceToNow } from "date-fns";
import { CheckCircle, AlertCircle, User, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: number;
  playerName: string;
  playerAvatar?: string;
  action: string;
  timestamp: Date;
  status: "completed" | "updated" | "pending" | "injury";
}

const mockActivities: Activity[] = [
  {
    id: 1,
    playerName: "Alex Johnson",
    action: "completed fitness assessment with excellent results",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: "completed",
  },
  {
    id: 2,
    playerName: "Michael Roberts",
    action: "updated availability for next week's matches",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    status: "updated",
  },
  {
    id: 3,
    playerName: "David Chen",
    action: "submitted injury report - minor ankle sprain",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    status: "injury",
  },
  {
    id: 4,
    playerName: "Sarah Wilson",
    action: "achieved new personal best in sprint times",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    status: "completed",
  },
];

const statusConfig = {
  completed: {
    variant: "default" as const,
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/20",
  },
  updated: {
    variant: "secondary" as const,
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/20",
  },
  pending: {
    variant: "outline" as const,
    icon: AlertCircle,
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/20",
  },
  injury: {
    variant: "destructive" as const,
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/20",
  },
};

export default function RecentActivity() {
  return (
    <Card className="content-card">
      <CardHeader>
        <CardTitle>Recent Player Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => {
            const config = statusConfig[activity.status];
            const Icon = config.icon;
            
            return (
              <div key={activity.id} className="flex items-start space-x-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={activity.playerAvatar} alt={activity.playerName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {activity.playerName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.playerName}</span>
                    {" "}
                    <span className="text-muted-foreground">{activity.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
                <Badge variant={config.variant} className="shrink-0">
                  <Icon className="w-3 h-3 mr-1" />
                  {activity.status === "injury" ? "Injury Report" : 
                   activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
