import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, Clock, MapPin, Users, Edit, Trash2, Target, Activity, Eye, Heart, Shield, Star, Dumbbell } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import TrainingForm from "@/components/training-form";
import type { TrainingSession } from "@shared/schema";
import { format } from "date-fns";

export default function Training() {
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [viewingSession, setViewingSession] = useState<TrainingSession | null>(null);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["/api/training-sessions"],
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: number) => 
      apiRequest("DELETE", `/api/training-sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-sessions"] });
    },
  });

  const handleDeleteSession = (sessionId: number) => {
    if (confirm("Are you sure you want to delete this training session?")) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  const getSessionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'technical':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'fitness':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'tactical':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'match_prep':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getSessionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'technical':
        return Activity;
      case 'fitness':
        return Target;
      case 'tactical':
        return Users;
      case 'match_prep':
        return Calendar;
      default:
        return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatSessionType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTime = (time: string) => {
    return format(new Date(`2000-01-01T${time}`), 'h:mm a');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Group sessions by date
  const groupedSessions = sessions?.reduce((acc: any, session: TrainingSession) => {
    const date = session.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {}) || {};

  const sortedDates = Object.keys(groupedSessions).sort();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training Schedule</h1>
          <p className="text-muted-foreground">Plan and manage training sessions for your teams</p>
        </div>
        <Dialog open={isAddSessionOpen} onOpenChange={setIsAddSessionOpen}>
          <DialogTrigger asChild>
            <Button className="action-button bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto" aria-describedby="training-dialog-description">
            <DialogHeader>
              <DialogTitle>Schedule Training Session</DialogTitle>
              <div id="training-dialog-description" className="text-sm text-muted-foreground">
                Create a comprehensive training session with structured sections and image support
              </div>
            </DialogHeader>
            <TrainingForm onSuccess={() => setIsAddSessionOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sessions?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {sessions?.filter((s: TrainingSession) => s.sessionType === 'technical')?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Technical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {sessions?.filter((s: TrainingSession) => s.sessionType === 'fitness')?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Fitness</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {sessions?.filter((s: TrainingSession) => s.sessionType === 'tactical')?.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Tactical</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Sessions */}
      <div className="space-y-8">
        {sortedDates.map((date) => (
          <div key={date}>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              {format(new Date(date), 'EEEE, MMMM d, yyyy')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedSessions[date].map((session: TrainingSession) => {
                const Icon = getSessionIcon(session.sessionType);
                return (
                  <Card key={session.id} className="stats-card hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getSessionTypeColor(session.sessionType).replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{session.title}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getSessionTypeColor(session.sessionType)}>
                                {formatSessionType(session.sessionType)}
                              </Badge>
                              <Badge className={getStatusColor(session.status)}>
                                {session.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setViewingSession(session)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingSession(session)}
                            title="Edit Session"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteSession(session.id)}
                            title="Delete Session"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {session.description && (
                        <p className="text-sm text-muted-foreground mb-4">{session.description}</p>
                      )}
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{formatTime(session.startTime)} • {session.duration} minutes</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{session.location}</span>
                        </div>
                        {session.maxParticipants && (
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>Max {session.maxParticipants} players</span>
                          </div>
                        )}
                      </div>

                      {session.notes && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">{session.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {sessions?.length === 0 && (
        <Card className="text-center p-12">
          <CardContent>
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Training Sessions Scheduled</h3>
            <p className="text-muted-foreground mb-4">
              Get started by scheduling your first training session.
            </p>
            <Button onClick={() => setIsAddSessionOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Schedule First Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* View Session Dialog */}
      <Dialog open={!!viewingSession} onOpenChange={() => setViewingSession(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Training Session Details
            </DialogTitle>
          </DialogHeader>
          
          {viewingSession && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Title</label>
                      <p className="text-lg font-medium">{viewingSession.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Session Type</label>
                      <Badge className={getSessionTypeColor(viewingSession.sessionType)}>
                        {formatSessionType(viewingSession.sessionType)}
                      </Badge>
                    </div>
                  </div>
                  
                  {viewingSession.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <p className="mt-1">{viewingSession.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(viewingSession.date), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatTime(viewingSession.startTime)} • {viewingSession.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{viewingSession.location}</span>
                    </div>
                  </div>
                  
                  {viewingSession.maxParticipants && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Maximum {viewingSession.maxParticipants} participants</span>
                    </div>
                  )}
                  
                  {/* Duration Breakdown */}
                  {(viewingSession.fitnessDuration || viewingSession.mainPartDuration || viewingSession.goalkeepingDuration || viewingSession.specificWorkDuration) && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        Duration Breakdown
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {viewingSession.fitnessDuration && (
                          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                            <Heart className="h-3 w-3 text-red-600" />
                            <span>Fitness: {viewingSession.fitnessDuration}min</span>
                          </div>
                        )}
                        {viewingSession.mainPartDuration && (
                          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <Activity className="h-3 w-3 text-blue-600" />
                            <span>Main: {viewingSession.mainPartDuration}min</span>
                          </div>
                        )}
                        {viewingSession.goalkeepingDuration && (
                          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                            <Shield className="h-3 w-3 text-green-600" />
                            <span>GK: {viewingSession.goalkeepingDuration}min</span>
                          </div>
                        )}
                        {viewingSession.specificWorkDuration && (
                          <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                            <Star className="h-3 w-3 text-purple-600" />
                            <span>Specific: {viewingSession.specificWorkDuration}min</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Training Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Training Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Show all filled training sections */}
                    {(viewingSession.fitnessAerobic || viewingSession.fitnessStrength || viewingSession.fitnessEndurance) && (
                      <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                          <Heart className="h-4 w-4" />
                          Fitness Training
                        </h4>
                        <div className="text-sm space-y-1 ml-6">
                          {viewingSession.fitnessAerobic && <p><span className="font-medium">Aerobic:</span> {viewingSession.fitnessAerobic}</p>}
                          {viewingSession.fitnessStrength && <p><span className="font-medium">Strength:</span> {viewingSession.fitnessStrength}</p>}
                          {viewingSession.fitnessEndurance && <p><span className="font-medium">Endurance:</span> {viewingSession.fitnessEndurance}</p>}
                        </div>
                      </div>
                    )}

                    {(viewingSession.gkHandling || viewingSession.gkShotStopping || viewingSession.gkDistribution) && (
                      <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4" />
                          Goalkeeper Training
                        </h4>
                        <div className="text-sm space-y-1 ml-6">
                          {viewingSession.gkHandling && <p><span className="font-medium">Handling:</span> {viewingSession.gkHandling}</p>}
                          {viewingSession.gkShotStopping && <p><span className="font-medium">Shot Stopping:</span> {viewingSession.gkShotStopping}</p>}
                          {viewingSession.gkDistribution && <p><span className="font-medium">Distribution:</span> {viewingSession.gkDistribution}</p>}
                        </div>
                      </div>
                    )}

                    {(viewingSession.specificFinishing || viewingSession.specificDefending || viewingSession.specificPressing) && (
                      <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                          <Star className="h-4 w-4" />
                          Specific Work
                        </h4>
                        <div className="text-sm space-y-1 ml-6">
                          {viewingSession.specificFinishing && <p><span className="font-medium">Finishing:</span> {viewingSession.specificFinishing}</p>}
                          {viewingSession.specificDefending && <p><span className="font-medium">Defending:</span> {viewingSession.specificDefending}</p>}
                          {viewingSession.specificPressing && <p><span className="font-medium">Pressing:</span> {viewingSession.specificPressing}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Notes */}
              {viewingSession.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{viewingSession.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Session Dialog */}
      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Training Session</DialogTitle>
          </DialogHeader>
          {editingSession && (
            <TrainingForm 
              session={editingSession}
              onSuccess={() => setEditingSession(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
