import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FlagIcon } from "@/components/ui/flag-icon";
import { countries } from "@/lib/countries";
import { 
  Edit, 
  Trash2, 
  Eye, 
  Star,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Award,
  MapPin,
  Building,
  Clock,
  Users
} from "lucide-react";
import { Staff } from "@shared/schema";
import { motion } from "framer-motion";
import DeleteConfirmationDialog from "@/components/ui/delete-confirmation-dialog";
import { StaffTeamAssignment } from "@/components/staff-team-assignment";

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
  formatCurrency,
  currency
}: StaffCardProps) {
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Find the country for nationality display
  const nationalityCountry = staff.nationality 
    ? countries.find(country => country.name === staff.nationality)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="relative"
    >
      <Card 
        className={`
          relative overflow-hidden cursor-pointer transition-all duration-300 group
          ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}
          ${isCardHovered ? 'shadow-xl transform-gpu' : 'hover:shadow-lg'}
          ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
          ${getDepartmentColor(staff.department)}
        `}
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={() => setIsCardHovered(false)}
        onClick={() => onSelect(staff)}
      >
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
        )}

        {/* Hover overlay */}
        <motion.div
          className={`
            absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none
            ${isCardHovered ? 'opacity-100' : 'opacity-0'}
          `}
          initial={{ opacity: 0 }}
          animate={{ opacity: isCardHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />

        <CardContent className="p-6 relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-white/10">
                  <AvatarImage 
                    src={staff.profilePicture || undefined}
                    alt={`${staff.firstName} ${staff.lastName}`}
                    className="object-cover object-center"
                  />
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {staff.firstName[0]}{staff.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                {/* Status indicator */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                  {staff.firstName} {staff.lastName}
                </h3>
                <Badge className={`text-xs ${getRoleColor(staff.role)}`}>
                  {formatRole(staff.role)}
                </Badge>
              </div>
            </div>


          </div>

          {/* Basic info only */}
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <Briefcase className="w-4 h-4 mr-2" />
              <span className="capitalize">{staff.department}</span>
            </div>
            
            {nationalityCountry && (
              <div className="flex items-center text-sm text-gray-600">
                <FlagIcon countryCode={nationalityCountry.code} size="sm" className="mr-2" />
                <span>{nationalityCountry.code} - {staff.nationality}</span>
              </div>
            )}
            
            {staff.phoneNumber && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <span>{staff.phoneNumber}</span>
              </div>
            )}
          </div>



          {/* Action buttons */}
          <motion.div
            className="flex space-x-2 mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: isCardHovered ? 1 : 0, 
              y: isCardHovered ? 0 : 10 
            }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(staff);
              }}
            >
              <Eye className="w-3 h-3 mr-1" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(staff);
              }}
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </motion.div>

          {/* Team Assignment */}
          <motion.div
            className="mt-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: isCardHovered ? 1 : 0, 
              y: isCardHovered ? 0 : 10 
            }}
            transition={{ duration: 0.2, delay: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <StaffTeamAssignment staff={staff} />
          </motion.div>
        </CardContent>

        {/* Favorite/Star indicator */}
        <motion.div
          className="absolute top-3 right-3"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: isSelected ? 1 : 0, 
            scale: isSelected ? 1 : 0 
          }}
          transition={{ duration: 0.2 }}
        >
          <Star className="w-5 h-5 text-yellow-500 fill-current" />
        </motion.div>
      </Card>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          onDelete(staff.id);
          setShowDeleteDialog(false);
        }}
        title="Delete Staff Member"
        name={`${staff.firstName} ${staff.lastName}`}
        type="staff"
      />
    </motion.div>
  );
}