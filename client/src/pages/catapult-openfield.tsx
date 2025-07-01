import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Activity, Heart, Zap, Users, TrendingUp, Wifi, Settings, Link, Target, Download, RefreshCw, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from "recharts";

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  shirtNumber: number | null;
}

export default function CatapultOpenFieldPage() {
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api.catapultsports.com");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");

  const { data: players = [] } = useQuery({
    queryKey: ['/api/players'],
  });

  // Mock Catapult data for demonstration
  const mockCatapultData = {
    athletes: [
      {
        id: 1,
        name: "Ahmed Al-Rashid",
        isConnected: true,
        lastSync: "2025-01-01T08:30:00Z",
        gpsData: {
          totalDistance: 8420,
          topSpeed: 34.2,
          sprintCount: 12,
          accelerations: 45,
          decelerations: 38
        },
        loadData: {
          playerLoad: 485,
          explosiveEfforts: 23,
          highIntensityRunning: 1240,
          metabolicPower: 18.5
        },
        heartRate: {
          maxHR: 192,
          avgHR: 158,
          hrZones: {
            zone1: 12,
            zone2: 18,
            zone3: 25,
            zone4: 32,
            zone5: 13
          }
        }
      },
      {
        id: 2,
        name: "Omar Hassan",
        isConnected: true,
        lastSync: "2025-01-01T08:30:00Z",
        gpsData: {
          totalDistance: 7850,
          topSpeed: 32.8,
          sprintCount: 9,
          accelerations: 38,
          decelerations: 42
        },
        loadData: {
          playerLoad: 456,
          explosiveEfforts: 19,
          highIntensityRunning: 1180,
          metabolicPower: 17.2
        },
        heartRate: {
          maxHR: 188,
          avgHR: 162,
          hrZones: {
            zone1: 15,
            zone2: 22,
            zone3: 28,
            zone4: 25,
            zone5: 10
          }
        }
      }
    ],
    sessions: [
      {
        id: 1,
        date: "2025-01-01",
        type: "Training",
        duration: 90,
        participants: 22,
        avgLoad: 470
      },
      {
        id: 2,
        date: "2024-12-30",
        type: "Match",
        duration: 95,
        participants: 18,
        avgLoad: 520
      }
    ]
  };

  const loadTrendData = [
    { date: "Dec 26", load: 450, teamAvg: 465 },
    { date: "Dec 27", load: 485, teamAvg: 470 },
    { date: "Dec 28", load: 420, teamAvg: 455 },
    { date: "Dec 29", load: 510, teamAvg: 480 },
    { date: "Dec 30", load: 520, teamAvg: 490 },
    { date: "Dec 31", load: 475, teamAvg: 470 },
    { date: "Jan 01", load: 485, teamAvg: 475 }
  ];

  const performanceMetrics = [
    { metric: "Distance", value: 8420, unit: "m", change: "+2.3%" },
    { metric: "Top Speed", value: 34.2, unit: "km/h", change: "+1.8%" },
    { metric: "Sprints", value: 12, unit: "count", change: "-5.2%" },
    { metric: "Player Load", value: 485, unit: "AU", change: "+3.1%" }
  ];

  const handleConnectAPI = async () => {
    await apiRequest("/api/catapult/connect", {
      method: "POST",
      body: JSON.stringify({
        playerId: parseInt(selectedPlayerId),
        apiKey,
        baseUrl,
      }),
    });
    
    queryClient.invalidateQueries({ queryKey: ['/api/catapult'] });
    setIsConnectDialogOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex items-center">
              <svg 
                className="h-8 w-auto" 
                viewBox="0 0 180 40" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <g fill="currentColor">
                  {/* Catapult icon - stylized C with motion lines */}
                  <path d="M8 20c0-6.627 5.373-12 12-12s12 5.373 12 12-5.373 12-12 12S8 26.627 8 20zm4 0c0 4.418 3.582 8 8 8s8-3.582 8-8-3.582-8-8-8-8 3.582-8 8z"/>
                  <path d="M28 16l4-2v12l-4-2V16z"/>
                  <path d="M34 14l3-1.5v15L34 26V14z"/>
                  <path d="M39 12l2-1v18l-2-1V12z"/>
                  {/* CATAPULT text */}
                  <text x="50" y="26" className="fill-current text-lg font-bold" style={{fontFamily: 'Arial, sans-serif'}}>
                    CATAPULT
                  </text>
                </g>
              </svg>
            </div>
            <h1 className="text-3xl font-bold">OpenField Integration</h1>
          </div>
          <p className="text-muted-foreground">
            Connect with Catapult OpenField API to access comprehensive athlete performance data and analytics
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Data
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Link className="mr-2 h-4 w-4" />
                Connect API
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Connect to Catapult OpenField</DialogTitle>
                <DialogDescription>
                  Enter your Catapult OpenField API credentials to connect and sync athlete data
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter your Catapult API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input
                    id="baseUrl"
                    placeholder="https://api.catapultsports.com"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="player">Select Player</Label>
                  <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a player to connect" />
                    </SelectTrigger>
                    <SelectContent>
                      {(players as Player[]).map((player: Player) => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.firstName} {player.lastName} - {player.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsConnectDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleConnectAPI}>
                    Connect
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="athletes">Connected Athletes</TabsTrigger>
          <TabsTrigger value="sessions">Session Data</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Integration Status Banner */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Wifi className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Catapult Connect Integration</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Seamlessly sync OpenField data with your proprietary team platform
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  API Ready
                </Badge>
              </div>
            </CardContent>
          </Card>

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
                <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5 min</div>
                <p className="text-xs text-muted-foreground">
                  ago • Auto-sync enabled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Player Load</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">470</div>
                <p className="text-xs text-muted-foreground">
                  +3.2% from last session
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98%</div>
                <p className="text-xs text-muted-foreground">
                  GPS signal quality
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Load Trends</CardTitle>
                <CardDescription>7-day player load comparison with team average</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={loadTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="load" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="teamAvg" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Latest training and match data from OpenField</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCatapultData.sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{session.type}</div>
                        <div className="text-sm text-muted-foreground">{session.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{session.avgLoad} AU</div>
                        <div className="text-sm text-muted-foreground">{session.participants} players</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="athletes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockCatapultData.athletes.map((athlete) => (
              <Card key={athlete.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{athlete.name}</CardTitle>
                    <Badge variant={athlete.isConnected ? "default" : "secondary"}>
                      {athlete.isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Last sync: {new Date(athlete.lastSync).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Distance</div>
                      <div className="text-2xl font-bold">{athlete.gpsData.totalDistance}m</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Top Speed</div>
                      <div className="text-2xl font-bold">{athlete.gpsData.topSpeed} km/h</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Player Load</div>
                      <div className="text-2xl font-bold">{athlete.loadData.playerLoad} AU</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Max HR</div>
                      <div className="text-2xl font-bold">{athlete.heartRate.maxHR} bpm</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-2">Heart Rate Zones</div>
                    <div className="space-y-2">
                      {Object.entries(athlete.heartRate.hrZones).map(([zone, percentage]) => (
                        <div key={zone} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{zone.replace('zone', 'Zone ')}</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={percentage} className="w-20 h-2" />
                            <span className="text-sm font-medium">{percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
              <CardDescription>Training and match sessions from Catapult OpenField</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCatapultData.sessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{session.type} Session</h3>
                        <p className="text-sm text-muted-foreground">{session.date}</p>
                      </div>
                      <Badge variant="outline">{session.duration} min</Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Participants</div>
                        <div className="text-lg font-bold">{session.participants}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Avg Load</div>
                        <div className="text-lg font-bold">{session.avgLoad} AU</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Duration</div>
                        <div className="text-lg font-bold">{session.duration} min</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{metric.metric}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value} {metric.unit}</div>
                  <p className={`text-xs font-medium ${
                    metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change} vs last session
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Breakdown</CardTitle>
              <CardDescription>Detailed metrics from latest session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">GPS Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Distance</span>
                      <span className="font-medium">8,420 m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">High-Intensity Running</span>
                      <span className="font-medium">1,240 m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Sprint Count</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Accelerations</span>
                      <span className="font-medium">45</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Load Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Player Load</span>
                      <span className="font-medium">485 AU</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Explosive Efforts</span>
                      <span className="font-medium">23</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Metabolic Power</span>
                      <span className="font-medium">18.5 W/kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Load vs Target</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">103%</span>
                        <Progress value={63} className="w-12 h-2" />
                      </div>
                    </div>
                  </div>
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

                  <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 dark:text-orange-200">
                      <strong>Injury Risk:</strong> High-intensity running distance 15% above normal. Monitor for overload symptoms.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Benchmark Comparisons</CardTitle>
                <CardDescription>Performance vs team and league averages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Distance vs Team Avg</span>
                      <span className="text-sm font-bold text-green-600">+12%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Load vs Position Avg</span>
                      <span className="text-sm font-bold text-green-600">+8%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Sprint vs League Avg</span>
                      <span className="text-sm font-bold text-red-600">-5%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Acceleration vs Peers</span>
                      <span className="text-sm font-bold text-green-600">+15%</span>
                    </div>
                    <Progress value={85} className="h-2" />
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