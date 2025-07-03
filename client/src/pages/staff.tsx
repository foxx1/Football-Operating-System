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
import StaffCard from "@/components/cards/StaffCard";
import DetailedPreview from "@/components/cards/DetailedPreview";

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | undefined>();
  const [selectedStaff, setSelectedStaff] = useState<Set<number>>(new Set());
  const [previewStaff, setPreviewStaff] = useState<Staff | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
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

  const handleStaffSelect = (staff: Staff) => {
    setSelectedStaff(prev => {
      const newSet = new Set(prev);
      if (newSet.has(staff.id)) {
        newSet.delete(staff.id);
      } else {
        newSet.add(staff.id);
      }
      return newSet;
    });
  };

  const handleStaffPreview = (staff: Staff) => {
    setPreviewStaff(staff);
    setIsPreviewOpen(true);
  };

  const handleStaffEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setDialogOpen(true);
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
          <StaffCard
            key={member.id}
            staff={member}
            isSelected={selectedStaff.has(member.id)}
            onEdit={handleStaffEdit}
            onDelete={handleDeleteStaff}
            onPreview={handleStaffPreview}
            onSelect={handleStaffSelect}
            getDepartmentColor={getDepartmentColor}
            getRoleColor={getRoleColor}
            formatRole={formatRole}
            formatCurrency={(amount: string, currency: string) => formatCurrency(Number(amount) || 0, currency)}
            currency={currency}
          />
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

      {/* Staff Preview Dialog */}
      <DetailedPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        data={previewStaff}
        type="staff"
        onEdit={handleStaffEdit}
        getDepartmentColor={getDepartmentColor}
        getRoleColor={getRoleColor}
        formatRole={formatRole}
        formatCurrency={(amount: string, currency: string) => formatCurrency(Number(amount) || 0, currency)}
        currency={currency}
      />
    </div>
  );
}