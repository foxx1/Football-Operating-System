import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Activity, Heart, Zap, Target, TrendingUp, Calendar } from "lucide-react";
import type { WearableData, PerformanceMetrics, Player } from "@shared/schema";

interface PerformanceDashboardProps {
  playerId: number;
}

export default function PerformanceDashboard({ playerId }: PerformanceDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("7");

  // Fetch player data
  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  // Fetch performance metrics
  const { data: metrics = [] } = useQuery<PerformanceMetrics[]>({
    queryKey: ["/api/performance-metrics", playerId],
    enabled: !!playerId,
  });

  // Fetch recent wearable data
  const { data: wearableData = [] } = useQuery<WearableData[]>({
    queryKey: ["/api/wearable-data", playerId],
    enabled: !!playerId,
  });

  const player = players.find((p: Player) => p.id === playerId);

  if (!player) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">Select a player to view performance data</p>
        </CardContent>
      </Card>
    );
  }

  // Mock real-time data for demonstration
  const realtimeMetrics = {
    heartRate: 142,
    calories: 387,
    steps: 12847,
    distance: 8.3,
    activeMinutes: 67,
    recovery: 85
  };

  const activityData = [
    { day: "Mon", steps: 8500, calories: 320, distance: 6.2 },
    { day: "Tue", steps: 12000, calories: 450, distance: 9.1 },
    { day: "Wed", steps: 9800, calories: 380, distance: 7.4 },
    { day: "Thu", steps: 15000, calories: 520, distance: 11.2 },
    { day: "Fri", steps: 11200, calories: 420, distance: 8.7 },
    { day: "Sat", steps: 13500, calories: 480, distance: 10.1 },
    { day: "Sun", steps: 7200, calories: 290, distance: 5.8 },
  ];

  const heartRateData = [
    { time: "06:00", rate: 65 },
    { time: "09:00", rate: 78 },
    { time: "12:00", rate: 85 },
    { time: "15:00", rate: 142 },
    { time: "18:00", rate: 92 },
    { time: "21:00", rate: 71 },
  ];

  return (
    <div className="space-y-6">
      {/* Player Header */}
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
          <Activity className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{player.firstName} {player.lastName}</h2>
          <p className="text-gray-600">{player.position} • Performance Dashboard</p>
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeMetrics.heartRate} BPM</div>
            <p className="text-xs text-green-600">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Normal range
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calories Burned</CardTitle>
            <Zap className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeMetrics.calories}</div>
            <p className="text-xs text-gray-600">Today's total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distance</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeMetrics.distance} km</div>
            <p className="text-xs text-gray-600">Training session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Steps</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeMetrics.steps.toLocaleString()}</div>
            <Progress value={85} className="mt-2" />
            <p className="text-xs text-gray-600 mt-1">85% of daily goal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Minutes</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeMetrics.activeMinutes}</div>
            <p className="text-xs text-gray-600">Training time today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recovery Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realtimeMetrics.recovery}%</div>
            <Badge variant="default" className="mt-1">Excellent</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="steps" fill="#3b82f6" name="Steps" />
                <Bar dataKey="calories" fill="#f59e0b" name="Calories" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Heart Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Heart Rate Today</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={heartRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Training Zones */}
      <Card>
        <CardHeader>
          <CardTitle>Training Zones (Last Session)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Fat Burn (50-60% max HR)</span>
              <div className="flex items-center space-x-2">
                <Progress value={25} className="w-24" />
                <span className="text-sm text-gray-600">12 min</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Cardio (60-70% max HR)</span>
              <div className="flex items-center space-x-2">
                <Progress value={45} className="w-24" />
                <span className="text-sm text-gray-600">22 min</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Peak (70-85% max HR)</span>
              <div className="flex items-center space-x-2">
                <Progress value={75} className="w-24" />
                <span className="text-sm text-gray-600">37 min</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Anaerobic (85-95% max HR)</span>
              <div className="flex items-center space-x-2">
                <Progress value={15} className="w-24" />
                <span className="text-sm text-gray-600">7 min</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
