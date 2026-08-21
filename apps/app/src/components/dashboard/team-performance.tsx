import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface PerformanceMetric {
  label: string;
  value: number;
  color: string;
}

interface TopPerformer {
  id: number;
  name: string;
  position: string;
  rating: number;
  avatar?: string;
}

const performanceMetrics: PerformanceMetric[] = [
  { label: "Training Attendance", value: 92, color: "bg-green-500" },
  { label: "Fitness Level", value: 85, color: "bg-primary" },
  { label: "Tactical Understanding", value: 78, color: "bg-orange-500" },
];

const topPerformers: TopPerformer[] = [
  {
    id: 1,
    name: "Sarah Wilson",
    position: "Midfielder",
    rating: 9.2,
  },
  {
    id: 2,
    name: "James Martinez",
    position: "Forward",
    rating: 8.8,
  },
  {
    id: 3,
    name: "Alex Johnson",
    position: "Midfielder",
    rating: 8.5,
  },
];

export default function TeamPerformance() {
  return (
    <Card className="content-card">
      <CardHeader>
        <CardTitle>Team Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="space-y-4">
            {performanceMetrics.map((metric) => (
              <div key={metric.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{metric.label}</span>
                  <span className="font-medium text-foreground">{metric.value}%</span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </div>
            ))}
          </div>

          {/* Top Performers */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">
              Top Performers This Week
            </h4>
            <div className="space-y-3">
              {topPerformers.map((player, index) => (
                <div key={player.id} className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={player.avatar} alt={player.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {player.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {index === 0 && (
                      <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 bg-yellow-500 text-yellow-50">
                        1
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {player.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {player.position}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs font-medium text-foreground">
                      {player.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
