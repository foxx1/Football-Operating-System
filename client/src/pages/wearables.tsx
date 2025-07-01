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
import { Activity, Smartphone, Watch, Plus, MoreVertical, Wifi, WifiOff, BarChart3 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PerformanceDashboard from "@/components/performance-dashboard";
import type { WearableDevice, Player } from "@shared/schema";

export default function WearablesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [selectedPlayerForDashboard, setSelectedPlayerForDashboard] = useState<number | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [batteryLevel, setBatteryLevel] = useState("");
  const [status, setStatus] = useState("");
  const { toast } = useToast();

  // Fetch players for the dropdown
  const { data: players = [] } = useQuery({
    queryKey: ["/api/players"],
  });

  // Fetch wearable devices
  const { data: devices = [] } = useQuery({
    queryKey: ["/api/wearable-devices"],
  });

  const createDeviceMutation = useMutation({
    mutationFn: async (newDevice: any) => {
      const response = await fetch("/api/wearable-devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDevice),
      });
      if (!response.ok) throw new Error("Failed to create device");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wearable-devices"] });
      toast({ title: "Device registered successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Error creating device", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const resetForm = () => {
    setSelectedPlayerId("");
    setDeviceName("");
    setDeviceType("");
    setDeviceModel("");
    setSerialNumber("");
    setBatteryLevel("");
    setStatus("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createDeviceMutation.mutate({
      playerId: parseInt(selectedPlayerId),
      deviceName,
      deviceType,
      deviceModel,
      serialNumber,
      batteryLevel: parseInt(batteryLevel),
      status,
      lastSync: new Date().toISOString(),
    });
  };

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "smartwatch":
      case "fitness_tracker":
        return Watch;
      case "smartphone":
        return Smartphone;
      default:
        return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500";
      case "charging":
        return "bg-yellow-500";
      case "inactive":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Wearable Devices & Performance</h1>
          <p className="text-gray-600">Manage player wearable devices and track performance metrics</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Register New Device</DialogTitle>
              <DialogDescription>
                Add a new wearable device for performance tracking
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
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
                <Label htmlFor="deviceName">Device Name</Label>
                <Input
                  id="deviceName"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="e.g., Apple Watch Series 8"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deviceType">Device Type</Label>
                <Select value={deviceType} onValueChange={setDeviceType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select device type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smartwatch">Smartwatch</SelectItem>
                    <SelectItem value="fitness_tracker">Fitness Tracker</SelectItem>
                    <SelectItem value="heart_rate_monitor">Heart Rate Monitor</SelectItem>
                    <SelectItem value="gps_tracker">GPS Tracker</SelectItem>
                    <SelectItem value="smartphone">Smartphone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deviceModel">Model</Label>
                <Input
                  id="deviceModel"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  placeholder="e.g., A2473"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g., ABC123XYZ"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="batteryLevel">Battery Level (%)</Label>
                <Input
                  id="batteryLevel"
                  type="number"
                  min="0"
                  max="100"
                  value={batteryLevel}
                  onChange={(e) => setBatteryLevel(e.target.value)}
                  placeholder="85"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="charging">Charging</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createDeviceMutation.isPending}>
                  {createDeviceMutation.isPending ? "Registering..." : "Register Device"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="devices">Device Management</TabsTrigger>
          <TabsTrigger value="performance">Performance Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="devices" className="space-y-6">
          {/* Device Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(devices as WearableDevice[]).map((device: WearableDevice) => {
              const DeviceIcon = getDeviceIcon(device.deviceType);
              const player = (players as Player[]).find((p: Player) => p.id === device.playerId);
              
              return (
                <Card key={device.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DeviceIcon className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg">{device.deviceName}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>Edit Device</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedPlayerForDashboard(device.playerId)}>
                            View Performance
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Remove Device</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-sm text-gray-600">
                      {player ? `${player.firstName} ${player.lastName}` : 'Unknown Player'}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Type</span>
                      <Badge variant="secondary">{device.deviceType}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Model</span>
                      <span className="text-sm">{device.deviceModel || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Battery</span>
                      <span className="text-sm">{device.batteryLevel}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status)}`} />
                        <span className="text-sm capitalize">{device.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Connection</span>
                      <div className="flex items-center space-x-1">
                        {device.status === 'active' ? (
                          <Wifi className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {device.status === 'active' ? 'Connected' : 'Disconnected'}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500">
                        Last sync: {device.lastSync ? new Date(device.lastSync).toLocaleString() : 'Never'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {devices.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No devices registered</h3>
                  <p className="text-gray-500 mb-4">Start by adding your first wearable device</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Device
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Performance Analytics</h2>
            <Select value={selectedPlayerForDashboard?.toString() || ""} onValueChange={(value) => setSelectedPlayerForDashboard(parseInt(value))}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select player to view performance" />
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
          
          {selectedPlayerForDashboard ? (
            <PerformanceDashboard playerId={selectedPlayerForDashboard} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Performance Dashboard</h3>
                  <p className="text-gray-500 mb-4">Select a player to view their performance metrics and analytics</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}