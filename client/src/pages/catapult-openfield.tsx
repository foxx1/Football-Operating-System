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
import catapultLogo from "@assets/catapult-logo_1751360180223.png";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  shirtNumber: number | null;
}

export default function CatapultOpenFieldPage() {
  const { t, isRtl } = useI18n();
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api.catapultsports.com");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");

  const { data: players = [] } = useQuery({
    queryKey: ['/api/players'],
  });

  const sessionTypeLabel = (type: string) =>
    type === "Training" ? t("catapult.sessionType.training") : type === "Match" ? t("catapult.sessionType.match") : type;

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
    { metric: t("catapult.athletes.distance"), value: 8420, unit: "m", change: "+2.3%" },
    { metric: t("catapult.athletes.topSpeed"), value: 34.2, unit: "km/h", change: "+1.8%" },
    { metric: t("catapult.performance.sprints"), value: 12, unit: "count", change: "-5.2%" },
    { metric: t("catapult.athletes.playerLoad"), value: 485, unit: "AU", change: "+3.1%" }
  ];

  const handleConnectAPI = async () => {
    await apiRequest("POST", "/api/catapult/connect", {
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
          <div className={cn("flex items-center mb-2", isRtl ? "space-x-reverse space-x-3" : "space-x-3")}>
            <img
              src={catapultLogo}
              alt="Catapult Logo"
              className="h-8 w-auto"
            />
            <h1 className="text-3xl font-bold">{t("catapult.title")}</h1>
          </div>
          <p className="text-muted-foreground">
            {t("catapult.description")}
          </p>
        </div>
        <div className={cn("flex", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
          <Button variant="outline" size="sm">
            <RefreshCw className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />
            {t("catapult.syncData")}
          </Button>
          <Button variant="outline" size="sm">
            <Download className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />
            {t("catapult.exportData")}
          </Button>
          <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Link className={cn("h-4 w-4", isRtl ? "ml-2" : "mr-2")} />
                {t("catapult.connectApi")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{t("catapult.dialog.title")}</DialogTitle>
                <DialogDescription>
                  {t("catapult.dialog.description")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">{t("catapult.dialog.apiKey")}</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder={t("catapult.dialog.apiKeyPlaceholder")}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">{t("catapult.dialog.baseUrl")}</Label>
                  <Input
                    id="baseUrl"
                    placeholder="https://api.catapultsports.com"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="player">{t("catapult.dialog.selectPlayer")}</Label>
                  <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("catapult.dialog.choosePlayer")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(players as Player[]).map((player: Player) => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.firstName} {player.lastName} - {t(`position.${player.position}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className={cn("flex justify-end pt-4", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                  <Button
                    variant="outline"
                    onClick={() => setIsConnectDialogOpen(false)}
                  >
                    {t("catapult.dialog.cancel")}
                  </Button>
                  <Button onClick={handleConnectAPI}>
                    {t("catapult.dialog.connect")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4" dir={isRtl ? "rtl" : "ltr"}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">{t("catapult.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="athletes">{t("catapult.tabs.athletes")}</TabsTrigger>
          <TabsTrigger value="sessions">{t("catapult.tabs.sessions")}</TabsTrigger>
          <TabsTrigger value="performance">{t("catapult.tabs.performance")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("catapult.tabs.analytics")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Integration Status Banner */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-4" : "space-x-4")}>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Wifi className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">{t("catapult.overview.bannerTitle")}</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {t("catapult.overview.bannerDescription")}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <div className={cn("w-2 h-2 bg-green-500 rounded-full", isRtl ? "ml-2" : "mr-2")}></div>
                  {t("catapult.overview.apiReady")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("catapult.tabs.athletes")}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockCatapultData.athletes.length}</div>
                <p className="text-xs text-muted-foreground">
                  {translateWithParams(t, "catapult.overview.activeConnections", {
                    count: String(mockCatapultData.athletes.filter(a => a.isConnected).length),
                  })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("catapult.overview.lastSync")}</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{t("catapult.overview.lastSyncValue")}</div>
                <p className="text-xs text-muted-foreground">
                  {t("catapult.overview.lastSyncCaption")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("catapult.overview.avgPlayerLoad")}</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">470</div>
                <p className="text-xs text-muted-foreground">
                  {t("catapult.overview.avgLoadCaption")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("catapult.overview.dataQuality")}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98%</div>
                <p className="text-xs text-muted-foreground">
                  {t("catapult.overview.dataQualityCaption")}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("catapult.overview.loadTrends")}</CardTitle>
                <CardDescription>{t("catapult.overview.loadTrendsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={loadTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" reversed={isRtl} />
                    <YAxis orientation={isRtl ? "right" : "left"} />
                    <Tooltip />
                    <Line type="monotone" dataKey="load" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="teamAvg" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("catapult.overview.recentSessions")}</CardTitle>
                <CardDescription>{t("catapult.overview.recentSessionsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCatapultData.sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{sessionTypeLabel(session.type)}</div>
                        <div className="text-sm text-muted-foreground">{session.date}</div>
                      </div>
                      <div className="text-end">
                        <div className="font-medium">{session.avgLoad} AU</div>
                        <div className="text-sm text-muted-foreground">
                          {translateWithParams(t, "catapult.overview.playersCount", { count: String(session.participants) })}
                        </div>
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
                      {athlete.isConnected ? t("catapult.athletes.connected") : t("catapult.athletes.disconnected")}
                    </Badge>
                  </div>
                  <CardDescription>
                    {translateWithParams(t, "catapult.athletes.lastSync", { date: new Date(athlete.lastSync).toLocaleString() })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">{t("catapult.athletes.distance")}</div>
                      <div className="text-2xl font-bold">{athlete.gpsData.totalDistance}m</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">{t("catapult.athletes.topSpeed")}</div>
                      <div className="text-2xl font-bold">{athlete.gpsData.topSpeed} km/h</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">{t("catapult.athletes.playerLoad")}</div>
                      <div className="text-2xl font-bold">{athlete.loadData.playerLoad} AU</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">{t("catapult.athletes.maxHr")}</div>
                      <div className="text-2xl font-bold">{athlete.heartRate.maxHR} bpm</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">{t("catapult.athletes.hrZones")}</div>
                    <div className="space-y-2">
                      {Object.entries(athlete.heartRate.hrZones).map(([zone, percentage]) => (
                        <div key={zone} className="flex items-center justify-between">
                          <span className="text-sm">
                            {translateWithParams(t, "catapult.athletes.zone", { number: zone.replace('zone', '') })}
                          </span>
                          <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
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
              <CardTitle>{t("catapult.sessions.title")}</CardTitle>
              <CardDescription>{t("catapult.sessions.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCatapultData.sessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">
                          {translateWithParams(t, "catapult.sessions.sessionLabel", { type: sessionTypeLabel(session.type) })}
                        </h3>
                        <p className="text-sm text-muted-foreground">{session.date}</p>
                      </div>
                      <Badge variant="outline">
                        {translateWithParams(t, "catapult.sessions.minutes", { count: String(session.duration) })}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">{t("catapult.sessions.participants")}</div>
                        <div className="text-lg font-bold">{session.participants}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">{t("catapult.sessions.avgLoad")}</div>
                        <div className="text-lg font-bold">{session.avgLoad} AU</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">{t("catapult.sessions.duration")}</div>
                        <div className="text-lg font-bold">
                          {translateWithParams(t, "catapult.sessions.minutes", { count: String(session.duration) })}
                        </div>
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
                  <p className={`text-xs font-medium ${metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {translateWithParams(t, "catapult.performance.changeCaption", { change: metric.change })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("catapult.performance.breakdownTitle")}</CardTitle>
              <CardDescription>{t("catapult.performance.breakdownDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">{t("catapult.performance.gpsMetrics")}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">{t("catapult.performance.totalDistance")}</span>
                      <span className="font-medium">8,420 m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">{t("catapult.performance.highIntensityRunning")}</span>
                      <span className="font-medium">1,240 m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">{t("catapult.performance.sprintCount")}</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">{t("catapult.performance.accelerations")}</span>
                      <span className="font-medium">45</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">{t("catapult.performance.loadMetrics")}</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">{t("catapult.athletes.playerLoad")}</span>
                      <span className="font-medium">485 AU</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">{t("catapult.performance.explosiveEfforts")}</span>
                      <span className="font-medium">23</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">{t("catapult.performance.metabolicPower")}</span>
                      <span className="font-medium">18.5 W/kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">{t("catapult.performance.loadVsTarget")}</span>
                      <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
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
                <CardTitle>{t("catapult.analytics.insightsTitle")}</CardTitle>
                <CardDescription>{t("catapult.analytics.insightsDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{t("catapult.analytics.loadManagementLabel")}</strong> {t("catapult.analytics.loadManagementText")}
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Heart className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{t("catapult.analytics.cardioLabel")}</strong> {t("catapult.analytics.cardioText")}
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{t("catapult.analytics.sprintLabel")}</strong> {t("catapult.analytics.sprintText")}
                    </AlertDescription>
                  </Alert>

                  <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 dark:text-orange-200">
                      <strong>{t("catapult.analytics.injuryLabel")}</strong> {t("catapult.analytics.injuryText")}
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("catapult.analytics.benchmarkTitle")}</CardTitle>
                <CardDescription>{t("catapult.analytics.benchmarkDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{t("catapult.analytics.distanceVsTeam")}</span>
                      <span className="text-sm font-bold text-green-600">+12%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{t("catapult.analytics.loadVsPosition")}</span>
                      <span className="text-sm font-bold text-green-600">+8%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{t("catapult.analytics.sprintVsLeague")}</span>
                      <span className="text-sm font-bold text-red-600">-5%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">{t("catapult.analytics.accelVsPeers")}</span>
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
