import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertPlayerSchema, type Player, type Team } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface PlayerFormProps {
  player?: Player;
  onSuccess: () => void;
}

export default function PlayerForm({ player, onSuccess }: PlayerFormProps) {
  const { toast } = useToast();
  const isEditing = !!player;
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

  // Fetch available teams for assignment
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const form = useForm({
    resolver: zodResolver(insertPlayerSchema),
    defaultValues: {
      firstName: player?.firstName || "",
      lastName: player?.lastName || "",
      position: player?.position || "",
      shirtNumber: player?.shirtNumber || undefined,
      dateOfBirth: player?.dateOfBirth || "",
      height: player?.height || undefined,
      weight: player?.weight || undefined,
      nationality: player?.nationality || "",
      phoneNumber: player?.phoneNumber || "",
      email: player?.email || "",
      emergencyContact: player?.emergencyContact || "",
      medicalNotes: player?.medicalNotes || "",
      isActive: player?.isActive ?? true,
    },
  });

  const createPlayerMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("POST", "/api/players", data),
    onSuccess: async (newPlayer) => {
      // If a team is selected, add the player to that team
      if (selectedTeam) {
        try {
          await apiRequest("POST", `/api/teams/${selectedTeam}/players/${newPlayer.id}`, {});
          queryClient.invalidateQueries({ queryKey: [`/api/teams/${selectedTeam}/players`] });
          toast({
            title: "Success",
            description: "Player created and added to team successfully",
          });
        } catch (error) {
          toast({
            title: "Warning",
            description: "Player created but failed to add to team",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Success",
          description: "Player created successfully",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create player",
        variant: "destructive",
      });
    },
  });

  const updatePlayerMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest("PUT", `/api/players/${player!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Success",
        description: "Player updated successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update player",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    // Convert empty strings to null for optional fields
    const cleanedData = {
      ...data,
      shirtNumber: data.shirtNumber || null,
      height: data.height || null,
      weight: data.weight || null,
      phoneNumber: data.phoneNumber || null,
      email: data.email || null,
      emergencyContact: data.emergencyContact || null,
      medicalNotes: data.medicalNotes || null,
    };

    if (isEditing) {
      updatePlayerMutation.mutate(cleanedData);
    } else {
      createPlayerMutation.mutate(cleanedData);
    }
  };

  const isPending = createPlayerMutation.isPending || updatePlayerMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="form-field">
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} className="form-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem className="form-field">
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} className="form-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Team Assignment Section - Only show when creating new player */}
        {!isEditing && (
          <div className="form-field">
            <FormLabel>Assign to Team (Optional)</FormLabel>
            <Select onValueChange={(value) => setSelectedTeam(value === "none" ? null : parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select team to assign player" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No team assignment</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name} ({team.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem className="form-field">
                <FormLabel>Position</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                    <SelectItem value="defender">Defender</SelectItem>
                    <SelectItem value="midfielder">Midfielder</SelectItem>
                    <SelectItem value="forward">Forward</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shirtNumber"
            render={({ field }) => (
              <FormItem className="form-field">
                <FormLabel>Shirt Number</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min={1} 
                    max={99}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="form-input" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem className="form-field">
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input {...field} type="date" className="form-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem className="form-field">
                <FormLabel>Height (cm)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min={100} 
                    max={250}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="form-input" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem className="form-field">
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min={30} 
                    max={150}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="form-input" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="nationality"
          render={({ field }) => (
            <FormItem className="form-field">
              <FormLabel>Nationality</FormLabel>
              <FormControl>
                <Input {...field} className="form-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem className="form-field">
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" className="form-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="form-field">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" className="form-input" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="emergencyContact"
          render={({ field }) => (
            <FormItem className="form-field">
              <FormLabel>Emergency Contact</FormLabel>
              <FormControl>
                <Input {...field} className="form-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="medicalNotes"
          render={({ field }) => (
            <FormItem className="form-field">
              <FormLabel>Medical Notes</FormLabel>
              <FormControl>
                <Textarea {...field} className="form-input" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} className="action-button">
            {isPending ? "Saving..." : isEditing ? "Update Player" : "Create Player"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
