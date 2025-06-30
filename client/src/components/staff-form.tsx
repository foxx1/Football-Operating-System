import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertStaffSchema, type Staff } from "@shared/schema";
import { z } from "zod";

const staffFormSchema = insertStaffSchema.extend({
  phoneNumber: z.string().optional(),
  salary: z.coerce.number().optional(),
  qualifications: z.string().optional(),
  emergencyContact: z.string().optional(),
});

type StaffFormData = z.infer<typeof staffFormSchema>;

interface StaffFormProps {
  staff?: Staff;
  onSuccess: () => void;
}

export default function StaffForm({ staff, onSuccess }: StaffFormProps) {
  const { toast } = useToast();

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      firstName: staff?.firstName || "",
      lastName: staff?.lastName || "",
      email: staff?.email || "",
      phoneNumber: staff?.phoneNumber || "",
      role: staff?.role || "",
      department: staff?.department || "",
      employmentType: staff?.employmentType || "",
      startDate: staff?.startDate || "",
      salary: staff?.salary || undefined,
      qualifications: staff?.qualifications || "",
      emergencyContact: staff?.emergencyContact || "",
      isActive: staff?.isActive ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: StaffFormData) => apiRequest("POST", "/api/staff", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Success",
        description: "Staff member created successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create staff member",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: StaffFormData) => apiRequest("PATCH", `/api/staff/${staff!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Success",
        description: "Staff member updated successfully",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update staff member",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StaffFormData) => {
    if (staff) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            {...form.register("firstName")}
            placeholder="John"
          />
          {form.formState.errors.firstName && (
            <p className="text-sm text-red-600">{form.formState.errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            {...form.register("lastName")}
            placeholder="Smith"
          />
          {form.formState.errors.lastName && (
            <p className="text-sm text-red-600">{form.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
          placeholder="john.smith@team.com"
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          {...form.register("phoneNumber")}
          placeholder="+1234567890"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={form.watch("role")} onValueChange={(value) => form.setValue("role", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
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
          {form.formState.errors.role && (
            <p className="text-sm text-red-600">{form.formState.errors.role.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Department</Label>
          <Select value={form.watch("department")} onValueChange={(value) => form.setValue("department", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coaching">Coaching</SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="analysis">Analysis</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.department && (
            <p className="text-sm text-red-600">{form.formState.errors.department.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Employment Type</Label>
          <Select value={form.watch("employmentType")} onValueChange={(value) => form.setValue("employmentType", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select employment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="volunteer">Volunteer</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.employmentType && (
            <p className="text-sm text-red-600">{form.formState.errors.employmentType.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            {...form.register("startDate")}
          />
          {form.formState.errors.startDate && (
            <p className="text-sm text-red-600">{form.formState.errors.startDate.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="salary">Monthly Salary ($)</Label>
        <Input
          id="salary"
          type="number"
          {...form.register("salary")}
          placeholder="5000"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="qualifications">Qualifications & Experience</Label>
        <Textarea
          id="qualifications"
          {...form.register("qualifications")}
          placeholder="UEFA licenses, coaching experience, certifications..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="emergencyContact">Emergency Contact</Label>
        <Input
          id="emergencyContact"
          {...form.register("emergencyContact")}
          placeholder="Emergency contact details"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : staff ? "Update Staff" : "Add Staff"}
        </Button>
      </div>
    </form>
  );
}