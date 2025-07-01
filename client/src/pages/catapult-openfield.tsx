import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Activity, Heart, Zap, Users, TrendingUp, Wifi, Settings, Link, Target } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from "recharts";
import type { Player } from "@shared/schema";

// Mock Catapult data for demonstration
const mockCatapultData = {
  athletes: [
    {
      id: "cat_001",
      playerId: 1,
      name: "Ahmed Al-Dosari",
      position: "Midfielder",
      isConnected: true,
      lastSession: "2025-01-01T10:30:00Z",
      status: "active"
    },
    {
      id: "cat_002", 
      playerId: 2,
      name: "Omar Hassan",
      position: "Forward",
      isConnected: true,
      lastSession: "2025-01-01T09:15:00Z",
      status: "active"
    }
  ],
  sessions: [
    {
      id: "session_001",
      playerId: 1,
      date: "2025-01-01",
      sessionType: "Training",
      duration: 90,
      gpsData: {
        totalDistance: 8420,
        highSpeedRunning: 1250,
        sprints: 15,
        maxSpeed: 28.5,
        averageSpeed: 6.2
      },
      loads: {
        playerLoad: 485.2,
        playerLoadPerMinute: 5.39,
        accelerations: 45,
        decelerations: 38,
        impacts: 28
      },
      heartRate: {
        maxHr: 185,
        averageHr: 155,
        timeInZones: {
          zone1: 12,
          zone2: 25,
          zone3: 30,
          zone4: 20,
          zone5: 3
        }
      }
    }
  ],
  performanceMetrics: [
    {
      playerId: 1,
      week: "Week 1",
      totalDistance: 42100,
      highIntensityMeters: 6250,
      playerLoad: 2426,
      sprintCount: 78,
      wellness: 7.2,
      fatigue: 3.1,
      readiness: 8.5
    },
    {
      playerId: 1,
      week: "Week 2", 
      totalDistance: 38900,
      highIntensityMeters: 5800,
      playerLoad: 2198,
      sprintCount: 65,
      wellness: 6.8,
      fatigue: 4.2,
      readiness: 7.1
    }
  ]
};

