import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/contexts/SettingsContext";
import { BarChart3, TrendingUp, Users, Target, Calendar, Download, Plus, Activity, Award, Clock, Zap } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as htmlToImage from 'html-to-image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  RadialBarChart,
  RadialBar,
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
import type { AnalyticsReport, Player } from "@shared/schema";

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("monthly");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("all");

  const { organizationName, logoUrl, currentSeason } = useSettings();

  const { data: reports = [], isLoading } = useQuery<AnalyticsReport[]>({
    queryKey: ["/api/analytics"],
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ["/api/teams"],
  });

  // Performance data for charts
  const performanceData = [
    { month: 'Jan', goals: 4, assists: 2, minutes: 720, fitness: 85 },
    { month: 'Feb', goals: 6, assists: 4, minutes: 810, fitness: 88 },
    { month: 'Mar', goals: 3, assists: 5, minutes: 690, fitness: 82 },
    { month: 'Apr', goals: 8, assists: 3, minutes: 900, fitness: 91 },
    { month: 'May', goals: 5, assists: 6, minutes: 780, fitness: 89 },
    { month: 'Jun', goals: 7, assists: 2, minutes: 840, fitness: 87 },
  ];

  const playerStats = [
    { name: 'Goals', value: 35, fill: '#8884d8' },
    { name: 'Assists', value: 22, fill: '#82ca9d' },
    { name: 'Yellow Cards', value: 8, fill: '#ffc658' },
    { name: 'Red Cards', value: 2, fill: '#ff7c7c' },
  ];

  const positionData = [
    { position: 'Forward', players: 8, avgGoals: 12 },
    { position: 'Midfielder', players: 10, avgGoals: 6 },
    { position: 'Defender', players: 8, avgGoals: 2 },
    { position: 'Goalkeeper', players: 3, avgGoals: 0 },
  ];

  const fitnessData = [
    { name: 'Stamina', value: 85, fullMark: 100 },
    { name: 'Speed', value: 78, fullMark: 100 },
    { name: 'Strength', value: 82, fullMark: 100 },
    { name: 'Agility', value: 90, fullMark: 100 },
    { name: 'Balance', value: 87, fullMark: 100 },
    { name: 'Coordination', value: 84, fullMark: 100 },
  ];

  const weeklyTrainingData = [
    { day: 'Mon', intensity: 75, duration: 90 },
    { day: 'Tue', intensity: 60, duration: 75 },
    { day: 'Wed', intensity: 85, duration: 105 },
    { day: 'Thu', intensity: 45, duration: 60 },
    { day: 'Fri', intensity: 80, duration: 90 },
    { day: 'Sat', intensity: 90, duration: 120 },
    { day: 'Sun', intensity: 0, duration: 0 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Generated by ProCoach - Professional Football Team Management System', 20, pageHeight - 15);
      pdf.text('www.procoach.app', 20, pageHeight - 8);
      pdf.text(`© ${new Date().getFullYear()} ProCoach`, pdf.internal.pageSize.width - 40, pageHeight - 8);
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
        pdf.addImage(performanceChartImage, 'PNG', 20, 95, 170, 80);
      }
    } catch (error) {
      console.log('Performance chart not available for PDF');
    }
    
    const performanceKPIs = [
      ['Metric', 'Value', 'Change from Last Season'],
      ['Goals This Season', '35', '+12%'],
      ['Assists', '22', '+5%'],
      ['Average Fitness Score', '87%', 'Excellent'],
      ['Minutes Played', '4,830', 'High involvement']
    ];
    
    autoTable(pdf, {
      head: [performanceKPIs[0]],
      body: performanceKPIs.slice(1),
      startY: 95,
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
        pdf.addImage(statisticsChartImage, 'PNG', 20, 95, 170, 80);
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
      startY: 95,
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
    
    const fitnessTable = fitnessData.map(item => [
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
    pdf.text('Weekly Training Summary', 20, finalY);
    
    const trainingTable = weeklyTrainingData.map(item => [
      item.day,
      item.intensity.toString() + '%',
      item.duration.toString() + ' minutes',
      item.intensity === 0 ? 'Rest Day' : item.intensity >= 80 ? 'High' : item.intensity >= 60 ? 'Medium' : 'Low'
    ]);
    
    autoTable(pdf, {
      head: [['Day', 'Intensity', 'Duration', 'Load Level']],
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
    fitnessData.forEach(item => {
      csvContent += `${item.name},${item.value}\n`;
    });
    
    csvContent += "\nWeekly Training Data\n";
    csvContent += "Day,Intensity,Duration\n";
    weeklyTrainingData.forEach(item => {
      csvContent += `${item.day},${item.intensity},${item.duration}\n`;
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

  const getTypeColor = (type: string) => {
    const colors = {
      performance: "bg-blue-100 text-blue-800",
      tactical: "bg-purple-100 text-purple-800",
      fitness: "bg-green-100 text-green-800",
      injury: "bg-red-100 text-red-800",
      attendance: "bg-orange-100 text-orange-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      performance: BarChart3,
      tactical: Target,
      fitness: TrendingUp,
      injury: Users,
      attendance: Calendar,
    };
    return icons[type as keyof typeof icons] || BarChart3;
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
          <h1 className="text-3xl font-bold text-gray-900">Player Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">Interactive analytics and performance insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Player" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Players</SelectItem>
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
                Export Data
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportChartsAsImages}>
                <Download className="w-4 h-4 mr-2" />
                Export Charts as Images
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Performance KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals This Season</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">35</div>
            <Progress value={78} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              +12% from last season
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assists</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">22</div>
            <Progress value={65} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              +5% from last season
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fitness Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <Progress value={87} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Excellent condition
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Minutes Played</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4,830</div>
            <Progress value={92} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              High involvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Dashboard */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="fitness">Fitness</TabsTrigger>
          <TabsTrigger value="position">Position Analysis</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Goals & Assists Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Goals & Assists Trend</CardTitle>
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

            {/* Player Statistics Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Season Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div id="statistics-chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={playerStats}
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
                        {playerStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
              <CardTitle>Monthly Performance Trends</CardTitle>
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
            {/* Fitness Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Fitness Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div id="fitness-chart">
                  <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={fitnessData}>
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

            {/* Training Intensity */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Training Intensity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={weeklyTrainingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="intensity" 
                      fill="#8884d8"
                      animationBegin={0}
                      animationDuration={1200}
                    />
                    <Bar 
                      dataKey="duration" 
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
              <CardTitle>Position-Based Performance Analysis</CardTitle>
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
            {/* Training Load Radial Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Training Load Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart innerRadius="10%" outerRadius="80%" data={[
                    { name: 'High Intensity', value: 30, fill: '#8884d8' },
                    { name: 'Medium Intensity', value: 50, fill: '#82ca9d' },
                    { name: 'Low Intensity', value: 20, fill: '#ffc658' },
                  ]}>
                    <RadialBar 
                      dataKey="value" 
                      cornerRadius={10} 
                      fill="#8884d8"
                      animationBegin={0}
                      animationDuration={1500}
                    />
                    <Tooltip />
                    <Legend />
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recovery Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Recovery Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sleep Quality</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Heart Rate Variability</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Stress Level</span>
                    <span>35%</span>
                  </div>
                  <Progress value={35} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Readiness Score</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team vs Individual Performance</CardTitle>
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
                    dataKey="goals" 
                    stroke="#8884d8" 
                    strokeWidth={3}
                    name="Individual Goals"
                    animationBegin={0}
                    animationDuration={1500}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="assists" 
                    stroke="#82ca9d" 
                    strokeWidth={3}
                    name="Individual Assists"
                    animationBegin={500}
                    animationDuration={1500}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fitness" 
                    stroke="#ffc658" 
                    strokeWidth={3}
                    name="Fitness Score"
                    animationBegin={1000}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}