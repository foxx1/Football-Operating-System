import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, Filter, Calendar, TrendingUp, Users, Target, Activity, BarChart3 } from "lucide-react";
import type { TrainingSession, Player, Team } from "@shared/schema";
import { format } from "date-fns";

export default function Reports() {
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("month");

  const { data: sessions } = useQuery({
    queryKey: ["/api/training-sessions"],
  });

  const { data: players } = useQuery({
    queryKey: ["/api/players"],
  });

  const { data: teams } = useQuery({
    queryKey: ["/api/teams"],
  });

  // Filter sessions based on selections
  const filteredSessions = sessions?.filter((session: TrainingSession) => {
    const sessionDate = new Date(session.date);
    const now = new Date();
    
    let dateFilter = true;
    if (dateRange === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = sessionDate >= weekAgo;
    } else if (dateRange === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = sessionDate >= monthAgo;
    } else if (dateRange === "quarter") {
      const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      dateFilter = sessionDate >= quarterAgo;
    }
    
    return dateFilter;
  }) || [];

  // Calculate statistics
  const stats = {
    totalSessions: filteredSessions.length,
    completedSessions: filteredSessions.filter((s: TrainingSession) => s.status === 'completed').length,
    averageDuration: filteredSessions.reduce((sum: number, s: TrainingSession) => sum + s.duration, 0) / filteredSessions.length || 0,
    sessionTypes: {
      technical: filteredSessions.filter((s: TrainingSession) => s.sessionType === 'technical').length,
      fitness: filteredSessions.filter((s: TrainingSession) => s.sessionType === 'fitness').length,
      tactical: filteredSessions.filter((s: TrainingSession) => s.sessionType === 'tactical').length,
      match_prep: filteredSessions.filter((s: TrainingSession) => s.sessionType === 'match_prep').length,
    }
  };

  const completionRate = stats.totalSessions > 0 ? (stats.completedSessions / stats.totalSessions) * 100 : 0;

  // Mock attendance data for demo (in real app, this would come from session attendance)
  const attendanceStats = {
    averageAttendance: 87,
    topAttenders: players?.slice(0, 5).map((player: Player, index) => ({
      ...player,
      attendanceRate: 95 - index * 3
    })) || [],
    attendanceBySession: filteredSessions.slice(0, 10).map((session: TrainingSession) => ({
      ...session,
      attendanceRate: 80 + Math.random() * 20
    }))
  };

  const exportReport = (type: string) => {
    // In a real app, this would generate and download a PDF/Excel report
    alert(`Exporting ${type} report...`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Training session reports and team performance insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => exportReport('comprehensive')}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams?.map((team: Team) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="training">Training Sessions</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                    <p className="text-3xl font-bold text-foreground">{stats.totalSessions}</p>
                    <p className="text-sm text-success mt-1">
                      <TrendingUp className="inline w-3 h-3 mr-1" />
                      {stats.completedSessions} completed
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                    <p className="text-3xl font-bold text-foreground">{completionRate.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground mt-1">Training sessions</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                    <p className="text-3xl font-bold text-foreground">{stats.averageDuration.toFixed(0)}m</p>
                    <p className="text-sm text-muted-foreground mt-1">Per session</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                    <p className="text-3xl font-bold text-foreground">{attendanceStats.averageAttendance}%</p>
                    <p className="text-sm text-success mt-1">
                      <TrendingUp className="inline w-3 h-3 mr-1" />
                      Average rate
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Type Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Type Distribution</CardTitle>
                <CardDescription>Breakdown of training session types</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                      Technical ({stats.sessionTypes.technical})
                    </span>
                    <span>{stats.totalSessions > 0 ? ((stats.sessionTypes.technical / stats.totalSessions) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <Progress value={stats.totalSessions > 0 ? (stats.sessionTypes.technical / stats.totalSessions) * 100 : 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                      Fitness ({stats.sessionTypes.fitness})
                    </span>
                    <span>{stats.totalSessions > 0 ? ((stats.sessionTypes.fitness / stats.totalSessions) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <Progress value={stats.totalSessions > 0 ? (stats.sessionTypes.fitness / stats.totalSessions) * 100 : 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                      Tactical ({stats.sessionTypes.tactical})
                    </span>
                    <span>{stats.totalSessions > 0 ? ((stats.sessionTypes.tactical / stats.totalSessions) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <Progress value={stats.totalSessions > 0 ? (stats.sessionTypes.tactical / stats.totalSessions) * 100 : 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                      Match Prep ({stats.sessionTypes.match_prep})
                    </span>
                    <span>{stats.totalSessions > 0 ? ((stats.sessionTypes.match_prep / stats.totalSessions) * 100).toFixed(0) : 0}%</span>
                  </div>
                  <Progress value={stats.totalSessions > 0 ? (stats.sessionTypes.match_prep / stats.totalSessions) * 100 : 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Attendance</CardTitle>
                <CardDescription>Players with highest attendance rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attendanceStats.topAttenders.map((player: any, index) => (
                    <div key={player.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{player.firstName} {player.lastName}</p>
                        <p className="text-xs text-muted-foreground">{player.position}</p>
                      </div>
                      <Badge variant="outline" className="text-success">
                        {player.attendanceRate}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Training Session Details</CardTitle>
                  <CardDescription>Detailed breakdown of recent training sessions</CardDescription>
                </div>
                <Button variant="outline" onClick={() => exportReport('training')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSessions.slice(0, 10).map((session: TrainingSession) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{session.title}</h4>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          <span>{format(new Date(session.date), 'MMM d, yyyy')}</span>
                          <span>{session.duration} minutes</span>
                          <span>{session.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={session.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'}>
                          {session.status}
                        </Badge>
                        <Badge variant="outline">
                          {session.sessionType.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    {session.description && (
                      <p className="text-sm text-muted-foreground mt-2">{session.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Attendance Analysis</CardTitle>
                  <CardDescription>Player attendance rates and patterns</CardDescription>
                </div>
                <Button variant="outline" onClick={() => exportReport('attendance')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4">Recent Session Attendance</h4>
                  <div className="space-y-3">
                    {attendanceStats.attendanceBySession.map((session: any) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{session.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(session.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-32">
                            <Progress value={session.attendanceRate} className="h-2" />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">
                            {session.attendanceRate.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Team and individual performance indicators</CardDescription>
                </div>
                <Button variant="outline" onClick={() => exportReport('performance')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Performance Analytics</h3>
                <p className="text-muted-foreground">
                  Detailed performance metrics will be available once player statistics are recorded during training sessions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
