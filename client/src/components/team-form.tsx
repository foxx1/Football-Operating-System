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
import type { Team } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
import { cn } from "@/lib/utils";

const teamFormSchema = insertTeamSchema.extend({
  name: z.string().min(1, "Team name is required"),
  category: z.string().min(1, "Please select a team category"),
  customCategory: z.string().optional(),
  description: z.string().optional(),
}).refine((data) => {
  if (data.category === "custom" && !data.customCategory?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Custom category name is required when using custom category",
  path: ["customCategory"],
});

type TeamFormData = z.infer<typeof teamFormSchema>;

interface TeamFormProps {
  team?: Team;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TeamForm({ team, onSuccess, onCancel }: TeamFormProps) {
  const isEditing = !!team;
  const { toast } = useToast();
  const { isRtl, t } = useI18n();
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: team?.name ?? "",
      category: team?.category ?? "",
      customCategory: "",
      description: team?.description ?? "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: TeamFormData) => {
      const finalCategory = data.category === "custom" ? data.customCategory : data.category;
      const payload = { name: data.name, category: finalCategory, description: data.description };
      return isEditing
        ? apiRequest("PUT", `/api/teams/${team!.id}`, payload)
        : apiRequest("POST", "/api/teams", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: isEditing ? t("teamForm.updatedTitle") : t("teamForm.createdTitle"),
        description: isEditing ? t("teamForm.updatedDescription") : t("teamForm.createdDescription"),
      });
      if (!isEditing) {
        form.reset();
        setShowCustomCategory(false);
      }
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: t("teamForm.errorTitle"),
        description: error.message || t("teamForm.errorDescription"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TeamFormData) => {
    if (data.category === "custom" && !data.customCategory?.trim()) {
      form.setError("customCategory", { message: "Please enter a custom category name" });
      return;
    }
    if (data.category === "custom" && data.customCategory) {
      data.customCategory = data.customCategory.trim();
    }
    saveMutation.mutate(data);
  };

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'first_team':
        return {
          label: t("teamCategory.first_team"),
          description: 'Main competitive squad',
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'reserves':
        return {
          label: t("teamCategory.reserves"),
          description: 'Secondary squad and backup players',
          color: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'under_21':
        return {
          label: t("teamCategory.under_21"),
          description: 'Youth development - Under 21 years',
          color: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      case 'under_19':
        return {
          label: t("teamCategory.under_19"),
          description: 'Youth development - Under 19 years',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
        };
      case 'under_17':
        return {
          label: t("teamCategory.under_17"),
          description: 'Youth development - Under 17 years',
          color: 'bg-pink-100 text-pink-800 border-pink-200'
        };
      case 'under_15':
        return {
          label: t("teamCategory.under_15"),
          description: 'Youth development - Under 15 years',
          color: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      case 'academy_rootgrass':
        return {
          label: t("teamCategory.academy_rootgrass"),
          description: 'Academy grassroots development',
          color: 'bg-teal-100 text-teal-800 border-teal-200'
        };
      case 'youth':
        return {
          label: t("teamCategory.youth"),
          description: 'General youth development squad',
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
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t("teamForm.name")}</Label>
            <Input
              id="name"
              placeholder={t("teamForm.namePlaceholder")}
              {...form.register("name")}
              className={form.formState.errors.name ? "border-red-500" : ""}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Team Category */}
          <div className="space-y-2">
            <Label>{t("teamForm.category")}</Label>
            <Select
              value={form.watch("category")}
              onValueChange={(value) => {
                form.setValue("category", value);
                setShowCustomCategory(value === "custom");
                if (value !== "custom") {
                  form.setValue("customCategory", "");
                }
              }}
            >
              <SelectTrigger className={form.formState.errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder={t("teamForm.categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_team">
                  <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {t("teamCategory.first_team")}
                    </Badge>
                    <span className="text-sm text-gray-600">Main competitive squad</span>
                  </div>
                </SelectItem>
                <SelectItem value="reserves">
                  <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {t("teamCategory.reserves")}
                    </Badge>
                    <span className="text-sm text-gray-600">Secondary squad and backup players</span>
                  </div>
                </SelectItem>
                <SelectItem value="under_21">
                  <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      {t("teamCategory.under_21")}
                    </Badge>
                    <span className="text-sm text-gray-600">Youth development - Under 21 years</span>
                  </div>
                </SelectItem>
                <SelectItem value="under_19">
                  <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                    <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                      {t("teamCategory.under_19")}
                    </Badge>
                    <span className="text-sm text-gray-600">Youth development - Under 19 years</span>
                  </div>
                </SelectItem>
                <SelectItem value="under_17">
                  <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                    <Badge className="bg-pink-100 text-pink-800 border-pink-200">
                      {t("teamCategory.under_17")}
                    </Badge>
                    <span className="text-sm text-gray-600">Youth development - Under 17 years</span>
                  </div>
                </SelectItem>
                <SelectItem value="under_15">
                  <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      {t("teamCategory.under_15")}
                    </Badge>
                    <span className="text-sm text-gray-600">Youth development - Under 15 years</span>
                  </div>
                </SelectItem>
                <SelectItem value="academy_rootgrass">
                  <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                    <Badge className="bg-teal-100 text-teal-800 border-teal-200">
                      {t("teamCategory.academy_rootgrass")}
                    </Badge>
                    <span className="text-sm text-gray-600">Academy grassroots development</span>
                  </div>
                </SelectItem>
                <SelectItem value="youth">
                  <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                      {t("teamCategory.youth")}
                    </Badge>
                    <span className="text-sm text-gray-600">General youth development squad</span>
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                    <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                      {t("teamCategory.custom")}
                    </Badge>
                    <span className="text-sm text-gray-600">Define your own team category</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
            )}
          </div>

          {/* Custom Category Input */}
          {showCustomCategory && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className={cn("flex items-center", isRtl ? "space-x-reverse space-x-2" : "space-x-2")}>
                <Label htmlFor="customCategory" className="text-blue-800 font-medium">
                  {t("teamForm.customName")}
                </Label>
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                  {t("teamCategory.custom")}
                </Badge>
              </div>
              <Input
                id="customCategory"
                placeholder={t("teamForm.customPlaceholder")}
                {...form.register("customCategory")}
                className={`${form.formState.errors.customCategory ? "border-red-500" : "border-blue-300"} bg-white`}
                autoFocus
                maxLength={50}
              />
              {form.formState.errors.customCategory && (
                <p className="text-sm text-red-600">{form.formState.errors.customCategory.message}</p>
              )}
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-2">{t("teamForm.quickSelect")}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {["Under 13", "Under 11", "Under 9", "Women's Team", "Veterans", "Futsal Team", "Development Squad"].map((category) => (
                    <Button
                      key={category}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 text-blue-700 border-blue-300 hover:bg-blue-100"
                      onClick={() => {
                        form.setValue("customCategory", category);
                        form.clearErrors("customCategory");
                      }}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-blue-500">
                  {translateWithParams(t, "teamForm.characters", { count: String(form.watch("customCategory")?.length || 0) })}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("teamForm.description")}</Label>
            <Textarea
              id="description"
              placeholder={t("teamForm.descriptionPlaceholder")}
              rows={3}
              {...form.register("description")}
            />
            <p className="text-sm text-gray-500">{t("teamForm.descriptionHelp")}</p>
          </div>

          {/* Form Actions */}
          <div className={cn("flex justify-end pt-4", isRtl ? "space-x-reverse space-x-4" : "space-x-4")}>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={saveMutation.isPending}
              >
                {t("teamForm.cancel")}
              </Button>
            )}
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="min-w-[120px]"
            >
              {saveMutation.isPending
                ? (isEditing ? t("teamForm.updating") : t("teamForm.creating"))
                : (isEditing ? t("teamForm.update") : t("teams.create"))}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
