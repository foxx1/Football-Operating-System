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
import { insertStaffSchema, type Staff, type Team } from "@shared/schema";
import { FileUpload } from "@/components/ui/file-upload";
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
      // If creating new staff and a team is selected, handle team assignment here if needed
      // Note: Staff usually aren't assigned to specific teams like players are
      if (!staff && selectedTeam) {
        toast({
          title: "Staff member created successfully",
          description: `Staff member added and associated with selected team.`,
        });
      } else {
        toast({
          title: "Staff member saved successfully",
          description: staff ? "Staff member has been updated." : "New staff member has been added.",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      form.reset();
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save staff member. Please try again.",
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
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter first name" {...field} />
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
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Team Assignment Section - Only show when creating new staff */}
        {!isEditing && (
          <div className="form-field">
            <FormLabel>Assign to Team (Optional)</FormLabel>
            <Select onValueChange={(value) => setSelectedTeam(value ? parseInt(value) : null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select team to assign staff member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No team assignment</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name} ({team.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Contact Information */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email" {...field} />
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
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ID Information */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="idNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>National ID Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter ID number" {...field} />
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
                <FormLabel>Passport Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter passport number" {...field} />
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
                <FormLabel>Passport Issue Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
                <FormLabel>Passport Expiry Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Passport Expiry Calculation */}
        {form.watch("passportExpiryDate") && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Passport Validity</h4>
            <div className="text-sm text-blue-700">
              {(() => {
                const expiryDateString = form.watch("passportExpiryDate");
                if (!expiryDateString) return null;
                
                const expiryDate = new Date(expiryDateString);
                const today = new Date();
                const diffTime = expiryDate.getTime() - today.getTime();
                
                if (diffTime < 0) {
                  return <span className="text-red-600 font-medium">⚠️ Passport has expired!</span>;
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
                  return <span className="text-orange-600 font-medium">⚠️ Expires in {timeRemaining} - Renewal needed soon!</span>;
                }
                
                return <span className="text-green-600 font-medium">✅ Valid for {timeRemaining}</span>;
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
                <FormLabel>Emergency Contact</FormLabel>
                <FormControl>
                  <Input placeholder="Emergency contact details" {...field} />
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
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="head_coach">Head Coach</SelectItem>
                    <SelectItem value="assistant_coach">Assistant Coach</SelectItem>
                    <SelectItem value="fitness_coach">Fitness Coach</SelectItem>
                    <SelectItem value="goalkeeping_coach">Goalkeeping Coach</SelectItem>
                    <SelectItem value="physiotherapist">Physiotherapist</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="kit_manager">Kit Manager</SelectItem>
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
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="coaching">Coaching</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="analysis">Analysis</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
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
              <FormLabel>Employment Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
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
              <FormLabel>Qualifications & Experience</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="UEFA licenses, coaching experience, certifications..." 
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contract Information */}
        <div className="col-span-2 space-y-6 border-t pt-6">
          <h3 className="text-lg font-semibold">Contract Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Contract End Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Monthly Salary ({currencySymbol})</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
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
          
          {/* Contract Total Calculation */}
          {form.watch("startDate") && form.watch("contractEndDate") && form.watch("salary") && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Contract Value:</span>
                <span className="text-lg font-bold text-primary">
                  {currencySymbol}{calculateContractTotal(
                    form.watch("startDate") || "",
                    form.watch("contractEndDate") || "",
                    form.watch("salary") || 0
                  ).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Calculated based on contract duration and monthly salary
              </p>
            </div>
          )}
        </div>

        {/* File Upload Section */}
        <div className="col-span-2 space-y-6 border-t pt-6">
          <h3 className="text-lg font-semibold">Documents & Photos</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Picture */}
            <FormField
              control={form.control}
              name="profilePicture"
              render={({ field }) => (
                <FormItem>
                  <FileUpload
                    label="Profile Picture"
                    accept="image/*"
                    value={field.value || ""}
                    onChange={field.onChange}
                    description="Upload staff profile photo (JPG, PNG)"
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
                    label="ID/Passport Copy"
                    accept="image/*,.pdf"
                    value={field.value || ""}
                    onChange={field.onChange}
                    description="Upload ID or passport copy"
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
                    label="Contract"
                    accept=".pdf,image/*"
                    value={field.value || ""}
                    onChange={field.onChange}
                    description="Upload signed contract"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : staff ? "Update Staff" : "Add Staff"}
          </Button>
        </div>
      </form>
    </Form>
  );
}