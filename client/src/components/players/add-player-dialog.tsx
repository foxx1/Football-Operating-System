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
      medicalNotes: editingPlayer.medicalNotes || "",
      profilePicture: editingPlayer.profilePicture || "",
      idDocument: editingPlayer.idDocument || "",
      contractDocument: editingPlayer.contractDocument || "",
      contractStartDate: editingPlayer.contractStartDate || "",
      contractEndDate: editingPlayer.contractEndDate || "",
      monthlySalary: editingPlayer.monthlySalary || "",
      isActive: editingPlayer.isActive ?? true,
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

  // Reset form when editingPlayer changes
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
        medicalNotes: editingPlayer.medicalNotes || "",
        profilePicture: editingPlayer.profilePicture || "",
        idDocument: editingPlayer.idDocument || "",
        contractDocument: editingPlayer.contractDocument || "",
        contractStartDate: editingPlayer.contractStartDate || "",
        contractEndDate: editingPlayer.contractEndDate || "",
        monthlySalary: editingPlayer.monthlySalary || "",
        isActive: editingPlayer.isActive ?? true,
      });
    } else {
      form.reset({
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
        medicalNotes: "",
        profilePicture: "",
        idDocument: "",
        contractDocument: "",
        contractStartDate: "",
        contractEndDate: "",
        monthlySalary: "",
        isActive: true,
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
        return apiRequest("PATCH", `/api/players/${editingPlayer.id}`, playerData);
      } else {
        return apiRequest("POST", "/api/players", playerData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: editingPlayer ? "Player updated successfully" : "Player added successfully",
        description: editingPlayer 
          ? "The player information has been updated." 
          : "The new player has been added to your roster.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: editingPlayer 
          ? "Failed to update player. Please try again."
          : "Failed to add player. Please try again.",
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
                name="shirtNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jersey Number</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter number" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            {/* Physical Stats */}
            <div className="grid grid-cols-2 gap-4">
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
              {/* Age Display */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Age
                </label>
                <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                  {form.watch("dateOfBirth") ? (
                    <span className="text-foreground">
                      {calculateAge(form.watch("dateOfBirth"))} years old
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Enter date of birth to calculate age</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height (cm)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="170" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
                  <FormItem>
                    <FormLabel>Weight (kg)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="70" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
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
              name="medicalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes about the player..." 
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
                  name="contractStartDate"
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
                  name="monthlySalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Salary ({getCurrencySymbol(currency)})</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field}
                            className="pl-8"
                          />
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                            {getCurrencySymbol(currency)}
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Contract Total Calculation */}
              {form.watch("contractStartDate") && form.watch("contractEndDate") && form.watch("monthlySalary") && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Contract Value:</span>
                    <span className="text-lg font-bold text-primary">
                      {getCurrencySymbol(currency)}{calculateContractTotal(
                        form.watch("contractStartDate") || "",
                        form.watch("contractEndDate") || "",
                        parseFloat(form.watch("monthlySalary") || "0")
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
                        description="Upload player profile photo (JPG, PNG)"
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
