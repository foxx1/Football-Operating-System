import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { API_BASE_URL } from "@/lib/api-base";
import type { EmployeeRole } from "@shared/schema";

export interface AuthUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'club_super_admin' | 'admin' | 'assistant' | 'player' | EmployeeRole;
  avatar?: string | null;
  phoneNumber?: string | null;
}

export interface AuthPermissions {
  canManagePlayers: boolean;
  canManageTeams: boolean;
  canScheduleTraining: boolean;
  canViewReports: boolean;
  canManageTactics: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
  canManageFinance: boolean;
  canManageRoles: boolean;
}

let currentUserCache: AuthUser | null = null;

export const getRolePermissions = (role: string): AuthPermissions => {
  switch (role) {
    case 'club_super_admin':
      return {
        canManagePlayers: true,
        canManageTeams: true,
        canScheduleTraining: true,
        canViewReports: true,
        canManageTactics: true,
        canManageUsers: true,
        canExportData: true,
        canManageFinance: true,
        canManageRoles: true,
      };
    case 'head_coach':
      return {
        canManagePlayers: true,
        canManageTeams: true,
        canScheduleTraining: true,
        canViewReports: true,
        canManageTactics: true,
        canManageUsers: true,
        canExportData: true,
        canManageFinance: true,
        canManageRoles: false,
      };
    case 'admin':
      return {
        canManagePlayers: true,
        canManageTeams: true,
        canScheduleTraining: false,
        canViewReports: true,
        canManageTactics: false,
        canManageUsers: true,
        canExportData: true,
        canManageFinance: true,
        canManageRoles: false,
      };
    case 'team_admin_director':
      return {
        canManagePlayers: true,
        canManageTeams: true,
        canScheduleTraining: true,
        canViewReports: true,
        canManageTactics: false,
        canManageUsers: true,
        canExportData: true,
        canManageFinance: true,
        canManageRoles: false,
      };
    case 'team_admin_supervisor':
      return {
        canManagePlayers: true,
        canManageTeams: true,
        canScheduleTraining: true,
        canViewReports: true,
        canManageTactics: false,
        canManageUsers: false,
        canExportData: true,
        canManageFinance: true,
        canManageRoles: false,
      };
    case 'assistant_coach':
      return {
        canManagePlayers: true,
        canManageTeams: false,
        canScheduleTraining: true,
        canViewReports: true,
        canManageTactics: true,
        canManageUsers: false,
        canExportData: false,
        canManageFinance: false,
        canManageRoles: false,
      };
    case 'player':
      return {
        canManagePlayers: false,
        canManageTeams: false,
        canScheduleTraining: false,
        canViewReports: false,
        canManageTactics: false,
        canManageUsers: false,
        canExportData: false,
        canManageFinance: false,
        canManageRoles: false,
      };
    default:
      return {
        canManagePlayers: false,
        canManageTeams: false,
        canScheduleTraining: false,
        canViewReports: true,
        canManageTactics: false,
        canManageUsers: false,
        canExportData: false,
        canManageFinance: false,
        canManageRoles: false,
      };
  }
};

export async function login(username: string, password: string): Promise<AuthUser> {
  const result = await apiRequest("POST", "/api/auth/login", { username, password });
  currentUserCache = result.user;
  return result.user;
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
  currentUserCache = null;
}

export function useAuth() {
  const query = useQuery<{ user: AuthUser } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: "include" });
      if (res.status === 401) {
        currentUserCache = null;
        return null;
      }
      if (!res.ok) {
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      currentUserCache = data.user;
      return data;
    },
    retry: false,
  });

  const user = query.data?.user ?? null;
  const permissions = user ? getRolePermissions(user.role) : getRolePermissions("");

  return {
    user,
    permissions,
    isAuthenticated: !!user,
    isLoading: query.isLoading,
    hasPermission: (permission: keyof AuthPermissions) => permissions[permission],
    canAccessFeature: (feature: string) => canAccessFeature(feature, permissions),
  };
}

export const getAuthState = () => {
  const user = currentUserCache;
  const permissions = user ? getRolePermissions(user.role) : getRolePermissions("");

  return {
    user,
    permissions,
    isAuthenticated: !!user,
    hasPermission: (permission: keyof AuthPermissions) => permissions[permission],
    canAccessFeature: (feature: string) => canAccessFeature(feature, permissions),
  };
};

export const getCurrentUser = (): AuthUser | null => currentUserCache;
export const getCurrentUserPermissions = (): AuthPermissions => getAuthState().permissions;
export const hasPermission = (permission: keyof AuthPermissions): boolean => getAuthState().hasPermission(permission);

export const canManagePlayers = (): boolean => hasPermission('canManagePlayers');
export const canManageTeams = (): boolean => hasPermission('canManageTeams');
export const canScheduleTraining = (): boolean => hasPermission('canScheduleTraining');
export const canViewReports = (): boolean => hasPermission('canViewReports');
export const canManageTactics = (): boolean => hasPermission('canManageTactics');
export const canManageUsers = (): boolean => hasPermission('canManageUsers');
export const canExportData = (): boolean => hasPermission('canExportData');
export const canManageRoles = (): boolean => hasPermission('canManageRoles');

export const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case 'club_super_admin':
      return 'Club Super Admin';
    case 'head_coach':
      return 'Head Coach';
    case 'assistant_coach':
      return 'Assistant Coach';
    case 'fitness_coach':
      return 'Fitness Coach';
    case 'goalkeeping_coach':
      return 'Goalkeeping Coach';
    case 'physiotherapist':
      return 'Physiotherapist';
    case 'analyst':
      return 'Analyst';
    case 'kit_manager':
      return 'Kit Manager';
    case 'team_manager':
      return 'Team Manager';
    case 'team_administrative':
      return 'Team Administrative';
    case 'team_admin_supervisor':
      return 'Team Administrative Supervisor';
    case 'team_admin_director':
      return 'Team Administrative Director';
    case 'admin':
      return 'Administrator';
    case 'assistant':
      return 'Assistant';
    case 'player':
      return 'Player';
    default:
      return role;
  }
};

export const canAccessFeature = (feature: string, permissions = getCurrentUserPermissions()): boolean => {
  switch (feature) {
    case 'players':
      return permissions.canManagePlayers;
    case 'teams':
      return permissions.canManageTeams;
    case 'training':
      return permissions.canScheduleTraining;
    case 'tactics':
      return permissions.canManageTactics;
    case 'reports':
      return permissions.canViewReports;
    case 'finance':
      return permissions.canManageFinance;
    case 'users':
      return permissions.canManageRoles;
    default:
      return true;
  }
};
