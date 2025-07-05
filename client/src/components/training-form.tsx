import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertTrainingSessionSchema, type TrainingSession } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
      apiRequest("PUT", `/api/training-sessions/${session!.id}`, data),
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
    const cleanedData = {
      ...data,
      maxParticipants: data.maxParticipants || null,
      notes: data.notes || null,
      description: data.description || null,
    };

    if (isEditing) {
      updateSessionMutation.mutate(cleanedData);
    } else {
      createSessionMutation.mutate(cleanedData);
    }
  };

  const isPending = createSessionMutation.isPending || updateSessionMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
          
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="form-field">
                <FormLabel>Session Title</FormLabel>
                <FormControl>
                  <Input {...field} className="form-input" placeholder="e.g., Technical Skills Training" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sessionType"
              render={({ field }) => (
                <FormItem className="form-field">
                  <FormLabel>Session Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select session type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="tactical">Tactical</SelectItem>
                      <SelectItem value="match_prep">Match Preparation</SelectItem>
                      <SelectItem value="recovery">Recovery</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="form-field">
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="form-field">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} className="form-input" placeholder="Brief description of the training session..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Schedule & Location Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Schedule & Location</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="form-field">
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" className="form-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem className="form-field">
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input {...field} type="time" className="form-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem className="form-field">
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" className="form-input" placeholder="90" min="30" step="15" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem className="form-field">
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input {...field} className="form-input" placeholder="e.g., Main Training Ground, Gym A" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Team & Participants Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Team & Participants</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="teamId"
              render={({ field }) => (
                <FormItem className="form-field">
                  <FormLabel>Team</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teams.map((team: any) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxParticipants"
              render={({ field }) => (
                <FormItem className="form-field">
                  <FormLabel>Max Participants (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      min={1} 
                      max={50}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || null)}
                      className="form-input" 
                      placeholder="e.g., 25"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Additional Notes</h3>
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="form-field">
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea {...field} className="form-input" placeholder="Additional notes or instructions..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="action-button">
            {isPending ? "Saving..." : isEditing ? "Update Session" : "Create Session"}
          </Button>
        </div>
      </form>
    </Form>
  );
}