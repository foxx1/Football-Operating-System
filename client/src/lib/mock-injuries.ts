import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

// Mock injury data (until backend is ready). `mechanism`/`treatment` mirror
// the fields captured by the Record New Injury form (add-injury.tsx), so a
// record here can be shown back exactly as medical staff entered it.
// Shared between injury-list.tsx and injury-management.tsx so both stay in
// sync on the same underlying dataset.
export const mockInjuries = [
  {
    id: 1,
    playerId: 1,
    playerName: "Ahmed Hassan",
    teamName: "First Team",
    injuryType: "Hamstring Strain",
    severity: "moderate" as const,
    bodyPart: "Left Hamstring",
    status: "recovering" as const,
    injuryDate: "2026-06-15",
    expectedReturn: "2026-07-20",
    mechanism: "Non-contact injury during a high-speed sprint in the second half.",
    treatment: "RICE protocol for 48 hours, followed by progressive hamstring loading exercises and physiotherapy 3x/week.",
    notes: "Grade 2 hamstring strain during match. Rehabilitation in progress.",
  },
  {
    id: 2,
    playerId: 2,
    playerName: "Mohamed Ali",
    teamName: "First Team",
    injuryType: "ACL Tear",
    severity: "severe" as const,
    bodyPart: "Right Knee",
    status: "out" as const,
    injuryDate: "2026-05-20",
    expectedReturn: "2027-01-15",
    mechanism: "Non-contact pivot injury while changing direction during a match.",
    treatment: "ACL reconstruction surgery performed on May 25. Structured 9-month rehabilitation program with the medical team.",
    notes: "Underwent surgery on May 25. Long-term rehabilitation plan initiated.",
  },
  {
    id: 3,
    playerId: 3,
    playerName: "Youssef Karim",
    teamName: "Reserves",
    injuryType: "Ankle Sprain",
    severity: "mild" as const,
    bodyPart: "Right Ankle",
    status: "available" as const,
    injuryDate: "2026-06-28",
    expectedReturn: "2026-07-08",
    mechanism: "Rolled ankle landing awkwardly after a header during training.",
    treatment: "Ice and compression for 72 hours, ankle taping, and balance/proprioception drills before full clearance.",
    notes: "Minor sprain. Cleared for full training.",
  },
  {
    id: 4,
    playerId: 4,
    playerName: "Omar Fathy",
    teamName: "First Team",
    injuryType: "Muscle Contusion",
    severity: "mild" as const,
    bodyPart: "Left Thigh",
    status: "recovering" as const,
    injuryDate: "2026-07-01",
    expectedReturn: "2026-07-12",
    mechanism: "Direct knee-to-thigh contact during a training collision.",
    treatment: "Ice therapy and light stretching. Cleared for modified training within a week.",
    notes: "Contusion from training collision. Expected back soon.",
  },
  {
    id: 5,
    playerId: 5,
    playerName: "Khaled Mansour",
    teamName: "Youth",
    injuryType: "Stress Fracture",
    severity: "severe" as const,
    bodyPart: "Right Shin",
    status: "out" as const,
    injuryDate: "2026-06-10",
    expectedReturn: "2026-09-01",
    mechanism: "Gradual onset pain from repetitive loading, confirmed via MRI.",
    treatment: "Non-weight-bearing in a walking boot for 6 weeks, followed by a graded return-to-running program.",
    notes: "Stress fracture identified via MRI. Non-weight-bearing for 6 weeks.",
  },
  {
    id: 6,
    playerId: 6,
    playerName: "Tarek Sayed",
    teamName: "Reserves",
    injuryType: "Groin Pull",
    severity: "moderate" as const,
    bodyPart: "Left Groin",
    status: "recovering" as const,
    injuryDate: "2026-06-25",
    expectedReturn: "2026-07-18",
    mechanism: "Sudden groin strain during an explosive sprint drill.",
    treatment: "Adductor strengthening program and gradual return to sprinting under physiotherapist supervision.",
    notes: "Groin strain sustained during sprint drills.",
  },
];

export type MockInjury = (typeof mockInjuries)[number];
export type Severity = "mild" | "moderate" | "severe";
export type InjuryStatus = "recovering" | "out" | "available";

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

export const getDaysRemaining = (expectedReturn: string) => {
  const now = new Date();
  const returnDate = new Date(expectedReturn);
  const diff = Math.ceil((returnDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

// Treatment log entries captured by medical staff via the Smart Injury
// Management page (injury-management.tsx) — a running course-of-care record
// per injury, until the player's status is updated back to "available".
export interface TreatmentLogEntry {
  id: number;
  date: string;
  treatmentType: string;
  medicineCourse?: string;
  notes?: string;
}

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

// Seed history so the tracker has realistic starting content for the
// injuries that are already mid-treatment (`recovering`/`out`).
export const mockTreatmentLogs: Record<number, TreatmentLogEntry[]> = {
  1: [
    {
      id: 1,
      date: "2026-06-16",
      treatmentType: "Rest & Monitoring",
      medicineCourse: "Ibuprofen 400mg — 3x daily for 5 days",
      notes: "Initial RICE protocol applied. Swelling controlled.",
    },
    {
      id: 2,
      date: "2026-06-24",
      treatmentType: "Physiotherapy Session",
      medicineCourse: "",
      notes: "Started progressive hamstring loading exercises. Good tolerance, no pain.",
    },
  ],
  2: [
    {
      id: 1,
      date: "2026-05-25",
      treatmentType: "Surgical Follow-up",
      medicineCourse: "Post-op antibiotics — 7-day course",
      notes: "ACL reconstruction surgery completed successfully.",
    },
    {
      id: 2,
      date: "2026-06-20",
      treatmentType: "Physiotherapy Session",
      medicineCourse: "",
      notes: "Began Phase 2 rehab: range-of-motion and light quad activation.",
    },
  ],
  4: [
    {
      id: 1,
      date: "2026-07-02",
      treatmentType: "Ice / Cold Therapy",
      medicineCourse: "",
      notes: "Ice applied 20 min every 2 hours for the first 48 hours.",
    },
  ],
  5: [
    {
      id: 1,
      date: "2026-06-11",
      treatmentType: "Medication",
      medicineCourse: "Calcium + Vitamin D supplement — ongoing throughout recovery",
      notes: "Walking boot fitted, non-weight-bearing confirmed via follow-up scan.",
    },
  ],
  6: [
    {
      id: 1,
      date: "2026-06-26",
      treatmentType: "Massage Therapy",
      medicineCourse: "",
      notes: "Soft tissue work on adductor group, mild tenderness remains.",
    },
  ],
};
