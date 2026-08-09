import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/contexts/I18nContext";

export interface SystemSetting {
  id: number;
  category: string;
  settingKey: string;
  settingValue: string | null;
  description: string | null;
  isActive: boolean;
  updatedBy: number;
  updatedAt: string;
}

/**
 * Hook to fetch all system settings from the server
 */
export function useSystemSettings() {
  return useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const response = await fetch("/api/settings");
      if (!response.ok) {
        throw new Error("Failed to fetch system settings");
      }
      return response.json() as Promise<SystemSetting[]>;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to fetch a specific setting by category and key
 */
export function useSystemSetting(category: string, settingKey: string) {
  const { data: settings, isLoading, error } = useSystemSettings();

  const setting = settings
    ?.filter((s) => s.category === category && s.settingKey === settingKey && s.isActive)
    .sort((a, b) => b.id - a.id)[0];

  return {
    setting,
    value: setting?.settingValue ?? null,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch the club name from system settings
 * Falls back to "Our Club" if not set
 */
export function useClubName(fallback: string = "Our Club") {
  const { data: settings, isLoading, error } = useSystemSettings();
  const setting = settings
    ?.filter((s) =>
      s.category === "general"
      && (s.settingKey === "org_name" || s.settingKey === "clubName")
      && s.isActive
    )
    .sort((a, b) => b.id - a.id)[0];

  return {
    clubName: setting?.settingValue || fallback,
    isLoading,
    error,
  };
}

export function useClubBranding(fallbackName: string = "Our Club") {
  const { data: settings, isLoading, error } = useSystemSettings();
  const { locale } = useI18n();

  const getLatestValue = (key: string) =>
    settings
      ?.filter((s) => s.category === "general" && s.settingKey === key && s.isActive)
      .sort((a, b) => b.id - a.id)[0]?.settingValue || "";

  // Prefer Arabic org name when locale is Arabic
  const organizationName = (locale === 'ar'
    ? (getLatestValue("org_name_ar") || getLatestValue("org_name") || getLatestValue("clubName"))
    : (getLatestValue("org_name") || getLatestValue("clubName") || fallbackName)
  );
  const logoUrl = getLatestValue("logo_url");

  return {
    organizationName,
    logoUrl,
    isLoading,
    error,
  };
}
