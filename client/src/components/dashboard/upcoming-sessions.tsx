import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrainingSession } from "@shared/schema";

const sessionTypeConfig = {
  technical: { icon: "⚽", bg: "bg-blue-100 dark:bg-blue-900/20", color: "text-blue-600" },
  fitness: { icon: "💪", bg: "bg-green-100 dark:bg-green-900/20", color: "text-green-600" },
  tactical: { icon: "🎯", bg: "bg-orange-100 dark:bg-orange-900/20", color: "text-orange-600" },
  friendly: { icon: "🤝", bg: "bg-purple-100 dark:bg-purple-900/20", color: "text-purple-600" },
};

export default function UpcomingSessions() {
  const { data: sessions, isLoading } = useQuery<TrainingSession[]>({
    queryKey: ["/api/training-sessions/upcoming"],
  });

  if (isLoading) {
    return (
      <Card className="content-card">
        <CardHeader>
          <CardTitle>Upcoming Training Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-muted rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-48"></div>
                    <div className="h-3 bg-muted rounded w-64"></div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-3 bg-muted rounded w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card className="content-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Upcoming Training Sessions</CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No upcoming training sessions scheduled</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="content-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Upcoming Training Sessions</CardTitle>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.slice(0, 3).map((session) => {
            const config = sessionTypeConfig[session.sessionType as keyof typeof sessionTypeConfig] || sessionTypeConfig.technical;
            const timeFromNow = formatDistanceToNow(new Date(session.scheduledAt), { addSuffix: true });
            const formattedTime = format(new Date(session.scheduledAt), "PPp");
            
            return (
              <div
                key={session.id}
                className="flex items-center space-x-4 p-4 bg-muted/30 dark:bg-muted/10 rounded-lg hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors cursor-pointer"
              >
                <div className={`icon-wrapper ${config.bg}`}>
                  <span className="text-lg">{config.icon}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{session.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{session.duration} minutes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3" />
                      <span>{session.location}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{timeFromNow}</p>
                  <p className="text-xs text-muted-foreground">{formattedTime}</p>
                  <Badge variant="secondary" className="mt-1">
                    <Users className="w-3 h-3 mr-1" />
                    Team Session
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
