import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  HeartPulse,
  CalendarDays,
  Save,
  UserRound,
  Stethoscope,
} from "lucide-react";
import type { Player, Team } from "@shared/schema";
import { useI18n } from "@/contexts/I18nContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { BodyMapSelector, SEVERITY_COLORS, translateBodyPart, type SeverityLevel } from "@/components/body-map-selector";

const baseParts = [
  "Head", "Neck", "Trapezius", "Upper Back", "Lower Back", "Chest",
  "Biceps", "Triceps", "Forearm", "Back Deltoids", "Front Deltoids",
  "Abs", "Obliques", "Adductor", "Abductors", "Hamstring", "Quadriceps",
  "Calves", "Gluteal", "Knees", "Soleus"
];

// Values stay in English (stable identifiers used elsewhere); only the
// SelectItem label shown to the user is translated, via translateBodyPart.
const bodyParts = baseParts.flatMap(part => {
  if (["Head", "Neck", "Abs"].includes(part)) return [part];
  return [part, `Left ${part}`, `Right ${part}`];
}).sort();

const severityLevels: SeverityLevel[] = ["minimal", "mild", "moderate", "severe"];

const injuryTypes = [
  "Muscle Strain", "Muscle Contusion", "Ligament Sprain", "ACL Tear",
  "MCL Tear", "Meniscus Tear", "Hamstring Strain", "Groin Pull",
  "Ankle Sprain", "Stress Fracture", "Bone Fracture", "Concussion",
  "Tendonitis", "Dislocation", "Shin Splints", "Plantar Fasciitis",
  "Achilles Tendon", "Calf Strain", "Quadriceps Strain", "Other",
];

