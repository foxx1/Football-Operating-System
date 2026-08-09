import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Staff {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
}

interface Team {
  id: number;
  name: string;
  category: string;
  description: string | null;
  isActive: boolean;
}

interface TeamStaffProps {
  staff: Staff;
}

export function StaffTeamAssignment({ staff }: TeamStaffProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all teams
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Get staff's current team assignments
  const { data: staffTeams = [] } = useQuery<Array<{ teamId: number; team: Team }>>({
    queryKey: [`/api/staff-teams/${staff.id}`],
    enabled: open,
  });

  const assignedTeamIds = staffTeams.map(st => st.teamId);
  const availableTeams = teams.filter(team => team.isActive && !assignedTeamIds.includes(team.id));

  // Add staff to team mutation
  const addToTeamMutation = useMutation({
    mutationFn: (teamId: number) =>
      apiRequest("POST", "/api/staff-teams", { teamId, staffId: staff.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/staff-teams/${staff.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Success",
        description: "Staff member assigned to team successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign staff to team",
        variant: "destructive",
      });
    },
  });

  // Remove staff from team mutation
  const removeFromTeamMutation = useMutation({
    mutationFn: (teamId: number) =>
      apiRequest("DELETE", `/api/teams/${teamId}/staff/${staff.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/staff-teams/${staff.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Success",
        description: "Staff member removed from team successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove staff from team",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          Assign to Team
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Team Assignment</DialogTitle>
          <DialogDescription>
            Manage team assignments for {staff.firstName} {staff.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Team Assignments */}
          <div>
            <h3 className="text-lg font-medium mb-3">Current Teams</h3>
            {staffTeams.length > 0 ? (
              <div className="grid gap-3">
                {staffTeams.map((assignment) => (
                  <Card key={assignment.teamId}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h4 className="font-medium">{assignment.team.name}</h4>
                        <p className="text-sm text-muted-foreground">{assignment.team.category}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromTeamMutation.mutate(assignment.teamId)}
                        disabled={removeFromTeamMutation.isPending}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No team assignments yet
                </CardContent>
              </Card>
            )}
          </div>

          {/* Available Teams */}
          <div>
            <h3 className="text-lg font-medium mb-3">Available Teams</h3>
            {availableTeams.length > 0 ? (
              <div className="grid gap-3">
                {availableTeams.map((team) => (
                  <Card key={team.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h4 className="font-medium">{team.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {team.category}
                          {team.description && ` • ${team.description}`}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToTeamMutation.mutate(team.id)}
                        disabled={addToTeamMutation.isPending}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add to Team
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No available teams to assign
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}