export default function CatapultOpenFieldPage() {
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://openfield.catapultsports.com/api/v2");

  // Fetch players
  const { data: players = [] } = useQuery({
    queryKey: ["/api/players"],
  });

  const connectCatapultMutation = useMutation({
    mutationFn: async (data: { playerId: number, apiKey: string, baseUrl: string }) => {
      const response = await apiRequest("POST", "/api/catapult/connect", data);
      return await response.json();
    },
    onSuccess: () => {
      setIsConnectDialogOpen(false);
      setSelectedPlayerId("");
      setApiKey("");
    },
  });

  const handleConnectCatapult = () => {
    if (!selectedPlayerId || !apiKey) {
      alert("Please select a player and enter API key");
      return;
    }

    connectCatapultMutation.mutate({
      playerId: parseInt(selectedPlayerId),
      apiKey,
      baseUrl,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <img 
              src="https://www.catapultsports.com/hs-fs/hubfs/Catapult%20Sports/brand-elements/catapult-logo-black.png" 
              alt="Catapult"
              className="h-8"
            />
            <h1 className="text-3xl font-bold">OpenField Integration</h1>
          </div>
          <p className="text-muted-foreground">
            Connect with Catapult OpenField API to access comprehensive athlete performance data and analytics
          </p>
        </div>
        <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Link className="mr-2 h-4 w-4" />
              Connect API
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Connect Catapult OpenField API</DialogTitle>
              <DialogDescription>
                Configure your Catapult API connection to sync player performance data
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="player">Select Player</Label>
                <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a player" />
                  </SelectTrigger>
                  <SelectContent>
                    {(players as Player[]).map((player: Player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.firstName} {player.lastName} - #{player.shirtNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="baseUrl">API Base URL</Label>
                <Input
                  id="baseUrl"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://openfield.catapultsports.com/api/v2"
                />
              </div>

              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Catapult API key"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Get your API key from your Catapult OpenField dashboard
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will establish a secure connection to retrieve athlete performance data including GPS tracking, load metrics, and heart rate data.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleConnectCatapult}
                disabled={!selectedPlayerId || !apiKey || connectCatapultMutation.isPending}
                className="w-full"
              >
                {connectCatapultMutation.isPending ? "Connecting..." : "Connect to OpenField"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="athletes">Connected Athletes</TabsTrigger>
          <TabsTrigger value="sessions">Session Data</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected Athletes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockCatapultData.athletes.length}</div>
                <p className="text-xs text-muted-foreground">
                  {mockCatapultData.athletes.filter(a => a.isConnected).length} active connections
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latest Session</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.42 km</div>
                <p className="text-xs text-muted-foreground">Total distance covered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Player Load</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">485.2</div>
                <p className="text-xs text-muted-foreground">5.39 per minute</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max Speed</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">28.5 km/h</div>
                <p className="text-xs text-muted-foreground">Sprint performance</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Load Trend</CardTitle>
                <CardDescription>Player load progression over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockCatapultData.performanceMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="playerLoad" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Heart Rate Zones</CardTitle>
                <CardDescription>Time distribution in heart rate zones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(mockCatapultData.sessions[0].heartRate.timeInZones).map(([zone, time]) => (
                    <div key={zone} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{zone.replace('zone', 'Zone ')}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={time} className="w-20" />
                        <span className="text-sm">{time}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="athletes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockCatapultData.athletes.map((athlete) => (
              <Card key={athlete.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{athlete.name}</CardTitle>
                      <CardDescription>{athlete.position}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={athlete.isConnected ? "default" : "secondary"}>
                        {athlete.isConnected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant="outline" className="capitalize">{athlete.status}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Last Session</span>
                      <span className="text-sm">{new Date(athlete.lastSession).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Catapult ID</span>
                      <span className="text-sm font-mono">{athlete.id}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          {mockCatapultData.sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Training Session</CardTitle>
                    <CardDescription>{session.date} • {session.duration} minutes</CardDescription>
                  </div>
                  <Badge variant="outline">{session.sessionType}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-600">GPS Data</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Distance</span>
                        <span className="text-sm font-medium">{(session.gpsData.totalDistance / 1000).toFixed(2)} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">High Speed Running</span>
                        <span className="text-sm font-medium">{session.gpsData.highSpeedRunning} m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Sprints</span>
                        <span className="text-sm font-medium">{session.gpsData.sprints}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Max Speed</span>
                        <span className="text-sm font-medium">{session.gpsData.maxSpeed} km/h</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-blue-600">Load Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Player Load</span>
                        <span className="text-sm font-medium">{session.loads.playerLoad}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Load/Min</span>
                        <span className="text-sm font-medium">{session.loads.playerLoadPerMinute}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Accelerations</span>
                        <span className="text-sm font-medium">{session.loads.accelerations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Impacts</span>
                        <span className="text-sm font-medium">{session.loads.impacts}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-red-600">Heart Rate</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Max HR</span>
                        <span className="text-sm font-medium">{session.heartRate.maxHr} bpm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Average HR</span>
                        <span className="text-sm font-medium">{session.heartRate.averageHr} bpm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Zone 4+5</span>
                        <span className="text-sm font-medium">
                          {session.heartRate.timeInZones.zone4 + session.heartRate.timeInZones.zone5}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Performance Metrics</CardTitle>
              <CardDescription>Comprehensive performance tracking over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Distance & Load</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={mockCatapultData.performanceMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="totalDistance" fill="#8884d8" name="Total Distance (m)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Wellness Indicators</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={mockCatapultData.performanceMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="wellness" stroke="#82ca9d" name="Wellness" />
                      <Line type="monotone" dataKey="readiness" stroke="#8884d8" name="Readiness" />
                      <Line type="monotone" dataKey="fatigue" stroke="#ff7300" name="Fatigue" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>AI-powered analysis from Catapult data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Load Management:</strong> Player load has decreased by 9.4% this week. Consider increasing training intensity for optimal conditioning.
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <Heart className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Cardiovascular Fitness:</strong> Heart rate recovery has improved by 12% indicating enhanced aerobic capacity.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Sprint Performance:</strong> Sprint count is 17% below seasonal average. Focus on speed work in upcoming sessions.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Benchmark Comparisons</CardTitle>
                <CardDescription>Performance vs team and position averages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Total Distance</span>
                      <span className="text-sm text-green-600">+15% vs avg</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">High Intensity Running</span>
                      <span className="text-sm text-red-600">-8% vs avg</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Player Load</span>
                      <span className="text-sm text-green-600">+12% vs avg</span>
                    </div>
                    <Progress value={88} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Sprint Count</span>
                      <span className="text-sm text-red-600">-17% vs avg</span>
                    </div>
                    <Progress value={63} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}