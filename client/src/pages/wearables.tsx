import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Activity, Heart, Zap, Users, TrendingUp, Watch, Smartphone } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import type { Player } from "@shared/schema";

// Custom wearable device provider configurations
const WEARABLE_PROVIDERS = [
  {
    id: "fitbit",
    name: "Fitbit",
    displayName: "Fitbit",
    category: "fitness_tracker",
    connectType: "bluetooth",
    logoUrl: "https://logo.clearbit.com/fitbit.com",
    features: ["steps", "heart_rate", "sleep", "calories"],
    color: "#00b0b9"
  },
  {
    id: "garmin",
    name: "Garmin",
    displayName: "Garmin Watch",
    category: "sports_watch",
    connectType: "wifi",
    logoUrl: "https://logo.clearbit.com/garmin.com",
    features: ["gps", "heart_rate", "performance", "training"],
    color: "#007cc3"
  },
  {
    id: "oura",
    name: "Oura",
    displayName: "Oura Ring",
    category: "health_ring",
    connectType: "bluetooth",
    logoUrl: "https://logo.clearbit.com/ouraring.com",
    features: ["sleep", "recovery", "readiness", "temperature"],
    color: "#ff6900"
  },
  {
    id: "apple_watch",
    name: "Apple Watch",
    displayName: "Apple Watch",
    category: "smart_watch",
    connectType: "wifi",
    logoUrl: "https://logo.clearbit.com/apple.com",
    features: ["health", "fitness", "ecg", "blood_oxygen"],
    color: "#007aff"
  },
  {
    id: "polar",
    name: "Polar",
    displayName: "Polar Watch",
    category: "training_watch",
    connectType: "bluetooth",
    logoUrl: "https://logo.clearbit.com/polar.com",
    features: ["training", "recovery", "running", "cycling"],
    color: "#ed1c24"
  }
];

// Mock wearable device data for demonstration
const mockWearableData = {
  connectedDevices: [
    {
      deviceId: "device_001",
      playerId: 1,
      provider: "fitbit",
      lastSync: "2025-01-01T10:30:00Z",
      features: "steps,heart_rate,sleep,calories",
      isActive: true,
      batteryLevel: 85
    },
    {
      deviceId: "device_002", 
      playerId: 2,
      provider: "garmin",
      lastSync: "2025-01-01T09:15:00Z",
      features: "gps,heart_rate,performance,training",
      isActive: true,
      batteryLevel: 92
    }
  ],
  recentActivity: [
    {
      deviceId: "device_001",
      name: "Morning Run",
      type: "running",
      startTime: "2025-01-01T07:00:00Z",
      endTime: "2025-01-01T07:45:00Z",
      calories: 425,
      distance: 6800,
      avgHeartRate: 155,
      maxHeartRate: 178,
      steps: 8940
    },
    {
      deviceId: "device_002",
      name: "Strength Training",
      type: "strength_training",
      startTime: "2025-01-01T18:00:00Z",
      endTime: "2025-01-01T19:00:00Z",
      calories: 320,
      avgHeartRate: 135,
      maxHeartRate: 165
    }
  ],
  sleepData: [
    {
      deviceId: "device_001",
      bedtime: "2024-12-31T23:15:00Z",
      wakeTime: "2025-01-01T07:00:00Z",
      duration: 420,
      efficiency: 87.5,
      deepSleep: 120,
      remSleep: 95,
      lightSleep: 205
    }
  ],
  dailyMetrics: [
    {
      deviceId: "device_001",
      date: "2025-01-01",
      steps: 12450,
      calories: 2340,
      activeMinutes: 85,
      restingHeartRate: 62,
      hrv: 45.2,
      vo2Max: 52.1
    }
  ]
};

