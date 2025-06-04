// Simple auth utilities for role-based access control
// In a production app, this would integrate with a proper authentication system

export interface AuthUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'head_coach' | 'assistant_coach' | 'admin';
}

export interface AuthPermissions {
  canManagePlayers: boolean;
  canManageTeams: boolean;
  canScheduleTraining: boolean;
  canViewReports: boolean;
  canManageTactics: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
}

// Mock current user - in real app, this would come from authentication context
export const getCurrentUser = (): AuthUser => {
  return {
    id: 1,
    username: "coach",
    firstName: "Marcus",
    lastName: "Thompson",
    email: "marcus.thompson@procoach.com",
    role: "head_coach"
  };
};

// Role-based permissions
export const getRolePermissions = (role: string): AuthPermissions => {
  switch (role) {
    case 'head_coach':
      return {
        canManagePlayers: true,
        canManageTeams: true,
        canScheduleTraining: true,
        canViewReports: true,
        canManageTactics: true,
        canManageUsers: true,
        canExportData: true,
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
      };
    default:
      return {
        canManagePlayers: false,
        canManageTeams: false,
        canScheduleTraining: false,
        canViewReports: false,
        canManageTactics: false,
        canManageUsers: false,
        canExportData: false,
      };
  }
};

// Get current user permissions
export const getCurrentUserPermissions = (): AuthPermissions => {
  const user = getCurrentUser();
  return getRolePermissions(user.role);
};

// Permission checking functions
export const hasPermission = (permission: keyof AuthPermissions): boolean => {
  const permissions = getCurrentUserPermissions();
  return permissions[permission];
};

export const canManagePlayers = (): boolean => hasPermission('canManagePlayers');
export const canManageTeams = (): boolean => hasPermission('canManageTeams');
export const canScheduleTraining = (): boolean => hasPermission('canScheduleTraining');
export const canViewReports = (): boolean => hasPermission('canViewReports');
export const canManageTactics = (): boolean => hasPermission('canManageTactics');
export const canManageUsers = (): boolean => hasPermission('canManageUsers');
export const canExportData = (): boolean => hasPermission('canExportData');

// Role display helpers
export const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case 'head_coach':
      return 'Head Coach';
    case 'assistant_coach':
      return 'Assistant Coach';
    case 'admin':
      return 'Administrator';
    default:
      return role;
  }
};

// Utility to check if user can access a feature
export const canAccessFeature = (feature: string): boolean => {
  const permissions = getCurrentUserPermissions();
  
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
    default:
      return true; // Allow access to general features like dashboard
  }
};

// Hook for reactive permissions (would be used with React context in full implementation)
export const useAuth = () => {
  const user = getCurrentUser();
  const permissions = getCurrentUserPermissions();
  
  return {
    user,
    permissions,
    isAuthenticated: true, // In real app, this would check authentication state
    hasPermission,
    canAccessFeature,
  };
};
