import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { isAdminRole } from "@shared/schema";
import type { Team } from "@shared/schema";

export function useMyTeams() {
  const { user } = useAuth();
  const enabled = isAdminRole(user?.role);

  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ["/api/dashboard/my-teams"],
    enabled,
  });

  return {
    teams,
    teamIds: teams.map((t) => t.id),
    primaryTeam: teams[0] ?? null,
    isLoading,
  };
}