export default function WearablesPage() {
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);

  // Fetch players and wearable devices
  const { data: players = [] } = useQuery({
    queryKey: ["/api/players"],
  });

  const { data: wearableDevices = [] } = useQuery({
    queryKey: ["/api/wearable-devices"],
  });

  const connectDeviceMutation = useMutation({
    mutationFn: async (data: { playerId: number, provider: string, features: string }) => {
      return await apiRequest("/api/wearable-devices", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wearable-devices"] });
      setIsConnectDialogOpen(false);
      setSelectedPlayerId("");
      setSelectedProvider("");
    },
  });

  const handleConnectProvider = (provider: any) => {
    if (!selectedPlayerId) {
      alert("Please select a player first");
      return;
    }

    connectDeviceMutation.mutate({
      playerId: parseInt(selectedPlayerId),
      provider: provider.id,
      features: provider.features.join(","),
    });
  };

  const getProviderLogo = (providerId: string) => {
    const provider = WEARABLE_PROVIDERS.find(p => p.id === providerId);
    return provider?.logoUrl || "";
  };

  const getProviderColor = (providerId: string) => {
    const provider = WEARABLE_PROVIDERS.find(p => p.id === providerId);
    return provider?.color || "#6b7280";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Wearable Devices</h1>
          <p className="text-muted-foreground">
            Connect and manage player wearable devices for comprehensive health and performance tracking
          </p>
        </div>
        <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Watch className="mr-2 h-4 w-4" />
              Connect Device
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Connect Wearable Device</DialogTitle>
              <DialogDescription>
                Select a player and device type to connect their wearable device
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
                <Label>Device Type</Label>
                <div className="grid grid-cols-1 gap-3 mt-2">
                  {WEARABLE_PROVIDERS.map((provider) => (
                    <Card 
                      key={provider.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedProvider === provider.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedProvider(provider.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={provider.logoUrl} 
                            alt={provider.name}
                            className="w-8 h-8 rounded"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{provider.displayName}</h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {provider.category.replace('_', ' ')}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {provider.features.slice(0, 2).map((feature: string) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {feature.replace('_', ' ')}
                              </Badge>
                            ))}
                            {provider.features.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{provider.features.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => {
                  const provider = WEARABLE_PROVIDERS.find(p => p.id === selectedProvider);
                  if (provider) handleConnectProvider(provider);
                }}
                disabled={!selectedPlayerId || !selectedProvider || connectDeviceMutation.isPending}
                className="w-full"
              >
                {connectDeviceMutation.isPending ? "Connecting..." : "Connect Device"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Connected Devices</TabsTrigger>
          <TabsTrigger value="activity">Activity Data</TabsTrigger>
          <TabsTrigger value="sleep">Sleep Analysis</TabsTrigger>
          <TabsTrigger value="metrics">Daily Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected Devices</CardTitle>
                <Watch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockWearableData.connectedDevices.length}</div>
                <p className="text-xs text-muted-foreground">
                  {mockWearableData.connectedDevices.filter(d => d.isActive).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Steps</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12,450</div>
                <p className="text-xs text-muted-foreground">+12% from yesterday</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Heart Rate</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">155 bpm</div>
                <p className="text-xs text-muted-foreground">During activity</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sleep Quality</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87.5%</div>
                <p className="text-xs text-muted-foreground">Sleep efficiency</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockWearableData.connectedDevices.map((device, index) => {
              const player = (players as Player[]).find((p: Player) => p.id === device.playerId);
              const provider = WEARABLE_PROVIDERS.find(p => p.id === device.provider);
              
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <img 
                        src={provider?.logoUrl || ""} 
                        alt={provider?.name || "Device"}
                        className="w-10 h-10 rounded"
                      />
                      <div>
                        <CardTitle className="text-lg">{provider?.displayName}</CardTitle>
                        <CardDescription>
                          {player ? `${player.firstName} ${player.lastName}` : 'Unknown Player'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant={device.isActive ? "default" : "secondary"}>
                        {device.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Battery</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={device.batteryLevel} className="w-16" />
                        <span className="text-sm">{device.batteryLevel}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Last Sync</span>
                      <span className="text-sm">{new Date(device.lastSync).toLocaleString()}</span>
                    </div>
                    
                    <div>
                      <span className="text-sm text-muted-foreground">Features</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {device.features.split(',').map((feature: string) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockWearableData.recentActivity.map((activity, index) => {
              const device = mockWearableData.connectedDevices.find(u => u.deviceId === activity.deviceId);
              const provider = WEARABLE_PROVIDERS.find(p => p.id === device?.provider);
              
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{activity.name}</CardTitle>
                        <CardDescription className="flex items-center space-x-2">
                          <img 
                            src={provider?.logoUrl || ""} 
                            alt={provider?.name || "Device"}
                            className="w-4 h-4"
                          />
                          <span>{provider?.displayName}</span>
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {activity.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Duration</span>
                          <span className="text-sm font-medium">
                            {Math.round((new Date(activity.endTime).getTime() - new Date(activity.startTime).getTime()) / 60000)} min
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Calories</span>
                          <span className="text-sm font-medium">{activity.calories}</span>
                        </div>
                        {activity.distance && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Distance</span>
                            <span className="text-sm font-medium">{(activity.distance / 1000).toFixed(1)} km</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Avg HR</span>
                          <span className="text-sm font-medium">{activity.avgHeartRate} bpm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Max HR</span>
                          <span className="text-sm font-medium">{activity.maxHeartRate} bpm</span>
                        </div>
                        {activity.steps && (
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Steps</span>
                            <span className="text-sm font-medium">{activity.steps.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="sleep" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockWearableData.sleepData.map((sleep, index) => {
              const device = mockWearableData.connectedDevices.find(u => u.deviceId === sleep.deviceId);
              const provider = WEARABLE_PROVIDERS.find(p => p.id === device?.provider);
              
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Sleep Analysis</CardTitle>
                        <CardDescription className="flex items-center space-x-2">
                          <img 
                            src={provider?.logoUrl || ""} 
                            alt={provider?.name || "Device"}
                            className="w-4 h-4"
                          />
                          <span>{provider?.displayName}</span>
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {sleep.efficiency}% Efficiency
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Bedtime</span>
                            <span className="text-sm font-medium">
                              {new Date(sleep.bedtime).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Wake Time</span>
                            <span className="text-sm font-medium">
                              {new Date(sleep.wakeTime).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Duration</span>
                            <span className="text-sm font-medium">{Math.floor(sleep.duration / 60)}h {sleep.duration % 60}m</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Deep Sleep</span>
                            <span className="text-sm font-medium">{sleep.deepSleep}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">REM Sleep</span>
                            <span className="text-sm font-medium">{sleep.remSleep}m</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Light Sleep</span>
                            <span className="text-sm font-medium">{sleep.lightSleep}m</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockWearableData.dailyMetrics.map((metrics, index) => {
              const device = mockWearableData.connectedDevices.find(u => u.deviceId === metrics.deviceId);
              const provider = WEARABLE_PROVIDERS.find(p => p.id === device?.provider);
              
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Daily Health Metrics</CardTitle>
                        <CardDescription className="flex items-center space-x-2">
                          <img 
                            src={provider?.logoUrl || ""} 
                            alt={provider?.name || "Device"}
                            className="w-4 h-4"
                          />
                          <span>{new Date(metrics.date).toLocaleDateString()}</span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Steps</span>
                          <span className="text-sm font-medium">{metrics.steps.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Calories</span>
                          <span className="text-sm font-medium">{metrics.calories}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Active Minutes</span>
                          <span className="text-sm font-medium">{metrics.activeMinutes}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Resting HR</span>
                          <span className="text-sm font-medium">{metrics.restingHeartRate} bpm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">HRV</span>
                          <span className="text-sm font-medium">{metrics.hrv} ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">VO2 Max</span>
                          <span className="text-sm font-medium">{metrics.vo2Max}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}