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
import { insertTrainingSessionSchema, type TrainingSession } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
}

export default function TrainingForm({ session, onSuccess }: TrainingFormProps) {
  const { toast } = useToast();
  const isEditing = !!session;

  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
  });

  const form = useForm({
    resolver: zodResolver(insertTrainingSessionSchema),
    defaultValues: {
      title: session?.title || "",
      description: session?.description || "",
      sessionType: session?.sessionType || "",
      date: session?.date || "",
      startTime: session?.startTime || "",
      duration: session?.duration || 90,
      location: session?.location || "",
      teamId: session?.teamId || 1,
      coachId: session?.coachId || 1,
      maxParticipants: session?.maxParticipants || undefined,
      
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

  const createSessionMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("POST", "/api/training-sessions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-sessions"] });
      toast({
        title: "Success",
        description: "Training session created successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create training session",
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
        title: "Success",
        description: "Training session updated successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update training session",
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
    <div className="max-w-6xl mx-auto p-6 space-y-6 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {isEditing ? "Edit Training Session" : "Create New Training Session"}
          </h2>
          <p className="text-muted-foreground">
            Design a comprehensive training session with structured sections
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Set the fundamental details for your training session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Pre-Season Fitness" {...field} />
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
                      <FormLabel>Session Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fitness">Fitness</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="tactical">Tactical</SelectItem>
                          <SelectItem value="match_prep">Match Preparation</SelectItem>
                          <SelectItem value="recovery">Recovery</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
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
                      <FormLabel>Start Time</FormLabel>
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
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min="30" max="180" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Training ground" {...field} />
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
                      <FormLabel>Max Participants</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief overview of the session objectives..."
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
                      url: form.watch("trainingImageUrl"),
                      type: form.watch("trainingImageType"),
                      name: form.watch("trainingImageName")
                    } : undefined
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Training Sections */}
          <Card>
            <CardHeader>
              <CardTitle>Training Structure</CardTitle>
              <CardDescription>
                Design your training session with detailed sections for comprehensive planning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="fitness" className="w-full" orientation="horizontal">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="fitness" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Fitness
                  </TabsTrigger>
                  <TabsTrigger value="main" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Main Part
                  </TabsTrigger>
                  <TabsTrigger value="goalkeeper" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Goalkeeper
                  </TabsTrigger>
                  <TabsTrigger value="specific" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Specific Work
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
                            Aerobic Training
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Aerobic exercises, running drills, cardio work..."
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
                            Strength Training
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Strength exercises, weight training, resistance work..."
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
                            Endurance Training
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Endurance drills, stamina building, long runs..."
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
                            Fitness Tests
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Fitness assessments, benchmark tests, measurements..."
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
                          <FormLabel>Recovery Work</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Cool down, stretching, recovery exercises..."
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
                          <FormLabel>Tapering</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Tapering protocols, load reduction..."
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
                          <FormLabel>Warm-Up</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Dynamic warm-up, activation exercises..."
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
                          <FormLabel>Cool-Down</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Static stretching, cool-down routine..."
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
                          <FormLabel>Flexibility</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Flexibility training, mobility work..."
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
                          <FormLabel>Agility</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Agility ladders, cone drills, quick feet..."
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
                          <FormLabel>Speed</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Sprint work, acceleration drills..."
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
                          <FormLabel>Power</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Plyometric exercises, explosive movements..."
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
                        <FormLabel>Other Fitness Activities</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional fitness work, specialized training..."
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
                      Fitness Training Image
                    </h3>
                    <TrainingImageUpload
                      value={{
                        url: form.watch("fitnessImageUrl"),
                        type: form.watch("fitnessImageType") as "library" | "upload" | "created" | undefined,
                        name: form.watch("fitnessImageName")
                      }}
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
                          <FormLabel>Technical Training</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Ball control, passing, shooting technique..."
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
                          <FormLabel>Tactical Training</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Formation work, positioning, tactical awareness..."
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
                          <FormLabel>Match Preparation</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Opposition analysis, match scenarios..."
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
                          <FormLabel>Possession Training</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Possession drills, ball retention, build-up play..."
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
                          <FormLabel>Transition Training</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Attack to defense transitions, counter-attacks..."
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
                          <FormLabel>Set Pieces</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Corners, free kicks, throw-ins..."
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
                        <FormLabel>Finishing Training</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Goal scoring practice, shooting drills..."
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
                          <FormLabel>Handling Exercises</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Catching, handling under pressure, ball security..."
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
                          <FormLabel>Shot Stopping</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Reaction saves, diving, reflexes..."
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
                          <FormLabel>Distribution</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Throwing, kicking, passing accuracy..."
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
                          <FormLabel>Footwork & Positioning</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Positioning, footwork drills, angles..."
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
                          <FormLabel>Dealing with Crosses</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="High balls, claiming crosses, command of area..."
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
                          <FormLabel>1v1 Situations</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="One-on-one scenarios, narrowing angles..."
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
                          <FormLabel>Communication</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Vocal leadership, organizing defense, calling plays..."
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
                          <FormLabel>Positioning</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Goal line positioning, reading the game..."
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
                          <FormLabel>Reactions</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Reaction time training, reflex exercises..."
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
                          <FormLabel>Diving Techniques</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Diving form, low dives, high dives..."
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
                          <FormLabel>Throwing</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Overarm throws, underarm rolls, accuracy..."
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
                          <FormLabel>Kicking</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Goal kicks, punts, drop kicks, accuracy..."
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
                      Goalkeeper Training Image
                    </h3>
                    <TrainingImageUpload
                      value={{
                        url: form.watch("goalkeepingImageUrl"),
                        type: form.watch("goalkeepingImageType") as "library" | "upload" | "created" | undefined,
                        name: form.watch("goalkeepingImageName")
                      }}
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
                          <FormLabel>Individual Work</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Player-specific training, individual development..."
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
                          <FormLabel>Position-Specific Training</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Defender, midfielder, forward specific work..."
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
                          <FormLabel>Injury Prevention</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Injury prevention exercises, prehab..."
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
                          <FormLabel>Rehabilitation</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Recovery training, return to play protocols..."
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
                          <FormLabel>Youth Development</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Age-specific training, skill development..."
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
                          <FormLabel>Conditioning</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Specialized conditioning, sport-specific fitness..."
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
                          <FormLabel>Finishing</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Finishing drills, clinical finishing, composure..."
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
                          <FormLabel>Crossing</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Crossing technique, delivery, timing..."
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
                          <FormLabel>Defending</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Defensive shape, tackling, marking..."
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
                          <FormLabel>Pressing</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="High press, coordinated pressing, triggers..."
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
                          <FormLabel>Counter Attack</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Quick transitions, fast breaks, counter-attacking..."
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
                          <FormLabel>Mental Training</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Concentration, decision making, pressure situations..."
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
                      Specific Work Training Image
                    </h3>
                    <TrainingImageUpload
                      value={{
                        url: form.watch("specificWorkImageUrl"),
                        type: form.watch("specificWorkImageType") as "library" | "upload" | "created" | undefined,
                        name: form.watch("specificWorkImageName")
                      }}
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
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes, equipment needed, special considerations..."
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
              {isSubmitting ? "Saving..." : isEditing ? "Update Session" : "Create Session"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}