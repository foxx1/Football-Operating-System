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
import type { Player, WearableDevice, WearableData } from "@shared/schema";

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

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function numericValue(entry: WearableData): number | null {
  const parsed = Number(entry.value);
  return Number.isFinite(parsed) ? parsed : null;
}

const ACTIVITY_TYPES = ["steps", "distance", "calories"];
const SLEEP_TYPES = ["sleep"];

export default function WearablesPage() {
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);

  // Fetch players, connected devices, and any synced data
  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: wearableDevices = [] } = useQuery<WearableDevice[]>({
    queryKey: ["/api/wearable-devices"],
  });

  const { data: wearableData = [] } = useQuery<WearableData[]>({
    queryKey: ["/api/wearable-data"],
  });

  const connectDeviceMutation = useMutation({
    mutationFn: async (data: { playerId: number; deviceType: string; deviceModel: string; deviceId: string }) => {
      return await apiRequest("POST", "/api/wearable-devices", data);
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
      deviceType: provider.id,
      deviceModel: provider.displayName,
      deviceId: `${provider.id}-${selectedPlayerId}-${Date.now()}`,
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
                      className={`cursor-pointer transition-colors ${selectedProvider === provider.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
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
                <div className="text-2xl font-bold">{wearableDevices.length}</div>
                <p className="text-xs text-muted-foreground">
                  {wearableDevices.filter(d => d.isActive).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Daily Steps</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {(() => {
                  const avg = average(wearableData.filter(d => d.dataType === "steps").map(numericValue).filter((v): v is number => v !== null));
                  return avg !== null
                    ? <div className="text-2xl font-bold">{Math.round(avg).toLocaleString()}</div>
                    : <div className="text-sm text-muted-foreground">No data synced yet</div>;
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Heart Rate</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {(() => {
                  const avg = average(wearableData.filter(d => d.dataType === "heart_rate").map(numericValue).filter((v): v is number => v !== null));
                  return avg !== null
                    ? <div className="text-2xl font-bold">{Math.round(avg)} bpm</div>
                    : <div className="text-sm text-muted-foreground">No data synced yet</div>;
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sleep Records</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{wearableData.filter(d => SLEEP_TYPES.includes(d.dataType)).length}</div>
                <p className="text-xs text-muted-foreground">Synced entries</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          {wearableDevices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No wearable devices connected yet. Use "Connect Device" to link a player's device.
              </CardContent>
            </Card>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wearableDevices.map((device) => {
              const player = players.find((p: Player) => p.id === device.playerId);
              const provider = WEARABLE_PROVIDERS.find(p => p.id === device.deviceType);

              return (
                <Card key={device.id}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <img
                        src={provider?.logoUrl || ""}
                        alt={provider?.name || "Device"}
                        className="w-10 h-10 rounded"
                      />
                      <div>
                        <CardTitle className="text-lg">{device.deviceModel}</CardTitle>
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
                      <span className="text-sm text-muted-foreground">Last Sync</span>
                      <span className="text-sm">
                        {device.lastSyncAt ? new Date(device.lastSyncAt).toLocaleString() : "Never"}
                      </span>
                    </div>

                    {provider && (
                      <div>
                        <span className="text-sm text-muted-foreground">Features</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {provider.features.map((feature: string) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          {(() => {
            const records = wearableData.filter(d => ACTIVITY_TYPES.includes(d.dataType));
            if (records.length === 0) {
              return (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No activity data synced yet.
                  </CardContent>
                </Card>
              );
            }
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {records
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((record) => {
                    const device = wearableDevices.find(d => d.id === record.deviceId);
                    const player = players.find(p => p.id === record.playerId);
                    const provider = WEARABLE_PROVIDERS.find(p => p.id === device?.deviceType);

                    return (
                      <Card key={record.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-lg capitalize">{record.dataType.replace('_', ' ')}</CardTitle>
                              <CardDescription className="flex items-center space-x-2">
                                {provider && (
                                  <img src={provider.logoUrl} alt={provider.name} className="w-4 h-4" />
                                )}
                                <span>{player ? `${player.firstName} ${player.lastName}` : 'Unknown Player'}</span>
                              </CardDescription>
                            </div>
                            <Badge variant="outline">{new Date(record.timestamp).toLocaleDateString()}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Value</span>
                            <span className="text-sm font-medium">
                              {record.value}{record.unit ? ` ${record.unit}` : ""}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="sleep" className="space-y-4">
          {(() => {
            const records = wearableData.filter(d => SLEEP_TYPES.includes(d.dataType));
            if (records.length === 0) {
              return (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No sleep data synced yet.
                  </CardContent>
                </Card>
              );
            }
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {records
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((record) => {
                    const player = players.find(p => p.id === record.playerId);
                    return (
                      <Card key={record.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Sleep</CardTitle>
                            <Badge variant="outline">{new Date(record.timestamp).toLocaleDateString()}</Badge>
                          </div>
                          <CardDescription>
                            {player ? `${player.firstName} ${player.lastName}` : 'Unknown Player'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Value</span>
                            <span className="text-sm font-medium">
                              {record.value}{record.unit ? ` ${record.unit}` : ""}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {(() => {
            const records = wearableData.filter(d => !ACTIVITY_TYPES.includes(d.dataType) && !SLEEP_TYPES.includes(d.dataType));
            if (records.length === 0) {
              return (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No additional metrics synced yet.
                  </CardContent>
                </Card>
              );
            }
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {records
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((record) => {
                    const player = players.find(p => p.id === record.playerId);
                    return (
                      <Card key={record.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg capitalize">{record.dataType.replace('_', ' ')}</CardTitle>
                            <Badge variant="outline">{new Date(record.timestamp).toLocaleDateString()}</Badge>
                          </div>
                          <CardDescription>
                            {player ? `${player.firstName} ${player.lastName}` : 'Unknown Player'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Value</span>
                            <span className="text-sm font-medium">
                              {record.value}{record.unit ? ` ${record.unit}` : ""}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}