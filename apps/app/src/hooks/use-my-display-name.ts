import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/contexts/I18nContext";

interface DisplayNameResponse {
  firstName: string;
  lastName: string;
  firstNameAr: string | null;
  lastNameAr: string | null;
}

// Resolves the signed-in user's greeting name, preferring the Arabic name
// recorded on their player/staff record when the Arabic locale is active.
export function useMyDisplayName() {
  const { user } = useAuth();
  const { isRtl } = useI18n();

  const { data } = useQuery<DisplayNameResponse>({
    queryKey: ["/api/dashboard/my-name"],
    enabled: Boolean(user),
  });

  // Only switch to the Arabic name once a first name is recorded for it —
  // otherwise a partially-filled record would mix an Arabic first name with
  // an English last name.
  const useArabic = isRtl && Boolean(data?.firstNameAr);
  const firstName = (useArabic ? data?.firstNameAr : user?.firstName) || "";
  const lastName = (useArabic ? data?.lastNameAr : user?.lastName) || "";

  return { firstName, lastName, fullName: [firstName, lastName].filter(Boolean).join(" ") };
}
