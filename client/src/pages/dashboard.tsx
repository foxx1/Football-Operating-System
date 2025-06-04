import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Shield,
  Calendar,
  TrendingUp,
  Plus,
  UserPlus,
  Swords,
  FileText,
  Clock,
  Target,
  Activity,
  Star
} from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Players",
      value: stats?.totalPlayers || 0,
      change: "+2 this month",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Active Teams",
      value: stats?.activeTeams || 0,
      subtitle: "First Team, Reserves, Youth",
      icon: Shield,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      title: "This Week's Sessions",
      value: stats?.weeklySessions || 0,
      change: "Next in 2 hours",
      icon: Calendar,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/20"
    },
    {
      title: "Attendance Rate",
      value: `${stats?.attendanceRate || 0}%`,
      change: "+5% vs last month",
      icon: TrendingUp,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20"
    }
  ];

  const quickActions = [
    {
      title: "Schedule Training",
      description: "Create new training session",
      icon: Plus,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Add Player",
      description: "Register new player",
      icon: UserPlus,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      title: "Tactics Board",
      description: "Plan team formations",
      icon: Swords,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/20"
    },
    {
      title: "Generate Report",
      description: "Export session data",
      icon: FileText,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20"
    }
  ];

  const upcomingSessions = [
    {
      title: "Technical Skills Training",
      details: "First Team • 90 minutes • Main Pitch",
      time: "Today, 4:00 PM",
      attendees: "18/22 confirmed",
      icon: Activity,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Fitness & Conditioning",
      details: "Reserve Team • 60 minutes • Gym",
      time: "Tomorrow, 10:00 AM",
      attendees: "15/18 confirmed",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      title: "Tactical Preparation",
      details: "First Team • 120 minutes • Meeting Room + Pitch",
      time: "Wed, 3:00 PM",
      attendees: "22/22 confirmed",
      icon: Swords,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/20"
    }
  ];

  const recentActivity = [
    {
      playerName: "Alex Johnson",
      action: "completed fitness assessment with excellent results",
      timestamp: "2 hours ago",
      status: "Completed",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face"
    },
    {
      playerName: "Michael Roberts",
      action: "updated availability for next week's matches",
      timestamp: "4 hours ago",
      status: "Updated",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face"
    },
    {
      playerName: "David Chen",
      action: "submitted injury report - minor ankle sprain",
      timestamp: "6 hours ago",
      status: "Injury Report",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&h=120&fit=crop&crop=face"
    }
  ];

  const topPerformers = [
    {
      name: "Sarah Wilson",
      position: "Midfielder",
      rating: 9.2,
      avatar: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "James Martinez",
      position: "Forward",
      rating: 8.8,
      avatar: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const tasks = [
    {
      title: "Update medical certificates",
      description: "5 players need renewed certificates",
      dueDate: "Due: Tomorrow",
      color: "bg-amber-100 dark:bg-amber-900/20 border-amber-200",
      dotColor: "bg-amber-500"
    },
    {
      title: "Match preparation meeting",
      description: "Schedule tactics review with assistant coaches",
      dueDate: "Due: Friday",
      color: "bg-primary/10 border-primary/20",
      dotColor: "bg-primary"
    },
    {
      title: "Equipment inventory",
      description: "Review and order new training equipment",
      dueDate: "Due: Next week",
      color: "bg-green-100 dark:bg-green-900/20 border-green-200",
      dotColor: "bg-green-500"
    }
  ];

  return (
    <div className="p-6">
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="stats-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    {stat.change && (
                      <p className="text-sm text-green-600 mt-1">
                        <TrendingUp className="inline w-3 h-3 mr-1" />
                        {stat.change}
                      </p>
                    )}
                    {stat.subtitle && (
                      <p className="text-sm text-muted-foreground mt-1">{stat.subtitle}</p>
                    )}
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`${stat.color} text-xl`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Recent Activity & Training Schedule */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upcoming Training Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upcoming Training Sessions</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingSessions.map((session, index) => {
                  const Icon = session.icon;
                  return (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <div className={`w-12 h-12 ${session.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={session.color} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{session.title}</h4>
                        <p className="text-sm text-muted-foreground">{session.details}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{session.time}</p>
                        <p className="text-xs text-muted-foreground">{session.attendees}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Player Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Player Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={activity.avatar} />
                      <AvatarFallback>{activity.playerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{activity.playerName}</span>{' '}
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                    <Badge variant={activity.status === 'Completed' ? 'default' : activity.status === 'Updated' ? 'secondary' : 'destructive'}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Team Stats */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start p-3 h-auto hover:bg-muted"
                    >
                      <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center mr-3`}>
                        <Icon className={action.color} />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">{action.title}</p>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Team Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Training Attendance</span>
                    <span className="font-medium text-foreground">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Fitness Level</span>
                    <span className="font-medium text-foreground">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Tactical Understanding</span>
                    <span className="font-medium text-foreground">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>

                {/* Top Performers */}
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-foreground mb-3">Top Performers This Week</h4>
                  <div className="space-y-3">
                    {topPerformers.map((player, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback>{player.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{player.name}</p>
                          <p className="text-xs text-muted-foreground">{player.position}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="text-amber-400 w-3 h-3 fill-current" />
                          <span className="text-xs font-medium text-foreground">{player.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasks & Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tasks & Notifications</CardTitle>
                <Badge variant="destructive" className="text-xs">
                  3 pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task, index) => (
                  <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg border ${task.color}`}>
                    <div className={`w-2 h-2 ${task.dotColor} rounded-full mt-2`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                      <p className="text-xs text-primary mt-1">{task.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