export default function AddInjury() {
  const { t, locale } = useI18n();
  const dateLocale = locale === "ar" ? ar : enUS;
  const { toast } = useToast();
  const [injuryDate, setInjuryDate] = useState<Date | undefined>(new Date());
  const [expectedReturnDate, setExpectedReturnDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    playerId: "",
    injuryType: "",
    bodyPart: "",
    severity: "",
    mechanism: "",
    treatment: "",
    notes: "",
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.playerId || !formData.injuryType || !formData.bodyPart || !formData.severity || !injuryDate) {
      toast({
        title: t("injury.add.toastMissingTitle"),
        description: t("injury.add.toastMissingDesc"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/injuries", {
        playerId: Number(formData.playerId),
        injuryType: formData.injuryType,
        bodyPart: formData.bodyPart,
        severity: formData.severity,
        injuryDate: format(injuryDate, "yyyy-MM-dd"),
        expectedReturn: expectedReturnDate ? format(expectedReturnDate, "yyyy-MM-dd") : null,
        mechanism: formData.mechanism || null,
        treatment: formData.treatment || null,
        notes: formData.notes || null,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/injuries"] });

      toast({
        title: t("injury.add.toastSuccessTitle"),
        description: t("injury.add.toastSuccessDesc"),
      });

      // Reset form
      setFormData({
        playerId: "",
        injuryType: "",
        bodyPart: "",
        severity: "",
        mechanism: "",
        treatment: "",
        notes: "",
      });
      setInjuryDate(new Date());
      setExpectedReturnDate(undefined);
    } catch (error) {
      toast({
        title: t("injury.add.toastMissingTitle"),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/20">
            <HeartPulse className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("injury.add.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("injury.add.description")}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Player Selection */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-500/5 to-transparent border-b border-border/30">
            <div className="flex items-center gap-2">
              <UserRound className="w-4 h-4 text-blue-400" />
              <CardTitle className="text-base">{t("injury.add.playerSectionTitle")}</CardTitle>
            </div>
            <CardDescription>{t("injury.add.playerSectionDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="player" className="text-sm font-medium">
                  {t("injury.add.playerLabel")} <span className="text-rose-400">*</span>
                </Label>
                <Select
                  value={formData.playerId}
                  onValueChange={(value) => setFormData({ ...formData, playerId: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={t("injury.add.playerPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map((player) => (
                      <SelectItem key={player.id} value={String(player.id)}>
                        {player.firstName} {player.lastName} — #{player.shirtNumber || "N/A"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Injury Details */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-rose-500/5 to-transparent border-b border-border/30">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-rose-400" />
              <CardTitle className="text-base">{t("injury.add.detailsSectionTitle")}</CardTitle>
            </div>
            <CardDescription>{t("injury.add.detailsSectionDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Body Map (leading column, mirrors with RTL) */}
              <div className="md:col-span-5 flex flex-col justify-start">
                <Label className="text-sm font-medium mb-3">
                  {t("injury.add.bodyPartLabel")} <span className="text-rose-400">*</span>
                </Label>
                <BodyMapSelector
                  value={formData.bodyPart}
                  onChange={(part) => setFormData({ ...formData, bodyPart: part })}
                  severity={formData.severity as SeverityLevel | ""}
                />
              </div>

              {/* Other Details (trailing column, mirrors with RTL) */}
              <div className="md:col-span-7 space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("injury.add.injuryTypeLabel")} <span className="text-rose-400">*</span>
                  </Label>
                  <Select
                    value={formData.injuryType}
                    onValueChange={(value) => setFormData({ ...formData, injuryType: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("injury.add.injuryTypePlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {injuryTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`injuryType.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("injury.add.bodyPartFallbackLabel")} <span className="text-rose-400">*</span>
                  </Label>
                  <Select
                    value={formData.bodyPart}
                    onValueChange={(value) => setFormData({ ...formData, bodyPart: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={t("injury.add.bodyPartFallbackPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {bodyParts.map((part) => (
                        <SelectItem key={part} value={part}>
                          {translateBodyPart(t, part)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("injury.add.severityLabel")} <span className="text-rose-400">*</span>
                </Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData({ ...formData, severity: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={t("injury.add.severityPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {severityLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: SEVERITY_COLORS[level] }}
                          />
                          {t(`severity.${level}.label`)} — {t(`severity.${level}.days`)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("injury.add.mechanismLabel")}</Label>
                  <Input
                    placeholder={t("injury.add.mechanismPlaceholder")}
                    value={formData.mechanism}
                    onChange={(e) => setFormData({ ...formData, mechanism: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-amber-500/5 to-transparent border-b border-border/30">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-amber-400" />
              <CardTitle className="text-base">{t("injury.add.timelineSectionTitle")}</CardTitle>
            </div>
            <CardDescription>{t("injury.add.timelineSectionDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("injury.add.injuryDateLabel")} <span className="text-rose-400">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-11 justify-start text-start font-normal",
                        !injuryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="me-2 h-4 w-4" />
                      {injuryDate ? format(injuryDate, "PPP", { locale: dateLocale }) : t("injury.add.pickDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={injuryDate}
                      onSelect={setInjuryDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">{t("injury.add.expectedReturnLabel")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-11 justify-start text-start font-normal",
                        !expectedReturnDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="me-2 h-4 w-4" />
                      {expectedReturnDate ? format(expectedReturnDate, "PPP", { locale: dateLocale }) : t("injury.add.pickDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expectedReturnDate}
                      onSelect={setExpectedReturnDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Treatment & Notes */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="pb-4 bg-gradient-to-r from-emerald-500/5 to-transparent border-b border-border/30">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-base">{t("injury.add.treatmentSectionTitle")}</CardTitle>
            </div>
            <CardDescription>{t("injury.add.treatmentSectionDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("injury.add.treatmentLabel")}</Label>
              <Textarea
                placeholder={t("injury.add.treatmentPlaceholder")}
                value={formData.treatment}
                onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("injury.add.notesLabel")}</Label>
              <Textarea
                placeholder={t("injury.add.notesPlaceholder")}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 px-8 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white shadow-lg shadow-rose-500/25"
          >
            <Save className="w-4 h-4 me-2" />
            {isSubmitting ? t("injury.add.submitting") : t("injury.add.submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
