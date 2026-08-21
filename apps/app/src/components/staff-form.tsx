import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSettings, getCurrencySymbol } from "@/contexts/SettingsContext";
import { useI18n, translateWithParams } from "@/contexts/I18nContext";
import { insertStaffSchema, type Staff, type Team } from "@shared/schema";
import { FileUpload } from "@/components/ui/file-upload";
import { PhoneInput } from "@/components/ui/phone-input";
import { NationalitySelect } from "@/components/ui/nationality-select";
import { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";

const staffFormSchema = insertStaffSchema;

type StaffFormData = z.infer<typeof staffFormSchema>;

interface StaffFormProps {
  staff?: Staff;
  onSuccess: () => void;
}

export default function StaffForm({ staff, onSuccess }: StaffFormProps) {
  const { toast } = useToast();
  const { t } = useI18n();
  const { currency } = useSettings();
  const currencySymbol = getCurrencySymbol(currency);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const isEditing = !!staff;

  // Fetch available teams for assignment
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Helper function to calculate contract total value
  const calculateContractTotal = (startDate: string, endDate: string, monthlySalary: number) => {
    if (!startDate || !endDate || !monthlySalary) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month

    return months > 0 ? months * monthlySalary : 0;
  };

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      firstName: staff?.firstName || "",
      lastName: staff?.lastName || "",
      firstNameAr: staff?.firstNameAr || "",
      lastNameAr: staff?.lastNameAr || "",
      email: staff?.email || "",
      phoneNumber: staff?.phoneNumber || null,
      role: staff?.role || "",
      department: staff?.department || "",
      employmentType: staff?.employmentType || "",
      startDate: staff?.startDate || "",
      contractEndDate: staff?.contractEndDate || null,
      salary: staff?.salary || null,
      qualifications: staff?.qualifications || null,
      emergencyContact: staff?.emergencyContact || null,
      idNumber: staff?.idNumber || null,
      profilePicture: staff?.profilePicture || null,
      idDocument: staff?.idDocument || null,
      contractDocument: staff?.contractDocument || null,
      isActive: staff?.isActive ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: StaffFormData) => {
      // Clean up the data to handle empty strings and null values
      const staffData = {
        ...data,
        firstNameAr: data.firstNameAr || null,
        lastNameAr: data.lastNameAr || null,
        phoneNumber: data.phoneNumber || null,
        emergencyContact: data.emergencyContact || null,
        qualifications: data.qualifications || null,
        idNumber: data.idNumber || null,
        profilePicture: data.profilePicture || null,
        idDocument: data.idDocument || null,
        contractDocument: data.contractDocument || null,
        contractEndDate: data.contractEndDate || null,
        salary: data.salary || null,
      };

      if (staff) {
        return apiRequest("PATCH", `/api/staff/${staff.id}`, staffData);
      } else {
        return apiRequest("POST", "/api/staff", staffData);
      }
    },
    onSuccess: async (newStaff) => {
      // Handle team assignment for staff members
      if (selectedTeam && newStaff?.id) {
        try {
          await apiRequest("POST", "/api/staff-teams", {
            teamId: selectedTeam,
            staffId: (newStaff as any).id,
          });
          toast({
            title: staff ? t("staff.form.toast.updatedTitle") : t("staff.form.toast.addedTitle"),
            description: staff ? t("staff.form.toast.updatedDescription") : t("staff.form.toast.addedDescription"),
          });
        } catch (error) {
          toast({
            title: t("staff.form.toast.teamAssignWarningTitle"),
            description: t("staff.form.toast.teamAssignWarningDescription"),
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: staff ? t("staff.form.toast.updatedTitle") : t("staff.form.toast.addedTitle"),
          description: staff ? t("staff.form.toast.updatedDescription") : t("staff.form.toast.addedDescription"),
        });
      }
    },
    onError: () => {
      toast({
        title: t("staff.form.toast.errorTitle"),
        description: t("staff.form.toast.errorDescription"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StaffFormData) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("staff.form.firstName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("staff.form.firstNamePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("staff.form.lastName")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("staff.form.lastNamePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Arabic Name (optional, shown when Arabic is selected) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstNameAr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("staff.form.firstNameAr")}</FormLabel>
                <FormControl>
                  <Input dir="rtl" placeholder={t("staff.form.firstNameArPlaceholder")} {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastNameAr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("staff.form.lastNameAr")}</FormLabel>
                <FormControl>
                  <Input dir="rtl" placeholder={t("staff.form.lastNameArPlaceholder")} {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <p className="text-xs text-muted-foreground md:col-span-2">{t("staff.form.arabicNameHint")}</p>
        </div>

        {/* Team Assignment Section - Available for both creation and editing */}
        <div className="form-field">
          <FormLabel>{t("staff.form.teamAssignmentOptional")}</FormLabel>
          <Select
            value={selectedTeam ? selectedTeam.toString() : "none"}
            onValueChange={(value) => setSelectedTeam(value === "none" ? null : parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("staff.selectTeam")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("staff.form.noTeamAssignment")}</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.name} ({team.category})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("staff.form.email")}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder={t("staff.form.emailPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("staff.form.phone")}</FormLabel>
                <FormControl>
                  <PhoneInput
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder={t("staff.form.phonePlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Nationality */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("staff.form.nationality")}</FormLabel>
                <FormControl>
                  <NationalitySelect
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder={t("staff.form.nationalityPlaceholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div /> {/* Empty div to maintain grid layout */}
        </div>

        {/* ID Information */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="idNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("staff.form.idNumber")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("staff.form.idNumberPlaceholder")} {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="passportNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("staff.form.passportNumber")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("staff.form.passportNumberPlaceholder")} {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Passport Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="passportIssueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("staff.form.passportIssueDate")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="passportExpiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("staff.form.passportExpiryDate")}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Passport Expiry Calculation */}
        {form.watch("passportExpiryDate") && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">{t("staff.form.passportValidityTitle")}</h4>
            <div className="text-sm text-blue-700">
              {(() => {
                const expiryDateString = form.watch("passportExpiryDate");
                if (!expiryDateString) return null;

                const expiryDate = new Date(expiryDateString);
                const today = new Date();
                const diffTime = expiryDate.getTime() - today.getTime();

                if (diffTime < 0) {
                  return <span className="text-red-600 font-medium">{t("staff.form.passportExpired")}</span>;
                }

                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const years = Math.floor(diffDays / 365);
                const months = Math.floor((diffDays % 365) / 30);
                const days = diffDays % 30;

                let timeRemaining = "";
                if (years > 0) timeRemaining += `${years} year${years > 1 ? 's' : ''} `;
                if (months > 0) timeRemaining += `${months} month${months > 1 ? 's' : ''} `;
                if (days > 0) timeRemaining += `${days} day${days > 1 ? 's' : ''}`;

                if (diffDays <= 90) {
                  return <span className="text-orange-600 font-medium">{translateWithParams(t, "staff.form.passportExpiresSoon", { timeRemaining })}</span>;
                }

                return <span className="text-green-600 font-medium">{translateWithParams(t, "staff.form.passportValid", { timeRemaining })}</span>;
              })()}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="emergencyContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("staff.form.emergencyContact")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("staff.form.emergencyContactPlaceholder")} {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Role & Department */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("staff.form.role")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("staff.form.selectRole")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="head_coach">{t("staff.role.head_coach")}</SelectItem>
                    <SelectItem value="assistant_coach">{t("staff.role.assistant_coach")}</SelectItem>
                    <SelectItem value="fitness_coach">{t("staff.role.fitness_coach")}</SelectItem>
                    <SelectItem value="goalkeeping_coach">{t("staff.role.goalkeeping_coach")}</SelectItem>
                    <SelectItem value="physiotherapist">{t("staff.role.physiotherapist")}</SelectItem>
                    <SelectItem value="analyst">{t("staff.role.analyst")}</SelectItem>
                    <SelectItem value="kit_manager">{t("staff.role.kit_manager")}</SelectItem>
                    <SelectItem value="team_manager">{t("staff.role.team_manager")}</SelectItem>
                    <SelectItem value="team_administrative">{t("staff.role.team_administrative")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("staff.form.department")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("staff.form.selectDepartment")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="coaching">{t("staff.filterCoaching")}</SelectItem>
                    <SelectItem value="medical">{t("staff.filterMedical")}</SelectItem>
                    <SelectItem value="analysis">{t("staff.filterAnalysis")}</SelectItem>
                    <SelectItem value="operations">{t("staff.filterOperations")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Employment Information */}
        <FormField
          control={form.control}
          name="employmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("staff.form.employmentType")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("staff.form.selectEmploymentType")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="full_time">{t("staff.employmentType.full_time")}</SelectItem>
                  <SelectItem value="part_time">{t("staff.employmentType.part_time")}</SelectItem>
                  <SelectItem value="contract">{t("staff.employmentType.contract")}</SelectItem>
                  <SelectItem value="volunteer">{t("staff.employmentType.volunteer")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="qualifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("staff.form.qualifications")}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("staff.form.qualificationsPlaceholder")}
                  rows={3}
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contract Information */}
        <div className="col-span-2 space-y-6 border-t pt-6">
          <h3 className="text-lg font-semibold">{t("staff.form.contractInfo")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("staff.form.contractStartDate")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contractEndDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("staff.form.contractEndDate")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{`${t("staff.form.salary")} (${currencySymbol})`}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t("staff.form.salaryPlaceholder")}
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="pl-8"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        {currencySymbol}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Contract Validity Calculation */}
          {form.watch("contractEndDate") && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">{t("staff.form.contractValidityTitle")}</h4>
              <div className="text-sm text-blue-700">
                {(() => {
                  const expiryDateString = form.watch("contractEndDate");
                  if (!expiryDateString) return null;

                  const expiryDate = new Date(expiryDateString);
                  const today = new Date();
                  // Reset hours to compare dates only
                  expiryDate.setHours(0, 0, 0, 0);
                  today.setHours(0, 0, 0, 0);

                  const diffTime = expiryDate.getTime() - today.getTime();

                  if (diffTime < 0) {
                    return <span className="text-red-600 font-medium">{t("staff.form.contractExpired")}</span>;
                  }

                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const years = Math.floor(diffDays / 365);
                  const months = Math.floor((diffDays % 365) / 30);
                  const days = diffDays % 30;

                  let timeRemaining = "";
                  if (years > 0) timeRemaining += `${years} year${years > 1 ? 's' : ''} `;
                  if (months > 0) timeRemaining += `${months} month${months > 1 ? 's' : ''} `;
                  if (days > 0) timeRemaining += `${days} day${days > 1 ? 's' : ''}`;

                  if (diffDays <= 120) {
                    return <span className="text-orange-600 font-medium">{translateWithParams(t, "staff.form.contractExpiresSoon", { timeRemaining })}</span>;
                  }

                  return <span className="text-green-600 font-medium">{translateWithParams(t, "staff.form.contractValid", { timeRemaining })}</span>;
                })()}
              </div>
            </div>
          )}

          {/* Contract Total Calculation */}
          {form.watch("startDate") && form.watch("contractEndDate") && form.watch("salary") && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{t("staff.form.totalContractValue")}</span>
                <span className="text-lg font-bold text-primary">
                  {currencySymbol}{calculateContractTotal(
                    form.watch("startDate") || "",
                    form.watch("contractEndDate") || "",
                    form.watch("salary") || 0
                  ).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("staff.form.totalContractDescription")}
              </p>
            </div>
          )}
        </div>

        {/* File Upload Section */}
        <div className="col-span-2 space-y-6 border-t pt-6">
          <h3 className="text-lg font-semibold">{t("staff.form.documentsTitle")}</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Picture */}
            <FormField
              control={form.control}
              name="profilePicture"
              render={({ field }) => (
                <FormItem>
                  <FileUpload
                    label={t("staff.form.profilePicture")}
                    accept="image/*"
                    value={field.value || ""}
                    onChange={field.onChange}
                    description={t("staff.form.profilePictureDescription")}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ID Document */}
            <FormField
              control={form.control}
              name="idDocument"
              render={({ field }) => (
                <FormItem>
                  <FileUpload
                    label={t("staff.form.idDocument")}
                    accept="image/*,.pdf"
                    value={field.value || ""}
                    onChange={field.onChange}
                    description={t("staff.form.idDocumentDescription")}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contract Document */}
            <FormField
              control={form.control}
              name="contractDocument"
              render={({ field }) => (
                <FormItem>
                  <FileUpload
                    label={t("staff.form.contractDocument")}
                    accept=".pdf,image/*"
                    value={field.value || ""}
                    onChange={field.onChange}
                    description={t("staff.form.contractDocumentDescription")}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? t("staff.form.button.saving") : staff ? t("staff.form.button.updateStaff") : t("staff.form.button.addStaff")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
