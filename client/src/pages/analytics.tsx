import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { Target, Download, Activity, Clock, Zap } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as htmlToImage from 'html-to-image';
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";
import type { Player, PlayerStats, TrainingSession } from "@shared/schema";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function aggregateMonthly(stats: PlayerStats[], sessionById: Map<number, TrainingSession>) {
  const map = new Map<string, { sortKey: string; month: string; goals: number; assists: number; minutes: number; fitnessSum: number; fitnessCount: number }>();
  stats.forEach((stat) => {
    const session = stat.sessionId ? sessionById.get(stat.sessionId) : undefined;
    if (!session) return;
    const date = new Date(session.date);
    const sortKey = format(date, "yyyy-MM");
    const month = format(date, "MMM yyyy");
    const entry = map.get(sortKey) ?? { sortKey, month, goals: 0, assists: 0, minutes: 0, fitnessSum: 0, fitnessCount: 0 };
    entry.goals += stat.goals;
    entry.assists += stat.assists;
    entry.minutes += stat.minutesPlayed;
    if (stat.fitnessScore != null) {
      entry.fitnessSum += stat.fitnessScore;
      entry.fitnessCount += 1;
    }
    map.set(sortKey, entry);
  });
  return Array.from(map.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map((e) => ({
      month: e.month,
      goals: e.goals,
      assists: e.assists,
      minutes: e.minutes,
      fitness: e.fitnessCount > 0 ? Math.round(e.fitnessSum / e.fitnessCount) : 0,
    }));
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AnalyticsPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("all");

  const { t, direction } = useI18n();
  const { organizationName, logoUrl, currentSeason } = useSettings();

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ["/api/teams"],
  });

  const { data: allStats = [], isLoading: statsLoading } = useQuery<PlayerStats[]>({
    queryKey: ["/api/player-stats"],
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<TrainingSession[]>({
    queryKey: ["/api/training-sessions"],
  });

  const isLoading = statsLoading || sessionsLoading;

  const sessionById = new Map(sessions.map((s) => [s.id, s]));

  const statsForView = selectedPlayer === "all"
    ? allStats
    : allStats.filter((s) => s.playerId.toString() === selectedPlayer);

  // KPIs
  const totalGoals = statsForView.reduce((sum, s) => sum + s.goals, 0);
  const totalAssists = statsForView.reduce((sum, s) => sum + s.assists, 0);
  const totalMinutes = statsForView.reduce((sum, s) => sum + s.minutesPlayed, 0);
  const totalYellowCards = statsForView.reduce((sum, s) => sum + s.yellowCards, 0);
  const totalRedCards = statsForView.reduce((sum, s) => sum + s.redCards, 0);
  const avgFitness = average(statsForView.map((s) => s.fitnessScore).filter((v): v is number => v != null));
  const avgTechnical = average(statsForView.map((s) => s.technicalScore).filter((v): v is number => v != null));
  const avgTactical = average(statsForView.map((s) => s.tacticalScore).filter((v): v is number => v != null));
  const sessionsTracked = statsForView.length;

  // Performance data for charts (monthly, real)
  const performanceData = aggregateMonthly(statsForView, sessionById);
  const teamMonthly = aggregateMonthly(allStats, sessionById);

  const seasonStatsData = [
    { name: t("analytics.kpi.goals"), value: totalGoals, fill: COLORS[0] },
    { name: t("analytics.kpi.assists"), value: totalAssists, fill: COLORS[1] },
    { name: t("analytics.kpi.yellowCards"), value: totalYellowCards, fill: COLORS[2] },
    { name: t("analytics.kpi.redCards"), value: totalRedCards, fill: COLORS[3] },
  ];

  // Position analysis (team-wide, real)
  const goalsByPlayer = new Map<number, number>();
  allStats.forEach((s) => {
    goalsByPlayer.set(s.playerId, (goalsByPlayer.get(s.playerId) ?? 0) + s.goals);
  });
  const positionMap = new Map<string, { position: string; players: number; goalsSum: number }>();
  players.forEach((p) => {
    const entry = positionMap.get(p.position) ?? { position: p.position, players: 0, goalsSum: 0 };
    entry.players += 1;
    entry.goalsSum += goalsByPlayer.get(p.id) ?? 0;
    positionMap.set(p.position, entry);
  });
  const positionData = Array.from(positionMap.values()).map((e) => ({
    position: t(`position.${e.position}`),
    players: e.players,
    avgGoals: e.players > 0 ? Math.round((e.goalsSum / e.players) * 10) / 10 : 0,
  }));

  // Skill profile (fitness/technical/tactical, real)
  const skillData = [
    { name: t("analytics.skills.fitness"), value: avgFitness, fullMark: 100 },
    { name: t("analytics.skills.technical"), value: avgTechnical, fullMark: 100 },
    { name: t("analytics.skills.tactical"), value: avgTactical, fullMark: 100 },
  ];

  // Weekly session duration (team-wide, real)
  const dayStats = new Map<string, { sessionCount: number; totalDuration: number }>();
  sessions.forEach((s) => {
    const jsDay = new Date(s.date).getDay(); // 0 = Sunday
    const label = WEEKDAYS[(jsDay + 6) % 7];
    const entry = dayStats.get(label) ?? { sessionCount: 0, totalDuration: 0 };
    entry.sessionCount += 1;
    entry.totalDuration += s.duration;
    dayStats.set(label, entry);
  });
  const weeklyDurationData = WEEKDAYS.map((day) => {
    const entry = dayStats.get(day);
    return {
      day,
      sessionCount: entry?.sessionCount ?? 0,
      avgDuration: entry && entry.sessionCount > 0 ? Math.round(entry.totalDuration / entry.sessionCount) : 0,
    };
  });

  // Session type distribution (team-wide, real)
  const sessionTypeCounts = new Map<string, number>();
  sessions.forEach((s) => {
    sessionTypeCounts.set(s.sessionType, (sessionTypeCounts.get(s.sessionType) ?? 0) + 1);
  });
  const sessionTypeData = Array.from(sessionTypeCounts.entries()).map(([type, count], index) => ({
    name: t(`training.sessionType.${type}`),
    value: count,
    fill: COLORS[index % COLORS.length],
  }));
  const completedSessions = sessions.filter((s) => s.status === 'completed').length;
  const completionRate = sessions.length > 0 ? Math.round((completedSessions / sessions.length) * 100) : 0;

  // Comparison: selected player vs team average per active player
  const comparisonData = selectedPlayer !== "all"
    ? performanceData.map((entry) => {
        const teamEntry = teamMonthly.find((tm) => tm.month === entry.month);
        const denom = players.length || 1;
        return {
          month: entry.month,
          individualGoals: entry.goals,
          teamAvgGoals: teamEntry ? Math.round((teamEntry.goals / denom) * 10) / 10 : 0,
          individualAssists: entry.assists,
          teamAvgAssists: teamEntry ? Math.round((teamEntry.assists / denom) * 10) / 10 : 0,
        };
      })
    : [];

  // Function to capture chart as image
  const captureChartAsImage = async (chartId: string): Promise<string | null> => {
    try {
      const chartElement = document.querySelector(`#${chartId}`);
      if (!chartElement) return null;

      const dataUrl = await htmlToImage.toPng(chartElement as HTMLElement, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true
      });

      return dataUrl;
    } catch (error) {
      console.error('Error capturing chart:', error);
      return null;
    }
  };

  // Export functionality
  const exportToPDF = async () => {
    const pdf = new jsPDF();
    const selectedPlayerName = selectedPlayer === "all" ? "All Players" : players.find(p => p.id.toString() === selectedPlayer)?.firstName + " " + players.find(p => p.id.toString() === selectedPlayer)?.lastName;
    const teamName = teams.length > 0 ? (teams as any)[0]?.name : "First Team";
    const currentDate = new Date().toLocaleDateString();

    // Function to add header to each page
    const addHeader = async (pdf: jsPDF, pageNumber: number = 1) => {
      // Organization logo (if available)
      if (logoUrl && logoUrl.trim() !== '') {
        try {
          // Convert logo to base64 if it's a URL
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = logoUrl;
          await new Promise((resolve, reject) => {
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                const dataURL = canvas.toDataURL('image/png');
                pdf.addImage(dataURL, 'PNG', 15, 10, 25, 25);
                resolve(void 0);
              } catch (e) {
                resolve(void 0); // Continue without logo if error
              }
            };
            img.onerror = () => resolve(void 0);
          });
        } catch (e) {
          // Continue without logo if there's an error
        }
      }

      // Organization name
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(organizationName || 'Football Club', logoUrl ? 50 : 20, 20);

      // Team name
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Team: ${teamName}`, logoUrl ? 50 : 20, 28);

      // Season
      pdf.setFontSize(12);
      pdf.text(`Season: ${currentSeason || '2024-25'}`, logoUrl ? 50 : 20, 35);

      // Report title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Player Performance Report', 20, 50);

      // Player and date info
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Player: ${selectedPlayerName}`, 20, 60);
      pdf.text(`Generated: ${currentDate}`, 20, 68);

      // Page number
      pdf.setFontSize(10);
      pdf.text(`Page ${pageNumber}`, pdf.internal.pageSize.width - 30, 15);
    };

    // Function to add footer to each page
    const addFooter = (pdf: jsPDF) => {
      const pageHeight = pdf.internal.pageSize.height;
      const pageWidth = pdf.internal.pageSize.width;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');

      // Center the footer text
      const line1 = 'Generated by 360 FOS - Football Operating System';
      const line2 = `www.360fos.com | © ${new Date().getFullYear()} 360 FOS`;

      pdf.text(line1, pageWidth / 2, pageHeight - 15, { align: 'center' });
      pdf.text(line2, pageWidth / 2, pageHeight - 8, { align: 'center' });
    };

    // Add first page header
    await addHeader(pdf, 1);

    // Performance KPIs
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Performance Summary', 20, 85);

    // Add Performance Chart
    try {
      const performanceChartImage = await captureChartAsImage('performance-chart');
      if (performanceChartImage) {
        pdf.addImage(performanceChartImage, 'PNG', 20, 95, 170, 60);
      }
    } catch (error) {
      console.log('Performance chart not available for PDF');
    }

    const performanceKPIs = [
      ['Metric', 'Value'],
      ['Goals This Season', totalGoals.toString()],
      ['Assists', totalAssists.toString()],
      ['Average Fitness Score', `${avgFitness}%`],
      ['Minutes Played', totalMinutes.toLocaleString()]
    ];

    autoTable(pdf, {
      head: [performanceKPIs[0]],
      body: performanceKPIs.slice(1),
      startY: 165,
      margin: { left: 20, right: 20 },
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 }
    });

    // Add footer to first page
    addFooter(pdf);

    // Monthly Performance Data
    pdf.addPage();
    await addHeader(pdf, 2);

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Monthly Performance Data', 20, 85);

    // Add Statistics Chart
    try {
      const statisticsChartImage = await captureChartAsImage('statistics-chart');
      if (statisticsChartImage) {
        pdf.addImage(statisticsChartImage, 'PNG', 20, 95, 170, 60);
      }
    } catch (error) {
      console.log('Statistics chart not available for PDF');
    }

    const monthlyData = performanceData.map(item => [
      item.month,
      item.goals.toString(),
      item.assists.toString(),
      item.minutes.toString(),
      item.fitness.toString() + '%'
    ]);

    autoTable(pdf, {
      head: [['Month', 'Goals', 'Assists', 'Minutes Played', 'Fitness Score']],
      body: monthlyData,
      startY: 165,
      margin: { left: 20, right: 20 },
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 }
    });

    addFooter(pdf);

    // Fitness Profile
    pdf.addPage();
    await addHeader(pdf, 3);

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Fitness Profile', 20, 85);

    const fitnessTable = skillData.map(item => [
      item.name,
      item.value.toString() + '%',
      item.value >= 85 ? 'Excellent' : item.value >= 70 ? 'Good' : 'Needs Improvement'
    ]);

    autoTable(pdf, {
      head: [['Attribute', 'Score', 'Assessment']],
      body: fitnessTable,
      startY: 95,
      margin: { left: 20, right: 20 },
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 }
    });

    // Training Summary
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const finalY = (pdf as any).lastAutoTable.finalY + 20;
    pdf.text('Weekly Session Summary', 20, finalY);

    const trainingTable = weeklyDurationData.map(item => [
      item.day,
      item.sessionCount.toString(),
      item.avgDuration.toString() + ' minutes',
    ]);

    autoTable(pdf, {
      head: [['Day', 'Sessions', 'Avg Duration']],
      body: trainingTable,
      startY: finalY + 10,
      margin: { left: 20, right: 20 },
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      styles: { fontSize: 10 }
    });

    addFooter(pdf);

    // Save the PDF
    pdf.save(`${organizationName || 'Club'}_${selectedPlayerName}_Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const selectedPlayerName = selectedPlayer === "all" ? "All_Players" : players.find(p => p.id.toString() === selectedPlayer)?.firstName + "_" + players.find(p => p.id.toString() === selectedPlayer)?.lastName;

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";

    // Add header
    csvContent += "Player Performance Data\n";
    csvContent += `Player: ${selectedPlayerName}\n`;
    csvContent += `Generated: ${new Date().toLocaleDateString()}\n\n`;

    // Monthly Performance Data
    csvContent += "Monthly Performance\n";
    csvContent += "Month,Goals,Assists,Minutes,Fitness\n";
    performanceData.forEach(item => {
      csvContent += `${item.month},${item.goals},${item.assists},${item.minutes},${item.fitness}\n`;
    });

    csvContent += "\nFitness Profile\n";
    csvContent += "Attribute,Score\n";
    skillData.forEach(item => {
      csvContent += `${item.name},${item.value}\n`;
    });

    csvContent += "\nWeekly Session Data\n";
    csvContent += "Day,Sessions,Avg Duration\n";
    weeklyDurationData.forEach(item => {
      csvContent += `${item.day},${item.sessionCount},${item.avgDuration}\n`;
    });

    // Create and download file
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedPlayerName}_Performance_Data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportChartsAsImages = async () => {
    const selectedPlayerName = selectedPlayer === "all" ? "All_Players" : players.find(p => p.id.toString() === selectedPlayer)?.firstName + "_" + players.find(p => p.id.toString() === selectedPlayer)?.lastName;

    try {
      // Get all chart containers
      const chartContainers = document.querySelectorAll('.recharts-wrapper');

      for (let i = 0; i < chartContainers.length; i++) {
        const chartContainer = chartContainers[i] as HTMLElement;
        const chartTitle = chartContainer.closest('.card')?.querySelector('.card-title')?.textContent || `Chart_${i + 1}`;

        // Convert chart to image
        const dataUrl = await htmlToImage.toPng(chartContainer, {
          backgroundColor: '#ffffff',
          width: chartContainer.offsetWidth,
          height: chartContainer.offsetHeight,
        });

        // Create download link
        const link = document.createElement('a');
        link.download = `${selectedPlayerName}_${chartTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();

        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error exporting charts:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t("analytics.title")}</h1>
          <p className="text-gray-600 mt-1">{t("analytics.description")}</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t("analytics.selectPlayer")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("analytics.allPlayers")}</SelectItem>
              {players.map((player: Player) => (
                <SelectItem key={player.id} value={player.id.toString()}>
                  {player.firstName} {player.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                {t("analytics.exportData")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToPDF}>
                <Download className="w-4 h-4 mr-2" />
                {t("analytics.exportPdf")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                {t("analytics.exportCsv")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportChartsAsImages}>
                <Download className="w-4 h-4 mr-2" />
                {t("analytics.exportCharts")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {sessionsTracked === 0 && (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            {t("analytics.empty.noStats")}
          </CardContent>
        </Card>
      )}

      {/* Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("analytics.kpi.goals")}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {translateWithParams(t, "analytics.kpi.goalsCaption", { count: String(sessionsTracked) })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("analytics.kpi.assists")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssists}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {translateWithParams(t, "analytics.kpi.assistsCaption", { count: String(sessionsTracked) })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("analytics.kpi.fitness")}</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgFitness}%</div>
            <Progress value={avgFitness} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {t("analytics.kpi.fitnessCaption")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("analytics.kpi.minutes")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMinutes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("analytics.kpi.minutesCaption")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Dashboard */}
      <Tabs defaultValue="performance" className="w-full" dir={direction}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">{t("analytics.tabs.performance")}</TabsTrigger>
          <TabsTrigger value="fitness">{t("analytics.tabs.fitness")}</TabsTrigger>
          <TabsTrigger value="position">{t("analytics.tabs.position")}</TabsTrigger>
          <TabsTrigger value="training">{t("analytics.tabs.training")}</TabsTrigger>
          <TabsTrigger value="comparison">{t("analytics.tabs.comparison")}</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Goals & Assists Trend */}
            <Card>
              <CardHeader>
                <CardTitle>{t("analytics.charts.goalsAssistsTrend")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div id="performance-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="goals"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      animationBegin={0}
                      animationDuration={1500}
                    />
                    <Area
                      type="monotone"
                      dataKey="assists"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      animationBegin={500}
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Season Statistics Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{t("analytics.charts.seasonStats")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div id="statistics-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={seasonStatsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={1000}
                      >
                        {seasonStatsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Minutes Played & Fitness Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t("analytics.charts.monthlyTrends")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="minutes"
                    stroke="#ffc658"
                    strokeWidth={3}
                    name="Minutes Played"
                    animationBegin={0}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="fitness"
                    stroke="#ff7300"
                    strokeWidth={3}
                    name="Fitness Score"
                    animationBegin={800}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fitness" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fitness / Technical / Tactical Radar */}
            <Card>
              <CardHeader>
                <CardTitle>{t("analytics.charts.fitnessProfile")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div id="fitness-chart">
                  <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={skillData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Current"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      animationBegin={0}
                      animationDuration={1500}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Session Duration */}
            <Card>
              <CardHeader>
                <CardTitle>{t("analytics.charts.weeklyTraining")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={weeklyDurationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="sessionCount"
                      fill="#8884d8"
                      animationBegin={0}
                      animationDuration={1200}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="avgDuration"
                      fill="#82ca9d"
                      animationBegin={600}
                      animationDuration={1200}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="position" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("analytics.charts.positionAnalysis")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={positionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="position" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="players"
                    fill="#8884d8"
                    animationBegin={0}
                    animationDuration={1500}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="avgGoals"
                    fill="#82ca9d"
                    animationBegin={500}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>{t("analytics.charts.sessionTypeDistribution")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sessionTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1000}
                    >
                      {sessionTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Session Completion */}
            <Card>
              <CardHeader>
                <CardTitle>{t("analytics.charts.sessionCompletion")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">{completionRate}%</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {translateWithParams(t, "analytics.charts.sessionCompletionCaption", {
                      completed: String(completedSessions),
                      total: String(sessions.length),
                    })}
                  </p>
                </div>
                <Progress value={completionRate} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("analytics.charts.teamVsIndividual")}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPlayer === "all" ? (
                <div className="py-12 text-center text-muted-foreground">
                  {t("analytics.comparison.selectPlayerPrompt")}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="individualGoals"
                      stroke="#8884d8"
                      strokeWidth={3}
                      name={t("analytics.comparison.individualGoals")}
                      animationBegin={0}
                      animationDuration={1500}
                    />
                    <Line
                      type="monotone"
                      dataKey="teamAvgGoals"
                      stroke="#8884d8"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name={t("analytics.comparison.teamAvgGoals")}
                      animationBegin={300}
                      animationDuration={1500}
                    />
                    <Line
                      type="monotone"
                      dataKey="individualAssists"
                      stroke="#82ca9d"
                      strokeWidth={3}
                      name={t("analytics.comparison.individualAssists")}
                      animationBegin={600}
                      animationDuration={1500}
                    />
                    <Line
                      type="monotone"
                      dataKey="teamAvgAssists"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name={t("analytics.comparison.teamAvgAssists")}
                      animationBegin={900}
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
