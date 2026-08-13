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
import { Users, Wifi, Link, Download, RefreshCw, Satellite } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import catapultLogo from "@assets/catapult-logo_1751360180223.png";
import { useI18n } from "@/contexts/I18nContext";
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
                <Badge variant="outline" className="bg-muted text-muted-foreground">
                  <div className={cn("w-2 h-2 bg-muted-foreground rounded-full", isRtl ? "ml-2" : "mr-2")}></div>
                  {t("catapult.overview.notConnected")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
              <Satellite className="h-10 w-10 text-muted-foreground/60" />
              <p className="max-w-md">{t("catapult.emptyState.noOverviewData")}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="athletes" className="space-y-4">
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
              <Users className="h-10 w-10 text-muted-foreground/60" />
              <p className="max-w-md">{t("catapult.emptyState.noAthletes")}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("catapult.sessions.title")}</CardTitle>
              <CardDescription>{t("catapult.sessions.description")}</CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t("catapult.emptyState.noSessions")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("catapult.performance.breakdownTitle")}</CardTitle>
              <CardDescription>{t("catapult.performance.breakdownDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t("catapult.emptyState.noPerformance")}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("catapult.analytics.insightsTitle")}</CardTitle>
              <CardDescription>{t("catapult.analytics.insightsDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t("catapult.emptyState.noAnalytics")}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
