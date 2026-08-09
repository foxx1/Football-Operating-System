import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileDown, FileText, Settings, Users, Calendar, BarChart3, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PDFReportGenerator, type ReportBranding, type ReportOptions } from "@/lib/pdf-generator";

interface PDFReportGeneratorProps {
  onClose?: () => void;
}

export default function PDFReportGeneratorComponent({ onClose }: PDFReportGeneratorProps) {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<string>("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportSubtitle, setReportSubtitle] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedMatch, setSelectedMatch] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [includeStats, setIncludeStats] = useState(true);
  const [includeAttendance, setIncludeAttendance] = useState(true);
  const [customNotes, setCustomNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch data for dropdowns
  const { data: teams = [] } = useQuery<any[]>({ queryKey: ["/api/teams"] });
  const { data: matches = [] } = useQuery<any[]>({ queryKey: ["/api/matches"] });
  const { data: sessions = [] } = useQuery<any[]>({ queryKey: ["/api/training-sessions"] });
  const { data: players = [] } = useQuery<any[]>({ queryKey: ["/api/players"] });
  const { data: settings = [] } = useQuery<any[]>({ queryKey: ["/api/settings"] });

  // Get settings values
  const getSettingValue = (category: string, key: string, defaultValue: string = "") => {
    const setting = settings.find((s: any) => 
      s.category === category && s.settingKey === key
    );
    return setting?.settingValue || defaultValue;
  };

  // Get branding from settings
  const getBranding = (): ReportBranding => ({
    organizationName: getSettingValue("general", "org_name", "360FOS"),
    primaryColor: "#3b82f6",
    secondaryColor: "#e5e7eb",
    season: getSettingValue("general", "current_season", "2024-25"),
    timezone: getSettingValue("general", "timezone", "UTC"),
    currency: getSettingValue("general", "currency", "USD"),
  });

  const reportTypes = [
    { value: "match", label: "Match Report", icon: Trophy },
    { value: "training", label: "Training Session Report", icon: Calendar },
    { value: "player", label: "Player Performance Report", icon: Users },
    { value: "team", label: "Team Analytics Report", icon: BarChart3 },
    { value: "season", label: "Season Summary Report", icon: FileText },
  ];

  const generateReport = async () => {
    if (!reportType || !reportTitle) {
      toast({
        title: "Missing Information",
        description: "Please select a report type and enter a title",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const branding = getBranding();
      const options: ReportOptions = {
        title: reportTitle,
        subtitle: reportSubtitle,
        branding,
        orientation: reportType === 'team' || reportType === 'season' ? 'landscape' : 'portrait',
      };

      const generator = new PDFReportGenerator(options);

      // Add custom notes if provided
      if (customNotes) {
        generator.addSection("Report Notes");
        generator.addText(customNotes);
      }

      switch (reportType) {
        case "match":
          await generateMatchReport(generator);
          break;
        case "training":
          await generateTrainingReport(generator);
          break;
        case "player":
          await generatePlayerReport(generator);
          break;
        case "team":
          await generateTeamReport(generator);
          break;
        case "season":
          await generateSeasonReport(generator);
          break;
      }

      const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
      generator.save(filename);

      toast({
        title: "Report Generated",
        description: `${reportTitle} has been downloaded successfully`,
      });

      if (onClose) onClose();
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating the report",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMatchReport = async (generator: PDFReportGenerator) => {
    const match = matches.find((m: any) => m.id.toString() === selectedMatch);
    if (!match) {
      generator.addText("No match selected for this report.");
      return;
    }

    generator.addMatchDetails(match);

    if (includeStats) {
      generator.addSection("Team Statistics");
      generator.addText("Match statistics and performance metrics would be displayed here.");
      
      // Sample player stats table
      const samplePlayerStats = players.slice(0, 5).map((player: any) => ({
        ...player,
        matches: Math.floor(Math.random() * 10) + 1,
        goals: Math.floor(Math.random() * 5),
        assists: Math.floor(Math.random() * 3),
        rating: Math.random() * 5 + 5,
      }));
      
      generator.addPlayerStatsTable(samplePlayerStats);
    }
  };

  const generateTrainingReport = async (generator: PDFReportGenerator) => {
    const session = sessions.find((s: any) => s.id.toString() === selectedSession);
    if (!session) {
      generator.addText("No training session selected for this report.");
      return;
    }

    // Sample attendance data
    const attendance = players.slice(0, 8).map((player: any) => ({
      player,
      status: Math.random() > 0.2 ? "Present" : "Absent",
      performanceRating: Math.floor(Math.random() * 5) + 6,
      notes: Math.random() > 0.7 ? "Excellent performance" : "",
    }));

    generator.addTrainingSessionSummary(session, attendance);
  };

  const generatePlayerReport = async (generator: PDFReportGenerator) => {
    const player = players.find((p: any) => p.id.toString() === selectedPlayer);
    if (!player) {
      generator.addText("No player selected for this report.");
      return;
    }

    generator.addSection("Player Profile");
    generator.addText(`Name: ${player.firstName} ${player.lastName}`, 12);
    generator.addText(`Position: ${player.position}`, 11);
    generator.addText(`Jersey Number: ${player.jerseyNumber}`, 11);
    generator.addText(`Date of Birth: ${player.dateOfBirth}`, 11);

    if (includeStats) {
      generator.addSection("Performance Statistics");
      const stats = [
        ["Matches Played", "15"],
        ["Goals", "8"],
        ["Assists", "5"],
        ["Yellow Cards", "2"],
        ["Red Cards", "0"],
        ["Average Rating", "7.8"],
      ];
      generator.addTable(["Metric", "Value"], stats);
    }

    if (includeAttendance) {
      generator.addSection("Training Attendance");
      generator.addText("Training attendance: 92% (23/25 sessions)");
    }
  };

  const generateTeamReport = async (generator: PDFReportGenerator) => {
    const team = teams.find((t: any) => t.id.toString() === selectedTeam);
    if (!team) {
      generator.addText("No team selected for this report.");
      return;
    }

    generator.addSection("Team Overview");
    generator.addText(`Team: ${team.name}`, 12);
    generator.addText(`Category: ${team.category}`, 11);

    // Sample analytics
    const analytics = {
      totalMatches: 20,
      wins: 12,
      draws: 4,
      losses: 4,
      winRate: 0.6,
      goalsScored: 35,
      goalsConceded: 18,
      avgAttendance: 0.89,
    };

    generator.addAnalyticsSummary(analytics);

    if (includeStats && players.length > 0) {
      generator.addSection("Squad Statistics");
      const teamPlayers = players.slice(0, 10).map((player: any) => ({
        ...player,
        matches: Math.floor(Math.random() * 15) + 5,
        goals: Math.floor(Math.random() * 8),
        assists: Math.floor(Math.random() * 5),
        rating: Math.random() * 2 + 6,
      }));
      
      generator.addPlayerStatsTable(teamPlayers);
    }
  };

  const generateSeasonReport = async (generator: PDFReportGenerator) => {
    generator.addSection("Season Overview");
    generator.addText(`Season: ${getBranding().season}`, 12);
    generator.addText("Comprehensive season summary and analysis.");

    // Season statistics
    const seasonStats = {
      totalMatches: 28,
      wins: 18,
      draws: 6,
      losses: 4,
      winRate: 0.64,
      goalsScored: 65,
      goalsConceded: 28,
      avgAttendance: 0.87,
    };

    generator.addAnalyticsSummary(seasonStats);

    generator.addSection("Key Achievements");
    generator.addText("• League Champions 2024-25");
    generator.addText("• Cup Semi-finalists");
    generator.addText("• 15-match unbeaten streak");
    generator.addText("• Best defensive record in the league");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PDF Report Generator</h2>
          <p className="text-gray-600">Generate professional reports with custom branding</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Enter report title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Report Subtitle (Optional)</Label>
              <Input
                id="subtitle"
                value={reportSubtitle}
                onChange={(e) => setReportSubtitle(e.target.value)}
                placeholder="Enter report subtitle"
              />
            </div>

            {/* Conditional selectors based on report type */}
            {reportType === "match" && (
              <div className="space-y-2">
                <Label>Select Match</Label>
                <Select value={selectedMatch} onValueChange={setSelectedMatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a match" />
                  </SelectTrigger>
                  <SelectContent>
                    {matches.map((match: any) => (
                      <SelectItem key={match.id} value={match.id.toString()}>
                        {match.homeTeam} vs {match.awayTeam} - {new Date(match.date).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {reportType === "training" && (
              <div className="space-y-2">
                <Label>Select Training Session</Label>
                <Select value={selectedSession} onValueChange={setSelectedSession}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a training session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session: any) => (
                      <SelectItem key={session.id} value={session.id.toString()}>
                        {session.title} - {new Date(session.date).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {reportType === "player" && (
              <div className="space-y-2">
                <Label>Select Player</Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player: any) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.firstName} {player.lastName} - #{player.jerseyNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(reportType === "team" || reportType === "season") && (
              <div className="space-y-2">
                <Label>Select Team</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team: any) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name} ({team.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Report Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Include Statistics</Label>
                <p className="text-sm text-gray-600">Add performance metrics and data tables</p>
              </div>
              <Switch
                checked={includeStats}
                onCheckedChange={setIncludeStats}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Include Attendance</Label>
                <p className="text-sm text-gray-600">Show training attendance records</p>
              </div>
              <Switch
                checked={includeAttendance}
                onCheckedChange={setIncludeAttendance}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="notes">Custom Notes</Label>
              <Textarea
                id="notes"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Add any additional notes or comments for the report..."
                rows={4}
              />
            </div>

            <div className="pt-4">
              <Button
                onClick={generateReport}
                disabled={isGenerating || !reportType || !reportTitle}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  "Generating Report..."
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Generate PDF Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branding Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Report Branding Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Label className="text-xs text-gray-500">Organization</Label>
              <p className="font-medium">{getBranding().organizationName}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Season</Label>
              <p className="font-medium">{getBranding().season}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Currency</Label>
              <p className="font-medium">{getBranding().currency}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Timezone</Label>
              <p className="font-medium">{getBranding().timezone}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
