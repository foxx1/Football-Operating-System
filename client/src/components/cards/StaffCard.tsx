import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FlagIcon } from "@/components/ui/flag-icon";
import { countries } from "@/lib/countries";
import { Edit, Trash2, Eye, Briefcase, Mail, Phone, Users } from "lucide-react";
import { Staff, Team } from "@shared/schema";
import DeleteConfirmationDialog from "@/components/ui/delete-confirmation-dialog";
import { StaffTeamAssignment } from "@/components/staff-team-assignment";
import { cn, getDisplayName } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nContext";

interface StaffCardProps {
  staff: Staff;
  isSelected?: boolean;
  onEdit: (staff: Staff) => void;
  onDelete: (staffId: number) => void;
  onPreview: (staff: Staff) => void;
  onSelect: (staff: Staff) => void;
  getDepartmentColor: (department: string) => string;
  getRoleColor: (role: string) => string;
  formatRole: (role: string) => string;
  formatCurrency: (amount: string, currency: string) => string;
  currency: string;
}

export default function StaffCard({
  staff,
  isSelected = false,
  onEdit,
  onDelete,
  onPreview,
  onSelect,
  getDepartmentColor,
  getRoleColor,
  formatRole,
}: StaffCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { isRtl } = useI18n();
  const displayName = getDisplayName(staff, isRtl);

  // Fetched unconditionally (unlike the assignment dialog's own copy of this
  // query, which only loads once opened) so the card face can show the
  // team name(s) without requiring the user to open that dialog first.
  const { data: staffTeams = [] } = useQuery<Array<{ teamId: number; team: Team }>>({
    queryKey: [`/api/staff-teams/${staff.id}`],
  });

  // Find the country for nationality display
  const nationalityCountry = staff.nationality 
    ? countries.find(country => country.name === staff.nationality)
    : null;

  return (
    <div className="relative">
      <Card
        className={cn(
          "content-card cursor-pointer transition-shadow duration-200 hover:shadow-lg",
          isSelected && "ring-2 ring-blue-500 shadow-lg"
        )}
        onClick={() => onSelect(staff)}
      >
        <CardContent className="p-6">
          <div className="space-y-4 text-center">
            <div className="relative">
              <Avatar className="mx-auto h-16 w-16">
                <AvatarImage
                  src={staff.profilePicture || undefined}
                  alt={displayName}
                  className="object-cover object-center"
                />
                <AvatarFallback className="bg-primary text-lg text-primary-foreground">
                  {staff.firstName[0]}
                  {staff.lastName[0]}
                </AvatarFallback>
              </Avatar>
              {isSelected && (
                <Badge className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary p-0 text-primary-foreground">
                  ✓
                </Badge>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground">
                {displayName}
              </h3>
              <Badge className={cn("mt-1", getRoleColor(staff.role))}>
                {formatRole(staff.role)}
              </Badge>
              {staffTeams.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                  {staffTeams.map((assignment) => (
                    <Badge key={assignment.teamId} variant="outline" className="gap-1 text-xs font-normal">
                      <Users className="h-3 w-3" />
                      {assignment.team.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-center text-muted-foreground">
                <Briefcase className="mr-2 h-4 w-4" />
                <span className="capitalize">{staff.department}</span>
              </div>
              {staff.phoneNumber && (
                <div className="flex items-center justify-center text-muted-foreground">
                  <Phone className="mr-2 h-4 w-4" />
                  <span>{staff.phoneNumber}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-border pt-2">
              {staff.email && (
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <Mail className="mr-2 h-3 w-3" />
                  <span className="truncate">{staff.email}</span>
                </div>
              )}
              {nationalityCountry && (
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <FlagIcon countryCode={nationalityCountry.code} size="sm" className="mr-2" />
                  <span>{nationalityCountry.code} - {staff.nationality}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(staff);
                }}
              >
                <Eye className="mr-1 h-3 w-3" />
                Preview
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(staff);
                }}
              >
                <Edit className="mr-1 h-3 w-3" />
                Edit
              </Button>
            </div>

            <div className="pt-1">
              <StaffTeamAssignment staff={staff} />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          onDelete(staff.id);
          setShowDeleteDialog(false);
        }}
        title="Delete Staff Member"
        name={displayName}
        type="staff"
      />
    </div>
  );
}