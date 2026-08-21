import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPlayerSchema, type Player, type Team } from "@shared/schema";
import { PhoneInput } from "@/components/ui/phone-input";
import { NationalitySelect } from "@/components/ui/nationality-select";

// Create a custom form schema with shirt number validation
const createFormSchema = (allPlayers: Player[], editingPlayer?: Player | null) => {
  return insertPlayerSchema.extend({
    shirtNumber: z.number().optional().refine((value) => {
      if (!value) return true; // Allow empty values

      // Check if shirt number is already taken
      const existingPlayer = allPlayers.find(player =>
        player.shirtNumber === value &&
        (!editingPlayer || player.id !== editingPlayer.id)
      );

      return !existingPlayer;
    }, (value) => {
      if (!value) return { message: "Invalid shirt number" };

      // Find the player with this shirt number to show their name
      const existingPlayer = allPlayers.find(player =>
        player.shirtNumber === value &&
        (!editingPlayer || player.id !== editingPlayer.id)
      );

      if (existingPlayer) {
        return {
          message: `Shirt Number ${value} is assigned to "${existingPlayer.firstName} ${existingPlayer.lastName}"`
        };
      }

      return { message: "This shirt number is already assigned to another player" };
    })
  });
};
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { translateWithParams, useI18n } from "@/contexts/I18nContext";
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
  const { t } = useI18n();
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const isEditing = !!editingPlayer;

  // Fetch available teams for assignment
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Fetch all players to check for duplicate shirt numbers
  const { data: allPlayers = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  // Function to check if shirt number is already taken
  const checkShirtNumberExists = (shirtNumber: number) => {
    if (!shirtNumber) return null;

    // Find player with this shirt number (excluding current player if editing)
    const existingPlayer = allPlayers.find(player =>
      player.shirtNumber === shirtNumber &&
      (!editingPlayer || player.id !== editingPlayer.id)
    );

    return existingPlayer;
  };

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

  // Create memoized schema to handle dynamic validation
  const validationSchema = createFormSchema(allPlayers, editingPlayer);

  const form = useForm<FormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: editingPlayer ? {
      firstName: editingPlayer.firstName || "",
      lastName: editingPlayer.lastName || "",
      firstNameAr: editingPlayer.firstNameAr || "",
      lastNameAr: editingPlayer.lastNameAr || "",
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
      firstNameAr: "",
      lastNameAr: "",
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
        firstNameAr: editingPlayer.firstNameAr || "",
        lastNameAr: editingPlayer.lastNameAr || "",
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
        firstNameAr: data.firstNameAr || null,
        lastNameAr: data.lastNameAr || null,
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

      let createdPlayer: Player;
      if (editingPlayer) {
        createdPlayer = await apiRequest("PATCH", `/api/players/${editingPlayer.id}`, playerData);
      } else {
        createdPlayer = await apiRequest("POST", "/api/players", playerData);
      }

      // If team assignment is selected, add player to team
      if (selectedTeam && createdPlayer?.id) {
        await apiRequest("POST", `/api/teams/${selectedTeam}/players/${createdPlayer.id}`);
      }

      return createdPlayer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      // Invalidate team-specific player queries for all teams to ensure updates reflect
      if (selectedTeam) {
        queryClient.invalidateQueries({ queryKey: [`/api/teams/${selectedTeam}/players`] });
        queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedTeam, "players"] });
      }
      // Also invalidate all team players queries to be safe
      queryClient.invalidateQueries({
        queryKey: ["/api/teams"], predicate: (query) =>
          query.queryKey.includes("players")
      });
      toast({
        title: editingPlayer ? "Player updated" : "Player added",
        description: editingPlayer
          ? "Player has been updated successfully."
          : `New player has been added${selectedTeam ? " and assigned to team" : ""}.`,
      });
      onOpenChange(false);
      form.reset();
      setSelectedTeam(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
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
          <DialogTitle>{editingPlayer ? t("playerForm.editTitle") : t("playerForm.addTitle")}</DialogTitle>
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
                    <FormLabel>{t("playerForm.firstName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("playerForm.enterFirstName")} {...field} />
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
                    <FormLabel>{t("playerForm.lastName")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("playerForm.enterLastName")} {...field} />
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
                    <FormLabel>{t("playerForm.firstNameAr")}</FormLabel>
                    <FormControl>
                      <Input dir="rtl" placeholder={t("playerForm.enterFirstNameAr")} {...field} value={field.value || ""} />
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
                    <FormLabel>{t("playerForm.lastNameAr")}</FormLabel>
                    <FormControl>
                      <Input dir="rtl" placeholder={t("playerForm.enterLastNameAr")} {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-xs text-muted-foreground md:col-span-2">{t("playerForm.arabicNameHint")}</p>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("playerForm.email")}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t("playerForm.enterEmail")} {...field} value={field.value || ""} />
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
                    <FormLabel>{t("playerForm.phone")}</FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder={t("playerForm.enterPhone")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ID Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t("playerForm.idInformation")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("playerForm.nationalId")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("playerForm.enterId")} {...field} value={field.value || ""} />
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
                      <FormLabel>{t("playerForm.passportNumber")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("playerForm.enterPassport")} {...field} value={field.value || ""} />
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
                        <FormLabel>{t("playerForm.passportIssueDate")}</FormLabel>
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
                        <FormLabel>{t("playerForm.passportExpiryDate")}</FormLabel>
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
                    <FormLabel>{t("playerForm.position")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("playerForm.selectPosition")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="goalkeeper">{t("position.goalkeeper")}</SelectItem>
                        <SelectItem value="defender">{t("position.defender")}</SelectItem>
                        <SelectItem value="midfielder">{t("position.midfielder")}</SelectItem>
                        <SelectItem value="forward">{t("position.forward")}</SelectItem>
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
                    <FormLabel>{t("playerForm.nationality")}</FormLabel>
                    <FormControl>
                      <NationalitySelect
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder={t("playerForm.selectNationality")}
                      />
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
                    <FormLabel>{t("playerForm.dateOfBirth")}</FormLabel>
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
                  <span className="font-medium">
                    {translateWithParams(t, "playerForm.currentAge", { age: String(calculateAge(form.watch("dateOfBirth")) ?? "") })}
                  </span>
                </span>
              </div>
            )}

            {/* Physical Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="shirtNumber"
                render={({ field }) => {
                  const [customError, setCustomError] = useState<string>("");

                  const handleShirtNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value ? parseInt(e.target.value) : undefined;
                    field.onChange(value);

                    // Check for existing shirt number
                    if (value) {
                      const existingPlayer = checkShirtNumberExists(value);
                      if (existingPlayer) {
                        setCustomError(`Shirt Number ${value} is assigned to "${existingPlayer.firstName} ${existingPlayer.lastName}"`);
                      } else {
                        setCustomError("");
                      }
                    } else {
                      setCustomError("");
                    }
                  };

                  return (
                    <FormItem>
                      <FormLabel>{t("playerForm.shirtNumber")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="99"
                          placeholder={t("playerForm.number")}
                          {...field}
                          value={field.value || ''}
                          onChange={handleShirtNumberChange}
                          className={customError ? "border-red-500" : ""}
                        />
                      </FormControl>
                      {customError && (
                        <p className="text-sm text-red-500 mt-1">{customError}</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("playerForm.height")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t("playerForm.heightPlaceholder")}
                        {...field}
                        value={field.value || ''}
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
                    <FormLabel>{t("playerForm.weight")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t("playerForm.weightPlaceholder")}
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
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
                    <FormLabel>{t("playerForm.emergencyContact")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("playerForm.emergencyPlaceholder")} {...field} value={field.value || ""} />
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
                    <FormLabel>{t("playerForm.medicalNotes")}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t("playerForm.medicalPlaceholder")} {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contract Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t("playerForm.contractInformation")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contractStartDate"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t("playerForm.contractStartDate")}</FormLabel>
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
                        <FormLabel>{t("playerForm.contractEndDate")}</FormLabel>
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
                    <FormLabel>{translateWithParams(t, "playerForm.monthlySalary", { currency: getCurrencySymbol(currency) })}</FormLabel>
                    <FormControl>
                      <Input className="max-w-xs" type="number" step="0.01" placeholder={t("playerForm.salaryPlaceholder")} {...field} value={field.value || ""} />
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
                    Total Contract Value: <span className="font-medium">{getCurrencySymbol(currency)}{calculateContractTotal(form.watch("contractStartDate") || "", form.watch("contractEndDate") || "", parseFloat(form.watch("monthlySalary") || "0")).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Contract Expiry Calculation */}
              {form.watch("contractEndDate") && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Contract Validity</h4>
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
                        return <span className="text-red-600 font-medium">⚠️ Contract has expired!</span>;
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
                        return <span className="text-red-600 font-medium">⚠️ Expires in {timeRemaining} - Renewal needed soon!</span>;
                      }

                      return <span className="text-green-600 font-medium">✅ Valid for {timeRemaining}</span>;
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Team Assignment */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t("playerForm.teamAssignment")}</h3>
              <Select value={selectedTeam ? selectedTeam.toString() : "none"} onValueChange={(value) => setSelectedTeam(value === "none" ? null : parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("playerForm.selectTeam")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("playerForm.noTeam")}</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name} ({team.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Document Uploads Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900">{t("playerForm.documents")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Picture Upload */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="profilePicture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t("playerForm.profilePicture")}</FormLabel>
                        <FormControl>
                          <FileUpload
                            label=""
                            value={field.value || undefined}
                            onChange={field.onChange}
                            accept="image/*"
                            description="Upload profile photo"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ID Document Upload */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="idDocument"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t("playerForm.idDocument")}</FormLabel>
                        <FormControl>
                          <FileUpload
                            label=""
                            value={field.value || undefined}
                            onChange={field.onChange}
                            accept="image/*,.pdf"
                            description="Upload ID copy"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contract Document Upload */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="contractDocument"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">{t("playerForm.contractDocument")}</FormLabel>
                        <FormControl>
                          <FileUpload
                            label=""
                            value={field.value || undefined}
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
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("playerForm.cancel")}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? (editingPlayer ? t("playerForm.updating") : t("playerForm.adding"))
                  : (editingPlayer ? t("playerForm.update") : t("playerForm.add"))
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
