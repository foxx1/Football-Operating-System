import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export type Severity = "mild" | "moderate" | "severe";
export type InjuryStatus = "recovering" | "out" | "available";

// An injury as returned by GET /api/injuries — the stored record plus the
// player and squad it belongs to, which is what every injury screen renders.
export interface Injury {
  id: number;
  playerId: number;
  playerName: string;
  teamName: string;
  teamId: number | null;
  injuryType: string;
  severity: Severity;
  bodyPart: string;
  status: InjuryStatus;
  injuryDate: string;
  expectedReturn: string | null;
  mechanism: string | null;
  treatment: string | null;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  treatmentCount: number;
  latestTreatment: { date: string; treatmentType: string } | null;
}

export interface TreatmentLogEntry {
  id: number;
  injuryId: number;
  date: string;
  treatmentType: string;
  medicineCourse: string | null;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
}

export function useInjuries() {
  return useQuery<Injury[]>({ queryKey: ["/api/injuries"] });
}

export function useInjuryTreatments(injuryId: number | null) {
  return useQuery<TreatmentLogEntry[]>({
    queryKey: [`/api/injuries/${injuryId}/treatments`],
    enabled: injuryId != null,
  });
}

// `label` stores a translation key, translated at render time via t().
export const severityConfig: Record<Severity, { color: string; bgColor: string; label: string }> = {
  mild: { color: "text-emerald-400", bgColor: "bg-emerald-500/15 border-emerald-500/30", label: "severity.mild.label" },
  moderate: { color: "text-amber-400", bgColor: "bg-amber-500/15 border-amber-500/30", label: "severity.moderate.label" },
  severe: { color: "text-rose-400", bgColor: "bg-rose-500/15 border-rose-500/30", label: "severity.severe.label" },
};

export const statusConfig: Record<InjuryStatus, { icon: typeof CheckCircle2; color: string; bgColor: string; label: string }> = {
  available: { icon: CheckCircle2, color: "text-emerald-400", bgColor: "bg-emerald-500/15 border-emerald-500/30", label: "status.available" },
  recovering: { icon: Clock, color: "text-amber-400", bgColor: "bg-amber-500/15 border-amber-500/30", label: "status.recovering" },
  out: { icon: AlertTriangle, color: "text-rose-400", bgColor: "bg-rose-500/15 border-rose-500/30", label: "status.out" },
};

export const treatmentTypes = [
  "Physiotherapy Session",
  "Ice / Cold Therapy",
  "Massage Therapy",
  "Strength & Conditioning",
  "Medication",
  "Injection",
  "Surgical Follow-up",
  "Rest & Monitoring",
  "Return-to-Play Assessment",
  "Other",
] as const;

export const getDaysRemaining = (expectedReturn: string | null) => {
  if (!expectedReturn) return 0;
  const diff = Math.ceil(
    (new Date(expectedReturn).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff > 0 ? diff : 0;
};
