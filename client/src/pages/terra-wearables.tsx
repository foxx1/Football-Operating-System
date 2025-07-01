import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  Activity, 
  Heart, 
  Moon, 
  Scale, 
  Smartphone, 
  Watch, 
  Plus, 
  MoreVertical, 
  Wifi, 
  WifiOff, 
  BarChart3, 
  Shield,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import type { Player } from "@shared/schema";

// Terra-like provider configurations
const TERRA_PROVIDERS = [
  {
    id: "fitbit",
    name: "Fitbit",
    displayName: "Fitbit",
    type: "event_driven",
    authType: "oauth2",
    logoUrl: "https://logo.clearbit.com/fitbit.com",
    scopes: ["activity:read", "sleep:read", "heartrate:read", "weight:read"],
    color: "#00b0b9"
  },
  {
    id: "garmin",
    name: "Garmin",
    displayName: "Garmin Connect",
    type: "polled",
    authType: "oauth2",
    logoUrl: "https://logo.clearbit.com/garmin.com",
    scopes: ["activity:read", "sleep:read", "daily:read"],
    color: "#007cc3"
  },
  {
    id: "oura",
    name: "Oura",
    displayName: "Oura Ring",
    type: "event_driven",
    authType: "oauth2",
    logoUrl: "https://logo.clearbit.com/ouraring.com",
    scopes: ["sleep:read", "daily:read", "heartrate:read"],
    color: "#ff6900"
  },
  {
    id: "apple_health",
    name: "Apple Health",
    displayName: "Apple Health",
    type: "event_driven",
    authType: "oauth2",
    logoUrl: "https://logo.clearbit.com/apple.com",
    scopes: ["activity:read", "sleep:read", "body:read", "heartrate:read"],
    color: "#007aff"
  },
  {
    id: "google_fit",
    name: "Google Fit",
    displayName: "Google Fit",
    type: "polled",
    authType: "oauth2",
    logoUrl: "https://logo.clearbit.com/google.com",
    scopes: ["activity:read", "daily:read"],
    color: "#4285f4"
  }
];

// Mock Terra-style data for demonstration
const mockTerraData = {
  connectedUsers: [
    {
      userId: "550e8400-e29b-41d4-a716-446655440001",
      playerId: 1,
      provider: "fitbit",
      lastWebhookUpdate: "2025-01-01T10:30:00Z",
      scopes: "activity:read,sleep:read,heartrate:read",
      isActive: true
    },
    {
      userId: "550e8400-e29b-41d4-a716-446655440002", 
      playerId: 2,
      provider: "garmin",
      lastWebhookUpdate: "2025-01-01T09:15:00Z",
      scopes: "activity:read,sleep:read,daily:read",
      isActive: true
    }
  ],
  recentActivity: [
    {
      terraUserId: "550e8400-e29b-41d4-a716-446655440001",
      name: "Morning Run",
      sport: "running",
      startTime: "2025-01-01T07:00:00Z",
      endTime: "2025-01-01T07:45:00Z",
      caloriesTotal: 425,
      distanceMeters: 6800,
      avgHeartRate: 155,
      maxHeartRate: 178,
      steps: 8940
    },
    {
      terraUserId: "550e8400-e29b-41d4-a716-446655440002",
      name: "Strength Training",
      sport: "strength_training",
      startTime: "2025-01-01T18:00:00Z",
      endTime: "2025-01-01T19:00:00Z",
      caloriesTotal: 320,
      avgHeartRate: 135,
      maxHeartRate: 165
    }
  ],
  sleepData: [
    {
      terraUserId: "550e8400-e29b-41d4-a716-446655440001",
      bedtimeStart: "2024-12-31T23:15:00Z",
      bedtimeEnd: "2025-01-01T07:00:00Z",
      sleepDurationMinutes: 420,
      sleepEfficiencyPercentage: 87.5,
      deepSleepMinutes: 95,
      remSleepMinutes: 110,
      lightSleepMinutes: 185,
      awakeMinutes: 30,
      sleepScore: 82,
      restingHeartRate: 52,
      heartRateVariability: 38.5
    }
  ],
  dailyData: [
    {
      terraUserId: "550e8400-e29b-41d4-a716-446655440001",
      calendarDate: "2025-01-01",
      steps: 12847,
      distanceMeters: 8300,
      caloriesTotal: 2340,
      caloriesActive: 850,
      restingHeartRate: 52,
      avgHeartRate: 78,
      trainingLoad: 245,
      recoveryScore: 85,
      readinessScore: 88
    }
  ]
};

