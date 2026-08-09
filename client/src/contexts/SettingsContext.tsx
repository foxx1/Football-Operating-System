import { createContext, useContext, ReactNode } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useQuery } from '@tanstack/react-query';
import type { SystemSettings } from '@shared/schema';

interface SettingsContextType {
  getSettingValue: (category: string, key: string, defaultValue?: string) => string;
  settings: SystemSettings[];
  isLoading: boolean;
  organizationName: string;
  currentSeason: string;
  logoUrl: string;
  currency: string;
  timezone: string;
  dateFormat: string;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["/api/settings"],
    staleTime: 0, // Always refetch to get latest settings
    gcTime: 0, // Don't cache settings
  });

  const getSettingValue = (category: string, key: string, defaultValue: string = "") => {
    // Filter all matching settings
    const matchingSettings = (settings as SystemSettings[]).filter((s: SystemSettings) =>
      s.category === category && s.settingKey === key
    );

    // If no settings found, return default
    if (matchingSettings.length === 0) return defaultValue;

    // Sort by ID descending to get the latest one
    matchingSettings.sort((a, b) => b.id - a.id);

    return matchingSettings[0].settingValue || defaultValue;
  };

  // Pre-compute commonly used settings for easy access
  const contextValue: SettingsContextType = {
    getSettingValue,
    settings: settings as SystemSettings[],
    isLoading,
    organizationName: (() => {
      try {
        const { locale } = useI18n();
        if (locale === 'ar') {
          return getSettingValue("general", "org_name_ar", getSettingValue("general", "org_name", "360FOS"));
        }
      } catch (e) {
        // fallback if hook not available
      }
      return getSettingValue("general", "org_name", "360FOS");
    })(),
    currentSeason: getSettingValue("general", "current_season", "2024-25"),
    logoUrl: getSettingValue("general", "logo_url", ""),
    currency: getSettingValue("general", "currency", "USD"),
    timezone: getSettingValue("general", "timezone", "Asia/Kuwait"),
    dateFormat: getSettingValue("general", "date_format", "DD/MM/YYYY"),
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// Currency symbol mapping - using English abbreviations for better compatibility
export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    SAR: "SR",
    QAR: "QR",
    AED: "AED",
    OMR: "OMR",
    KWD: "KD",
    BHD: "BD",
    GBP: "£",
    JPY: "¥",
  };
  return symbols[currency] || currency;
};

// Currency formatting function
export const formatCurrency = (amount: number, currency: string): string => {
  const symbol = getCurrencySymbol(currency);
  const safeAmount = (amount == null || isNaN(amount)) ? 0 : amount;
  return `${symbol}${safeAmount.toLocaleString()}`;
};