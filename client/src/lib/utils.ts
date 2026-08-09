import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface NameFields {
  firstName: string;
  lastName: string;
  firstNameAr?: string | null;
  lastNameAr?: string | null;
}

// Mirrors the org-name fallback pattern in SettingsContext: Arabic name wins
// only when the locale is RTL and at least one Arabic name part was entered.
export function getDisplayName(person: NameFields, isRtl: boolean) {
  if (isRtl && (person.firstNameAr || person.lastNameAr)) {
    return `${person.firstNameAr || person.firstName} ${person.lastNameAr || person.lastName}`.trim();
  }
  return `${person.firstName} ${person.lastName}`.trim();
}

export function calculateTimeRemaining(dateString: string | null | undefined) {
  if (!dateString) return null;

  const targetDate = new Date(dateString);
  const today = new Date();

  // Reset hours to compare dates only
  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const months = Math.floor(diffDays / 30);
  const days = diffDays % 30;

  return {
    days: diffDays,
    months,
    remainingDays: days, // days remainder after months
    isExpiring: diffDays < 120, // Less than 120 days
    isExpired: diffDays < 0,
    text: diffDays < 0
      ? "Expired"
      : `${months > 0 ? `${months}m ` : ""}${days}d`
  };
}
