import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Printer, 
  Share2, 
  Edit, 
  X,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Activity,
  Award,
  Briefcase,
  Building,
  FileText,
  Heart,
  AlertCircle,
  Clock,
  DollarSign,
  UserCheck,
  Star
} from "lucide-react";
import { Player, Staff } from "@shared/schema";
import { motion } from "framer-motion";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DetailedPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  data: Player | Staff | null;
  type: 'player' | 'staff';
  onEdit?: (data: any) => void;
  getPositionColor?: (position: string) => string;
  getDepartmentColor?: (department: string) => string;
  getRoleColor?: (role: string) => string;
  formatRole?: (role: string) => string;
  formatCurrency?: (amount: string, currency: string) => string;
  currency?: string;
}

export default function DetailedPreview({
  isOpen,
  onClose,
  data,
  type,
  onEdit,
  getPositionColor,
  getDepartmentColor,
  getRoleColor,
  formatRole,
  formatCurrency,
  currency
}: DetailedPreviewProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);

  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('preview-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = type === 'player' 
        ? `player_${(data as Player).firstName}_${(data as Player).lastName}.pdf`
        : `staff_${(data as Staff).firstName}_${(data as Staff).lastName}.pdf`;
      
      pdf.save(fileName);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.firstName} ${data.lastName} - ${type === 'player' ? 'Player' : 'Staff'} Profile`,
          text: `Profile for ${data.firstName} ${data.lastName}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const renderPlayerContent = (player: Player) => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="personal">Personal</TabsTrigger>
        <TabsTrigger value="contract">Contract</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Position</p>
                <Badge className={getPositionColor?.(player.position)}>
                  {player.position}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Shirt Number</p>
                <p className="font-medium">#{player.shirtNumber || 'TBD'}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">
                  {new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear()} years
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={player.isActive ? "default" : "secondary"}>
                  {player.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            
            {(player.height || player.weight) && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Physical Stats</p>
                <p className="font-medium">
                  {player.height}cm • {player.weight}kg
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="personal" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{new Date(player.dateOfBirth).toLocaleDateString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Nationality</p>
                <p className="font-medium">{player.nationality}</p>
              </div>
              {player.email && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{player.email}</p>
                </div>
              )}
              {player.phoneNumber && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{player.phoneNumber}</p>
                </div>
              )}
              {player.emergencyContact && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Emergency Contact</p>
                  <p className="font-medium">{player.emergencyContact}</p>
                </div>
              )}
            </div>
            
            {player.medicalNotes && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Medical Notes</p>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-900/20">
                  <p className="text-sm text-orange-800 dark:text-orange-200">{player.medicalNotes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="contract" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Contract Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {player.contractStartDate && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Contract Start</p>
                  <p className="font-medium">{new Date(player.contractStartDate).toLocaleDateString()}</p>
                </div>
              )}
              {player.contractEndDate && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Contract End</p>
                  <p className="font-medium">{new Date(player.contractEndDate).toLocaleDateString()}</p>
                </div>
              )}
              {player.monthlySalary && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Monthly Salary</p>
                  <p className="font-medium">${parseFloat(player.monthlySalary).toLocaleString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {player.profilePicture && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Profile Picture</p>
                  <div className="w-32 h-32 rounded-lg overflow-hidden border">
                    <img 
                      src={player.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              {player.idDocument && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">ID Document</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={player.idDocument} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      View Document
                    </a>
                  </Button>
                </div>
              )}
              {player.contractDocument && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Contract Document</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={player.contractDocument} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      View Contract
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

  const renderStaffContent = (staff: Staff) => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="personal">Personal</TabsTrigger>
        <TabsTrigger value="employment">Employment</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Professional Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge className={getRoleColor?.(staff.role)}>
                  {formatRole?.(staff.role)}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Department</p>
                <Badge className={getDepartmentColor?.(staff.department)}>
                  {staff.department}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Employment Type</p>
                <p className="font-medium capitalize">{staff.employmentType?.replace('_', ' ')}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{new Date(staff.startDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            {staff.qualifications && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Qualifications</p>
                <p className="font-medium">{staff.qualifications}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="personal" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{staff.email}</p>
              </div>
              {staff.phoneNumber && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{staff.phoneNumber}</p>
                </div>
              )}
              {staff.idNumber && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Official ID</p>
                  <p className="font-medium">{staff.idNumber}</p>
                </div>
              )}
              {staff.emergencyContact && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Emergency Contact</p>
                  <p className="font-medium">{staff.emergencyContact}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="employment" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Employment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{new Date(staff.startDate).toLocaleDateString()}</p>
              </div>
              {staff.contractEndDate && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Contract End Date</p>
                  <p className="font-medium">{new Date(staff.contractEndDate).toLocaleDateString()}</p>
                </div>
              )}
              {staff.salary && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Monthly Salary</p>
                  <p className="font-medium">{formatCurrency?.(staff.salary.toString(), currency || 'USD')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {staff.profilePicture && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Profile Picture</p>
                  <div className="w-32 h-32 rounded-lg overflow-hidden border">
                    <img 
                      src={staff.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              {staff.idDocument && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">ID Document</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={staff.idDocument} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      View Document
                    </a>
                  </Button>
                </div>
              )}
              {staff.contractDocument && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Contract Document</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href={staff.contractDocument} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      View Contract
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={data.profilePicture || undefined}
                  alt={`${data.firstName} ${data.lastName}`}
                  className="object-cover object-center"
                />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {data.firstName[0]}{data.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{data.firstName} {data.lastName}</h2>
                <p className="text-sm text-muted-foreground capitalize">
                  {type === 'player' ? (data as Player).position : (data as Staff).role}
                </p>
              </div>
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(data)}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div id="preview-content" className="space-y-6">
          <Separator />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {type === 'player' ? renderPlayerContent(data as Player) : renderStaffContent(data as Staff)}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}