import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { insertTrainingSessionSchema, type TrainingSession, type Staff, type Team } from "@shared/schema";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/contexts/I18nContext";
import TrainingImageUpload from "./training-image-upload";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Activity,
  Target,
  Shield,
  Zap,
  Heart,
  Dumbbell,
  Timer,
  TrendingUp,
  Star
} from "lucide-react";

interface TrainingFormProps {
  session?: TrainingSession;
  onSuccess: () => void;
  prefillData?: Partial<TrainingSession>;
}

export default function TrainingForm({ session, onSuccess, prefillData }: TrainingFormProps) {
  const { toast } = useToast();
  const { t, direction } = useI18n();
  const isEditing = !!session;

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const { data: staffMembers = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // Create a modified schema that converts maxParticipants string to number
  const formSchema = insertTrainingSessionSchema.extend({
    maxParticipants: z.union([
      z.string().transform(val => val === "" ? undefined : parseInt(val, 10)),
      z.number(),
      z.undefined()
    ]).optional(),
    duration: z.union([
      z.string().transform(val => parseInt(val, 10)),
      z.number()
    ]),
    fitnessDuration: z.union([
      z.string().transform(val => val === "" ? undefined : parseInt(val, 10)),
      z.number(),
      z.undefined()
    ]).optional(),
    mainPartDuration: z.union([
      z.string().transform(val => val === "" ? undefined : parseInt(val, 10)),
      z.number(),
      z.undefined()
    ]).optional(),
    goalkeepingDuration: z.union([
      z.string().transform(val => val === "" ? undefined : parseInt(val, 10)),
      z.number(),
      z.undefined()
    ]).optional(),
    specificWorkDuration: z.union([
      z.string().transform(val => val === "" ? undefined : parseInt(val, 10)),
      z.number(),
      z.undefined()
    ]).optional(),
    teamId: z.union([
      z.string().transform(val => parseInt(val, 10)),
      z.number()
    ]),
    coachId: z.union([
      z.string().transform(val => parseInt(val, 10)),
      z.number()
    ])
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: session?.title || prefillData?.title || "",
      description: session?.description || "",
      sessionType: session?.sessionType || "",
      date: session?.date || prefillData?.date || "",
      startTime: session?.startTime || prefillData?.startTime || "",
      duration: session?.duration || 90,
      location: session?.location || "",
      teamId: session?.teamId, // Will be set by useEffect
      coachId: session?.coachId, // Will be set by useEffect
      maxParticipants: session?.maxParticipants || undefined,
      fitnessDuration: session?.fitnessDuration || undefined,
      mainPartDuration: session?.mainPartDuration || undefined,
      goalkeepingDuration: session?.goalkeepingDuration || undefined,
      specificWorkDuration: session?.specificWorkDuration || undefined,

      // Fitness Section
      fitnessAerobic: session?.fitnessAerobic || "",
      fitnessStrength: session?.fitnessStrength || "",
      fitnessEndurance: session?.fitnessEndurance || "",
      fitnessTests: session?.fitnessTests || "",
      fitnessRecovery: session?.fitnessRecovery || "",
      fitnessTapering: session?.fitnessTapering || "",
      fitnessWarmUp: session?.fitnessWarmUp || "",
      fitnessCoolDown: session?.fitnessCoolDown || "",
      fitnessFlexibility: session?.fitnessFlexibility || "",
      fitnessAgility: session?.fitnessAgility || "",
      fitnessSpeed: session?.fitnessSpeed || "",
      fitnessPower: session?.fitnessPower || "",
      fitnessOther: session?.fitnessOther || "",

      // Main Part Section
      mainTechnical: session?.mainTechnical || "",
      mainTactical: session?.mainTactical || "",
      mainMatchPrep: session?.mainMatchPrep || "",
      mainPossession: session?.mainPossession || "",
      mainTransition: session?.mainTransition || "",
      mainSetPieces: session?.mainSetPieces || "",
      mainFinishing: session?.mainFinishing || "",

      // Goalkeeper Section
      gkHandling: session?.gkHandling || "",
      gkShotStopping: session?.gkShotStopping || "",
      gkDistribution: session?.gkDistribution || "",
      gkFootwork: session?.gkFootwork || "",
      gkCrossing: session?.gkCrossing || "",
      gkOneOnOne: session?.gkOneOnOne || "",
      gkCommunication: session?.gkCommunication || "",
      gkPositioning: session?.gkPositioning || "",
      gkReactions: session?.gkReactions || "",
      gkDiving: session?.gkDiving || "",
      gkThrowing: session?.gkThrowing || "",
      gkKicking: session?.gkKicking || "",

      // Specific Work Section
      specificIndividual: session?.specificIndividual || "",
      specificPosition: session?.specificPosition || "",
      specificInjuryPrev: session?.specificInjuryPrev || "",
      specificRehab: session?.specificRehab || "",
      specificYouth: session?.specificYouth || "",
      specificCondition: session?.specificCondition || "",
      specificFinishing: session?.specificFinishing || "",
      specificCrossing: session?.specificCrossing || "",
      specificDefending: session?.specificDefending || "",
      specificPressing: session?.specificPressing || "",
      specificCounterAttack: session?.specificCounterAttack || "",
      specificMental: session?.specificMental || "",

      // Training Image
      trainingImageUrl: session?.trainingImageUrl || "",
      trainingImageType: session?.trainingImageType || "",
      trainingImageName: session?.trainingImageName || "",

      // Section-specific images
      fitnessImageUrl: session?.fitnessImageUrl || "",
      fitnessImageType: session?.fitnessImageType || "",
      fitnessImageName: session?.fitnessImageName || "",

      goalkeepingImageUrl: session?.goalkeepingImageUrl || "",
      goalkeepingImageType: session?.goalkeepingImageType || "",
      goalkeepingImageName: session?.goalkeepingImageName || "",

      specificWorkImageUrl: session?.specificWorkImageUrl || "",
      specificWorkImageType: session?.specificWorkImageType || "",
      specificWorkImageName: session?.specificWorkImageName || "",

      notes: session?.notes || "",
      status: session?.status || "scheduled",
    },
  });

  // Set default team and coach when data loads
  useEffect(() => {
    if (!session) {
      if (teams.length > 0 && !form.getValues("teamId")) {
        form.setValue("teamId", teams[0].id);
      }
      if (staffMembers.length > 0 && !form.getValues("coachId")) {
        form.setValue("coachId", staffMembers[0].id);
      }
    }
  }, [teams, staffMembers, session, form]);

  const createSessionMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/training-sessions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-sessions"] });
      toast({
        title: t("training.form.toast.createdTitle"),
        description: t("training.form.toast.createdDescription"),
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: t("training.form.toast.errorTitle"),
        description: t("training.form.toast.errorDescription.create"),
        variant: "destructive",
      });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("PUT", `/api/training-sessions/${session?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-sessions"] });
      toast({
        title: t("training.form.toast.updatedTitle"),
        description: t("training.form.toast.updatedDescription"),
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: t("training.form.toast.errorTitle"),
        description: t("training.form.toast.errorDescription.update"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (isEditing) {
      updateSessionMutation.mutate(data);
    } else {
      createSessionMutation.mutate(data);
    }
  };

  const isSubmitting = createSessionMutation.isPending || updateSessionMutation.isPending;

  return (
    <div dir={direction} className="w-full p-2 space-y-4 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {isEditing ? t("training.editTrainingSession") : t("training.form.createTitle")}
          </h2>
          <p className="text-muted-foreground">{t("training.form.subtitle")}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t("training.form.basicInformation")}
              </CardTitle>
              <CardDescription>
                {t("training.form.basicInfoDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {/* First Row: Title and Session Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("training.form.sessionTitle")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("training.form.titlePlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sessionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("training.form.sessionTypeLabel")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("training.form.sessionTypePlaceholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fitness">{t("training.sessionType.fitness")}</SelectItem>
                          <SelectItem value="technical">{t("training.sessionType.technical")}</SelectItem>
                          <SelectItem value="tactical">{t("training.sessionType.tactical")}</SelectItem>
                          <SelectItem value="match_prep">{t("training.sessionType.match_prep")}</SelectItem>
                          <SelectItem value="recovery">{t("training.sessionType.recovery")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Second Row: Date, Start Time, Duration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("training.form.dateLabel")}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("training.form.startTimeLabel")}</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("training.form.durationLabel")}</FormLabel>
                      <FormControl>
                        <Input type="number" min="30" max="180" placeholder={t("training.form.durationPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Third Row: Location, Max Participants */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("training.form.locationLabel")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("training.form.locationPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("training.form.maxParticipantsLabel")}</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="30" placeholder={t("training.form.maxParticipantsPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Fourth Row: Team and Coach */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="teamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("training.form.teamLabel")}</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("training.form.teamPlaceholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teams.length > 0 ? (
                            teams.map((team: any) => (
                              <SelectItem key={team.id} value={team.id.toString()}>
                                {team.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-teams" disabled>{t("training.form.noTeamsFound")}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coachId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("training.form.coachLabel")}</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("training.form.coachPlaceholder")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {staffMembers.length > 0 ? (
                            staffMembers.map((staff) => (
                              <SelectItem key={staff.id} value={staff.id.toString()}>
                                {staff.firstName} {staff.lastName}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-staff" disabled>{t("training.form.noStaffFound")}</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Fifth Row: Description */}
              <div className="mb-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("training.form.descriptionLabel")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("training.form.descriptionPlaceholder")}
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Description Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("training.form.maxParticipantsLabel")}</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("training.form.descriptionLabel")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("training.form.descriptionPlaceholder")}
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
                <TrainingImageUpload
                  onImageSelect={(url, type, name) => {
                    form.setValue("trainingImageUrl", url);
                    form.setValue("trainingImageType", type);
                    form.setValue("trainingImageName", name);
                  }}
                  currentImage={
                    form.watch("trainingImageUrl") ? {
                      url: form.watch("trainingImageUrl") || "",
                      type: form.watch("trainingImageType") || "",
                      name: form.watch("trainingImageName") || ""
                    } : undefined
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Training Sections */}
          <Card>
            <CardHeader>
              <CardTitle>{t("training.trainingStructure")}</CardTitle>
              <CardDescription>{t("training.form.structureDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs defaultValue="fitness" className="w-full" orientation="horizontal">
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="fitness" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    {t("training.fitness")}
                  </TabsTrigger>
                  <TabsTrigger value="main" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    {t("training.form.tabs.main")}
                  </TabsTrigger>
                  <TabsTrigger value="goalkeeper" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {t("training.goalkeeperTraining")}
                  </TabsTrigger>
                  <TabsTrigger value="specific" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    {t("training.specificWork")}
                  </TabsTrigger>
                </TabsList>

                {/* Fitness Section */}
                <TabsContent value="fitness" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fitnessAerobic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            {t("training.form.fitness.aerobicLabel")}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.fitness.aerobicPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fitnessStrength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Dumbbell className="h-4 w-4" />
                            {t("training.form.fitness.strengthLabel")}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.fitness.strengthPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fitnessEndurance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Timer className="h-4 w-4" />
                            {t("training.form.fitness.enduranceLabel")}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.fitness.endurancePlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fitnessTests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            {t("training.form.fitness.testsLabel")}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.fitness.testsPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fitnessRecovery"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.fitness.recoveryLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.fitness.recoveryPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fitnessTapering"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.fitness.taperingLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.fitness.taperingPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fitnessWarmUp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.fitness.warmupLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.fitness.warmupPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fitnessCoolDown"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.fitness.cooldownLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.fitness.cooldownPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fitnessFlexibility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.fitness.flexibilityLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.fitness.flexibilityPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fitnessAgility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.fitness.agilityLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.fitness.agilityPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fitnessSpeed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.fitness.speedLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.fitness.speedPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fitnessPower"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.fitness.powerLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.fitness.powerPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="fitnessOther"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("training.form.fitness.otherLabel")}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("training.form.fitness.otherPlaceholder")}
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Fitness Section Image Upload */}
                  <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      {t("training.form.fitnessImageTitle")}
                    </h3>
                    <TrainingImageUpload
                      value={
                        form.watch("fitnessImageUrl") ? {
                          url: form.watch("fitnessImageUrl") || "",
                          type: form.watch("fitnessImageType") || "",
                          name: form.watch("fitnessImageName") || ""
                        } : undefined
                      }
                      onChange={(value) => {
                        form.setValue("fitnessImageUrl", value.url);
                        form.setValue("fitnessImageType", value.type);
                        form.setValue("fitnessImageName", value.name);
                      }}
                    />
                  </div>
                </TabsContent>

                {/* Main Part Section */}
                <TabsContent value="main" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mainTechnical"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.main.technicalLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.main.technicalPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mainTactical"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.main.tacticalLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.main.tacticalPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mainMatchPrep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.main.matchPrepLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.main.matchPrepPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mainPossession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.main.possessionLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.main.possessionPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mainTransition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.main.transitionLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.main.transitionPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mainSetPieces"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.main.setPiecesLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.main.setPiecesPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                    <FormField
                      control={form.control}
                      name="mainFinishing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.main.finishingLabel")}</FormLabel>
                          <FormControl>
                          <Textarea
                            placeholder={t("training.form.main.finishingPlaceholder")}
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Goalkeeper Section */}
                <TabsContent value="goalkeeper" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gkHandling"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.gk.handlingLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.gk.handlingPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gkShotStopping"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.gk.shotStoppingLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.gk.shotStoppingPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gkDistribution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.gk.distributionLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.gk.distributionPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gkFootwork"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.gk.footworkLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.gk.footworkPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gkCrossing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.gk.crossingLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.gk.crossingPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gkOneOnOne"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.gk.oneOnOneLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.gk.oneOnOnePlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gkCommunication"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.gk.communicationLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.gk.communicationPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gkPositioning"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.gk.positioningLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.gk.positioningPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gkReactions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.gk.reactionsLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.gk.reactionsPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gkDiving"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.gk.divingLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.gk.divingPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gkThrowing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.gk.throwingLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.gk.throwingPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gkKicking"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.gk.kickingLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.gk.kickingPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Goalkeeper Section Image Upload */}
                  <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {t("training.form.goalkeepingImageTitle")}
                    </h3>
                    <TrainingImageUpload
                      value={
                        form.watch("goalkeepingImageUrl") ? {
                          url: form.watch("goalkeepingImageUrl") || "",
                          type: form.watch("goalkeepingImageType") || "",
                          name: form.watch("goalkeepingImageName") || ""
                        } : undefined
                      }
                      onChange={(value) => {
                        form.setValue("goalkeepingImageUrl", value.url);
                        form.setValue("goalkeepingImageType", value.type);
                        form.setValue("goalkeepingImageName", value.name);
                      }}
                    />
                  </div>
                </TabsContent>

                {/* Specific Work Section */}
                <TabsContent value="specific" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="specificIndividual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.specific.individualLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.specific.individualPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specificPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.specific.positionLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.specific.positionPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specificInjuryPrev"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.specific.injuryPrevLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.specific.injuryPrevPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specificRehab"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.specific.rehabLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.specific.rehabPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specificYouth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.specific.youthLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.specific.youthPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specificCondition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.specific.conditionLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.specific.conditionPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specificFinishing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.specific.finishingLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.specific.finishingPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specificCrossing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.specific.crossingLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.specific.crossingPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specificDefending"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.specific.defendingLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.specific.defendingPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specificPressing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.specific.pressingLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.specific.pressingPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specificCounterAttack"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.specific.counterAttackLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.specific.counterAttackPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specificMental"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("training.form.specific.mentalLabel")}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t("training.form.specific.mentalPlaceholder")}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Specific Work Section Image Upload */}
                  <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      {t("training.form.specificImageTitle")}
                    </h3>
                    <TrainingImageUpload
                      value={
                        form.watch("specificWorkImageUrl") ? {
                          url: form.watch("specificWorkImageUrl") || "",
                          type: form.watch("specificWorkImageType") || "",
                          name: form.watch("specificWorkImageName") || ""
                        } : undefined
                      }
                      onChange={(value) => {
                        form.setValue("specificWorkImageUrl", value.url);
                        form.setValue("specificWorkImageType", value.type);
                        form.setValue("specificWorkImageName", value.name);
                      }}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
                <CardTitle>{t("training.additionalNotes")}</CardTitle>
              </CardHeader>
            <CardContent className="p-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("training.form.notesLabel")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("training.form.notesPlaceholder")}
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={isSubmitting} className="min-w-32">
              {isSubmitting ? t("training.form.submit.saving") : isEditing ? t("training.form.submit.update") : t("training.form.submit.create")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}