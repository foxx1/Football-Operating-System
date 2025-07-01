import { createContext, useContext, ReactNode } from 'react';
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
    const setting = (settings as SystemSettings[]).find((s: SystemSettings) => 
      s.category === category && s.settingKey === key
    );
    return setting?.settingValue || defaultValue;
  };

  // Pre-compute commonly used settings for easy access
  const contextValue: SettingsContextType = {
    getSettingValue,
    settings: settings as SystemSettings[],
    isLoading,
    organizationName: getSettingValue("general", "org_name", "ProCoach Team"),
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
  return `${symbol}${amount.toLocaleString()}`;
};