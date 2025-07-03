import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Users, UserCheck, Briefcase, Phone, Mail, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSettings, formatCurrency } from "@/contexts/SettingsContext";
import type { Staff } from "@shared/schema";
import StaffForm from "@/components/staff-form";

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>();
  const { toast } = useToast();
  const { currency } = useSettings();

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["/api/staff"],
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Success",
        description: "Staff member deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete staff member",
        variant: "destructive",
      });
    },
  });

  const filteredStaff = (staff as Staff[]).filter((member: Staff) => {
    const matchesSearch = 
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === "all" || member.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment && member.isActive;
  });

  const handleAddStaff = () => {
    setEditingStaff(undefined);
    setDialogOpen(true);
  };

  const handleEditStaff = (member: Staff) => {
    setEditingStaff(member);
    setDialogOpen(true);
  };

  const handleDeleteStaff = (id: number) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      deleteStaffMutation.mutate(id);
    }
  };

  const handleFormSuccess = () => {
    setDialogOpen(false);
    setEditingStaff(undefined);
  };

  const getRoleColor = (role: string) => {
    const colors = {
      head_coach: "bg-blue-100 text-blue-800",
      assistant_coach: "bg-green-100 text-green-800",
      fitness_coach: "bg-purple-100 text-purple-800",
      goalkeeping_coach: "bg-orange-100 text-orange-800",
      physiotherapist: "bg-red-100 text-red-800",
      analyst: "bg-indigo-100 text-indigo-800",
      kit_manager: "bg-gray-100 text-gray-800",
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      coaching: "bg-blue-50 border-blue-200",
      medical: "bg-red-50 border-red-200",
      analysis: "bg-purple-50 border-purple-200",
      operations: "bg-green-50 border-green-200",
    };
    return colors[department as keyof typeof colors] || "bg-gray-50 border-gray-200";
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage coaching staff and support personnel</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddStaff} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
              </DialogTitle>
            </DialogHeader>
            <StaffForm staff={editingStaff} onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search staff members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Departments</option>
          <option value="coaching">Coaching</option>
          <option value="medical">Medical</option>
          <option value="analysis">Analysis</option>
          <option value="operations">Operations</option>
        </select>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member: Staff) => (
          <Card key={member.id} className={`hover:shadow-lg transition-shadow ${getDepartmentColor(member.department)}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {member.profilePicture ? (
                    <img
                      src={`http://localhost:5000${member.profilePicture}`}
                      alt={`${member.firstName} ${member.lastName}`}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iMjQiIGZpbGw9IiNlNWU3ZWIiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMTIgMTJDMTQuNSAxMiAxNi41IDEwIDE2LjUgNy41QzE2LjUgNSAxNC41IDMgMTIgM0M5LjUgMyA3LjUgNSA3LjUgNy41QzcuNSAxMCA5LjUgMTIgMTIgMTJaTTEyIDE0LjVDOSAxNC41IDMgMTYgMyAxOVYyMUgyMVYxOUMyMSAxNiAxNSAxNC41IDEyIDE0LjVaIiBmaWxsPSIjOWNhM2FmIi8+Cjwvc3ZnPgo8L3N2Zz4K';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                      {member.firstName[0]}{member.lastName[0]}
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">
                      {member.firstName} {member.lastName}
                    </CardTitle>
                    <Badge className={`text-xs ${getRoleColor(member.role)}`}>
                      {formatRole(member.role)}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditStaff(member)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStaff(member.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Briefcase className="w-4 h-4 mr-2" />
                <span className="capitalize">{member.department}</span>
                <span className="mx-2">•</span>
                <span className="capitalize">{member.employmentType.replace('_', ' ')}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                <span className="truncate">{member.email}</span>
              </div>
              
              {member.phoneNumber && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  <span>{member.phoneNumber}</span>
                </div>
              )}

              {member.salary && (
                <div className="text-sm font-medium text-gray-900">
                  Monthly Salary: {formatCurrency(member.salary, currency)}
                </div>
              )}

              <div className="text-xs text-gray-500">
                Started: {new Date(member.startDate).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedDepartment !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "Get started by adding your first staff member."
              }
            </p>
            {!searchTerm && selectedDepartment === "all" && (
              <Button onClick={handleAddStaff}>
                <Plus className="w-4 h-4 mr-2" />
                Add Staff Member
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}