export default function TerraWearablesPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedPlayerForDashboard, setSelectedPlayerForDashboard] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch players for connection
  const { data: players = [] } = useQuery({
    queryKey: ["/api/players"],
  });

  const connectProviderMutation = useMutation({
    mutationFn: async (connectionData: any) => {
      // Simulate Terra user creation
      const response = await fetch("/api/terra/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(connectionData),
      });
      if (!response.ok) throw new Error("Failed to connect provider");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Provider connected successfully!" });
      setIsConnectDialogOpen(false);
      setSelectedProvider("");
      setSelectedPlayerId("");
    },
    onError: (error) => {
      toast({ 
        title: "Failed to connect provider", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const provider = TERRA_PROVIDERS.find(p => p.id === selectedProvider);
    if (!provider) return;

    connectProviderMutation.mutate({
      playerId: parseInt(selectedPlayerId),
      provider: provider.id,
      scopes: provider.scopes.join(","),
    });
  };

  const getProviderLogo = (providerId: string) => {
    const provider = TERRA_PROVIDERS.find(p => p.id === providerId);
    return provider?.logoUrl || "";
  };

  const getProviderColor = (providerId: string) => {
    const provider = TERRA_PROVIDERS.find(p => p.id === providerId);
    return provider?.color || "#6b7280";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Wearables System</h1>
          <p className="text-gray-600">Independent wearable integration using Terra-inspired data models</p>
        </div>
        <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Connect Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Connect Health Data Source</DialogTitle>
              <DialogDescription>
                Connect a player to their wearable device or health app using our Terra-inspired system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleConnect} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="player">Player</Label>
                <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a player" />
                  </SelectTrigger>
                  <SelectContent>
                    {(players as Player[]).map((player: Player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.firstName} {player.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="provider">Health Data Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {TERRA_PROVIDERS.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: provider.color }}
                          />
                          <span>{provider.displayName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedProvider && (
                <div className="grid gap-2">
                  <Label>Data Scopes</Label>
                  <div className="flex flex-wrap gap-2">
                    {TERRA_PROVIDERS.find(p => p.id === selectedProvider)?.scopes.map((scope) => (
                      <Badge key={scope} variant="secondary">{scope}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={connectProviderMutation.isPending}>
                  {connectProviderMutation.isPending ? "Connecting..." : "Connect Provider"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="activity">Activity Data</TabsTrigger>
          <TabsTrigger value="sleep">Sleep Data</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Terra API Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected Users</CardTitle>
                <Wifi className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockTerraData.connectedUsers.length}</div>
                <p className="text-xs text-green-600">Active connections</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
                <Shield className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{TERRA_PROVIDERS.length}</div>
                <p className="text-xs text-gray-600">Available providers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
                <Activity className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockTerraData.recentActivity.length}</div>
                <p className="text-xs text-gray-600">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Requests</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-gray-600">Today</p>
              </CardContent>
            </Card>
          </div>

          {/* Provider Coverage */}
          <Card>
            <CardHeader>
              <CardTitle>Supported Health Data Providers</CardTitle>
              <p className="text-sm text-gray-600">Terra connects to 150+ wearables and health apps</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {TERRA_PROVIDERS.map((provider) => (
                  <div key={provider.id} className="flex flex-col items-center p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center mb-2"
                      style={{ backgroundColor: provider.color + "20" }}
                    >
                      <div 
                        className="w-8 h-8 rounded" 
                        style={{ backgroundColor: provider.color }}
                      />
                    </div>
                    <h3 className="font-medium text-sm">{provider.displayName}</h3>
                    <Badge variant={provider.type === "event_driven" ? "default" : "secondary"} className="text-xs mt-1">
                      {provider.type === "event_driven" ? "Real-time" : "Polled"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockTerraData.connectedUsers.map((user) => {
              const provider = TERRA_PROVIDERS.find(p => p.id === user.provider);
              const player = (players as Player[]).find((p: Player) => p.id === user.playerId);
              
              return (
                <Card key={user.userId} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: provider?.color + "20" }}
                        >
                          <div 
                            className="w-6 h-6 rounded" 
                            style={{ backgroundColor: provider?.color }}
                          />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{provider?.displayName}</CardTitle>
                          <p className="text-sm text-gray-600">
                            {player ? `${player.firstName} ${player.lastName}` : 'Unknown Player'}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>View Data</DropdownMenuItem>
                          <DropdownMenuItem>Sync Now</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Disconnect</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">User ID</span>
                      <span className="text-sm font-mono">{user.userId.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Scopes</span>
                      <div className="flex flex-wrap gap-1">
                        {user.scopes.split(",").slice(0, 2).map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">{scope}</Badge>
                        ))}
                        {user.scopes.split(",").length > 2 && (
                          <Badge variant="outline" className="text-xs">+{user.scopes.split(",").length - 2}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm">Active</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Last Update</span>
                      <span className="text-sm">{new Date(user.lastWebhookUpdate).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity Sessions</CardTitle>
              <p className="text-sm text-gray-600">Latest workout data from connected devices</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTerraData.recentActivity.map((activity, index) => {
                  const user = mockTerraData.connectedUsers.find(u => u.userId === activity.terraUserId);
                  const provider = TERRA_PROVIDERS.find(p => p.id === user?.provider);
                  const player = (players as Player[]).find((p: Player) => p.id === user?.playerId);
                  
                  return (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{activity.name}</h3>
                            <p className="text-sm text-gray-600">
                              {player?.firstName} {player?.lastName} • {provider?.displayName}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">{activity.sport}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Duration</span>
                          <div className="font-medium">
                            {Math.round((new Date(activity.endTime).getTime() - new Date(activity.startTime).getTime()) / 60000)} min
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Calories</span>
                          <div className="font-medium">{activity.caloriesTotal}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Avg HR</span>
                          <div className="font-medium">{activity.avgHeartRate} bpm</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Distance</span>
                          <div className="font-medium">
                            {activity.distanceMeters ? `${(activity.distanceMeters / 1000).toFixed(1)} km` : "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sleep" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sleep Analysis</CardTitle>
              <p className="text-sm text-gray-600">Sleep data from connected devices</p>
            </CardHeader>
            <CardContent>
              {mockTerraData.sleepData.map((sleep, index) => {
                const user = mockTerraData.connectedUsers.find(u => u.userId === sleep.terraUserId);
                const provider = TERRA_PROVIDERS.find(p => p.id === user?.provider);
                const player = (players as Player[]).find((p: Player) => p.id === user?.playerId);
                
                return (
                  <div key={index} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Moon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Sleep Session</h3>
                          <p className="text-sm text-gray-600">
                            {player?.firstName} {player?.lastName} • {provider?.displayName}
                          </p>
                        </div>
                      </div>
                      <Badge variant="default">Score: {sleep.sleepScore}/100</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <div className="text-2xl font-bold">{Math.floor(sleep.sleepDurationMinutes / 60)}h {sleep.sleepDurationMinutes % 60}m</div>
                        <p className="text-sm text-gray-600">Total Sleep</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{sleep.sleepEfficiencyPercentage}%</div>
                        <p className="text-sm text-gray-600">Efficiency</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{sleep.restingHeartRate}</div>
                        <p className="text-sm text-gray-600">Resting HR</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{sleep.heartRateVariability}</div>
                        <p className="text-sm text-gray-600">HRV (ms)</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Sleep Stages</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Deep Sleep</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={(sleep.deepSleepMinutes / sleep.sleepDurationMinutes) * 100} className="w-24" />
                            <span className="text-sm text-gray-600">{sleep.deepSleepMinutes}m</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">REM Sleep</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={(sleep.remSleepMinutes / sleep.sleepDurationMinutes) * 100} className="w-24" />
                            <span className="text-sm text-gray-600">{sleep.remSleepMinutes}m</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Light Sleep</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={(sleep.lightSleepMinutes / sleep.sleepDurationMinutes) * 100} className="w-24" />
                            <span className="text-sm text-gray-600">{sleep.lightSleepMinutes}m</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Awake</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={(sleep.awakeMinutes / sleep.sleepDurationMinutes) * 100} className="w-24" />
                            <span className="text-sm text-gray-600">{sleep.awakeMinutes}m</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Metrics Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {mockTerraData.dailyData.map((daily, index) => {
                  const user = mockTerraData.connectedUsers.find(u => u.userId === daily.terraUserId);
                  const player = (players as Player[]).find((p: Player) => p.id === user?.playerId);
                  
                  return (
                    <div key={index} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{player?.firstName} {player?.lastName}</h3>
                        <span className="text-sm text-gray-600">{daily.calendarDate}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{daily.steps.toLocaleString()}</div>
                          <p className="text-sm text-blue-700">Steps</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{daily.caloriesTotal}</div>
                          <p className="text-sm text-green-700">Calories</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{daily.recoveryScore}%</div>
                          <p className="text-sm text-purple-700">Recovery</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{daily.readinessScore}%</div>
                          <p className="text-sm text-orange-700">Readiness</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Terra API Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="font-medium">API Status</span>
                  </div>
                  <Badge variant="default" className="bg-green-500">Operational</Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Event-driven providers</span>
                    <span className="text-sm font-medium">3/3 online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Polled providers</span>
                    <span className="text-sm font-medium">2/2 online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Webhook delivery</span>
                    <span className="text-sm font-medium">99.9% success</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average latency</span>
                    <span className="text-sm font-medium">120ms</span>
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