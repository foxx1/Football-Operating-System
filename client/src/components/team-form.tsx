import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { insertTeamSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const teamFormSchema = insertTeamSchema.extend({
  name: z.string().min(1, "Team name is required"),
  category: z.enum(["first_team", "reserves", "youth"], {
    required_error: "Please select a team category",
  }),
  description: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamFormSchema>;

interface TeamFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TeamForm({ onSuccess, onCancel }: TeamFormProps) {
  const { toast } = useToast();

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      category: undefined,
      description: "",
    },
  });

  const createTeamMutation = useMutation({
    mutationFn: (data: TeamFormData) => 
      apiRequest("POST", "/api/teams", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Success",
        description: "Team created successfully!",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TeamFormData) => {
    createTeamMutation.mutate(data);
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'first_team':
        return {
          label: 'First Team',
          description: 'Main competitive squad',
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'reserves':
        return {
          label: 'Reserve Team',
          description: 'Secondary squad and backup players',
          color: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'youth':
        return {
          label: 'Youth Team',
          description: 'Youth development squad',
          color: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      default:
        return {
          label: category,
          description: '',
          color: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Team</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Team Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Manchester United, Arsenal FC, Barcelona"
              {...form.register("name")}
              className={form.formState.errors.name ? "border-red-500" : ""}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Team Category */}
          <div className="space-y-2">
            <Label>Team Category *</Label>
            <Select
              value={form.watch("category")}
              onValueChange={(value) => form.setValue("category", value as any)}
            >
              <SelectTrigger className={form.formState.errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Select team category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_team">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      First Team
                    </Badge>
                    <span className="text-sm text-gray-600">Main competitive squad</span>
                  </div>
                </SelectItem>
                <SelectItem value="reserves">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Reserves
                    </Badge>
                    <span className="text-sm text-gray-600">Secondary squad and backup players</span>
                  </div>
                </SelectItem>
                <SelectItem value="youth">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                      Youth Team
                    </Badge>
                    <span className="text-sm text-gray-600">Youth development squad</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the team, objectives, or notes..."
              rows={3}
              {...form.register("description")}
            />
            <p className="text-sm text-gray-500">Optional: Add details about the team's purpose or objectives</p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={createTeamMutation.isPending}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={createTeamMutation.isPending}
              className="min-w-[120px]"
            >
              {createTeamMutation.isPending ? "Creating..." : "Create Team"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}