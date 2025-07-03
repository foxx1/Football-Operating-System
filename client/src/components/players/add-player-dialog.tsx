import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPlayerSchema, type Player } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPlayer?: Player | null;
}

const formSchema = insertPlayerSchema;

type FormData = z.infer<typeof formSchema>;

export default function AddPlayerDialog({ open, onOpenChange, editingPlayer }: AddPlayerDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currency } = useSettings();

  // Helper function to get currency symbol
  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥',
      SAR: 'SR', QAR: 'QR', AED: 'AED', OMR: 'OMR',
      KWD: 'KD', BHD: 'BD'
    };
    return symbols[currency] || currency;
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Calculate total contract value
  const calculateContractTotal = (startDate: string, endDate: string, monthlySalary: number) => {
    if (!startDate || !endDate || !monthlySalary) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
    
    return months > 0 ? months * monthlySalary : 0;
  };
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: editingPlayer ? {
      firstName: editingPlayer.firstName || "",
      lastName: editingPlayer.lastName || "",
      position: editingPlayer.position || "midfielder",
      nationality: editingPlayer.nationality || "",
      dateOfBirth: editingPlayer.dateOfBirth || "",
      email: editingPlayer.email || "",
      phoneNumber: editingPlayer.phoneNumber || "",
      shirtNumber: editingPlayer.shirtNumber || undefined,
      height: editingPlayer.height || undefined,
      weight: editingPlayer.weight || undefined,
      emergencyContact: editingPlayer.emergencyContact || "",
      idNumber: editingPlayer.idNumber || "",
      passportNumber: editingPlayer.passportNumber || "",
      passportIssueDate: editingPlayer.passportIssueDate || "",
      passportExpiryDate: editingPlayer.passportExpiryDate || "",
      medicalNotes: editingPlayer.medicalNotes || "",
      profilePicture: editingPlayer.profilePicture || "",
      idDocument: editingPlayer.idDocument || "",
      contractDocument: editingPlayer.contractDocument || "",
      contractStartDate: editingPlayer.contractStartDate || "",
      contractEndDate: editingPlayer.contractEndDate || "",
      monthlySalary: editingPlayer.monthlySalary || "",
      isActive: editingPlayer.isActive || true,
    } : {
      firstName: "",
      lastName: "",
      position: "midfielder",
      nationality: "",
      dateOfBirth: "",
      email: "",
      phoneNumber: "",
      shirtNumber: undefined,
      height: undefined,
      weight: undefined,
      emergencyContact: "",
      idNumber: "",
      passportNumber: "",
      passportIssueDate: "",
      passportExpiryDate: "",
      medicalNotes: "",
      profilePicture: "",
      idDocument: "",
      contractDocument: "",
      contractStartDate: "",
      contractEndDate: "",
      monthlySalary: "",
      isActive: true,
    },
  });

  // Reset form when editing player changes
  useEffect(() => {
    if (editingPlayer) {
      form.reset({
        firstName: editingPlayer.firstName || "",
        lastName: editingPlayer.lastName || "",
        position: editingPlayer.position || "midfielder",
        nationality: editingPlayer.nationality || "",
        dateOfBirth: editingPlayer.dateOfBirth || "",
        email: editingPlayer.email || "",
        phoneNumber: editingPlayer.phoneNumber || "",
        shirtNumber: editingPlayer.shirtNumber || undefined,
        height: editingPlayer.height || undefined,
        weight: editingPlayer.weight || undefined,
        emergencyContact: editingPlayer.emergencyContact || "",
        idNumber: editingPlayer.idNumber || "",
        passportNumber: editingPlayer.passportNumber || "",
        passportIssueDate: editingPlayer.passportIssueDate || "",
        passportExpiryDate: editingPlayer.passportExpiryDate || "",
        medicalNotes: editingPlayer.medicalNotes || "",
        profilePicture: editingPlayer.profilePicture || "",
        idDocument: editingPlayer.idDocument || "",
        contractDocument: editingPlayer.contractDocument || "",
        contractStartDate: editingPlayer.contractStartDate || "",
        contractEndDate: editingPlayer.contractEndDate || "",
        monthlySalary: editingPlayer.monthlySalary || "",
        isActive: editingPlayer.isActive || true,
      });
    }
  }, [editingPlayer, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Clean up the data to handle empty strings and null values
      const playerData = {
        ...data,
        email: data.email || null,
        phoneNumber: data.phoneNumber || null,
        emergencyContact: data.emergencyContact || null,
        idNumber: data.idNumber || null,
        passportNumber: data.passportNumber || null,
        passportIssueDate: data.passportIssueDate || null,
        passportExpiryDate: data.passportExpiryDate || null,
        medicalNotes: data.medicalNotes || null,
        profilePicture: data.profilePicture || null,
        idDocument: data.idDocument || null,
        contractDocument: data.contractDocument || null,
        contractStartDate: data.contractStartDate || null,
        contractEndDate: data.contractEndDate || null,
        monthlySalary: data.monthlySalary || null,
        shirtNumber: data.shirtNumber || null,
        height: data.height || null,
        weight: data.weight || null,
      };

      if (editingPlayer) {
        return apiRequest(`/api/players/${editingPlayer.id}`, {
          method: "PATCH",
          body: JSON.stringify(playerData),
        });
      } else {
        return apiRequest("/api/players", {
          method: "POST",
          body: JSON.stringify(playerData),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: editingPlayer ? "Player updated" : "Player added",
        description: editingPlayer ? "Player has been updated successfully." : "New player has been added to the team.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPlayer ? "Edit Player" : "Add New Player"}</DialogTitle>
        </DialogHeader>

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

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} value={field.value || ""} />
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ID Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">ID Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>National ID Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter ID number" {...field} value={field.value || ""} />
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
                        <Input placeholder="Enter passport number" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Passport Dates */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="passportIssueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passport Issue Date</FormLabel>
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
                      <FormLabel>Passport Expiry Date</FormLabel>
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
            </div>

            {/* Player Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
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
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter nationality" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Age Display */}
            {form.watch("dateOfBirth") && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <span className="text-sm text-gray-600">
                  Current Age: <span className="font-medium">{calculateAge(form.watch("dateOfBirth"))} years old</span>
                </span>
              </div>
            )}

            {/* Physical Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="shirtNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shirt Number</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="99" placeholder="Number" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Height" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Weight" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="emergencyContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact</FormLabel>
                    <FormControl>
                      <Input placeholder="Emergency contact details" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="medicalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any medical conditions, allergies, or notes" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contract Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contract Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contractStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Start Date</FormLabel>
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
                      <FormLabel>Contract End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="monthlySalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Salary ({getCurrencySymbol(currency)})</FormLabel>
                    <FormControl>
                      <Input className="max-w-xs" type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contract Total Calculation */}
              {form.watch("contractStartDate") && form.watch("contractEndDate") && form.watch("monthlySalary") && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Contract Summary</h4>
                  <div className="text-sm text-green-700">
                    Total Contract Value: <span className="font-medium">{getCurrencySymbol(currency)}{calculateContractTotal(form.watch("contractStartDate"), form.watch("contractEndDate"), parseFloat(form.watch("monthlySalary") || "0")).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Document Uploads */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="profilePicture"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Picture</FormLabel>
                      <FormControl>
                        <FileUpload
                          value={field.value}
                          onChange={field.onChange}
                          accept="image/*"
                          description="Upload profile photo"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="idDocument"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Document</FormLabel>
                      <FormControl>
                        <FileUpload
                          value={field.value}
                          onChange={field.onChange}
                          accept="image/*,.pdf"
                          description="Upload ID copy"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contractDocument"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Document</FormLabel>
                      <FormControl>
                        <FileUpload
                          value={field.value}
                          onChange={field.onChange}
                          accept=".pdf,.doc,.docx"
                          description="Upload signed contract"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending 
                  ? (editingPlayer ? "Updating..." : "Adding...") 
                  : (editingPlayer ? "Update Player" : "Add Player")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}