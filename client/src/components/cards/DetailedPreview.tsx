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
import { useSettings } from "@/contexts/SettingsContext";

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
  const { organizationName, logoUrl, currentSeason } = useSettings();

  if (!data) return null;

  const handlePrint = () => {
    // Create a new window for printing with all information
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = createPrintContent();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const createPrintContent = () => {
    const currentDate = new Date().toLocaleDateString();
    const isPlayer = type === 'player';
    const person = data as Player | Staff;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${person.firstName} ${person.lastName} - ${isPlayer ? 'Player' : 'Staff'} Profile</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; line-height: 1.4; color: #333; }
          .print-container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; }
          .logo { max-height: 60px; max-width: 200px; }
          .org-info { text-align: center; flex: 1; }
          .org-name { font-size: 24px; font-weight: bold; color: #2563eb; }
          .season { font-size: 14px; color: #6b7280; }
          .print-date { text-align: right; font-size: 12px; color: #6b7280; }
          .profile-section { display: flex; gap: 30px; margin-bottom: 30px; }
          .profile-image { width: 150px; height: 150px; border-radius: 8px; object-fit: cover; border: 2px solid #e5e5e5; }
          .profile-info { flex: 1; }
          .profile-name { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .profile-role { display: inline-block; background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; margin-bottom: 15px; }
          .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .info-section { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #1e40af; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
          .info-item { margin-bottom: 8px; }
          .info-label { font-weight: 600; color: #4b5563; }
          .info-value { color: #374151; }
          .full-width { grid-column: 1 / -1; }
          @media print {
            body { print-color-adjust: exact; }
            .print-container { max-width: none; margin: 0; padding: 15px; }
            .header { page-break-inside: avoid; }
            .profile-section { page-break-inside: avoid; }
            .info-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="Organization Logo" class="logo">` : ''}
            <div class="org-info">
              <div class="org-name">${organizationName}</div>
              <div class="season">Season ${currentSeason}</div>
            </div>
            <div class="print-date">
              Generated: ${currentDate}
            </div>
          </div>
          
          <div class="profile-section">
            <img src="${person.profilePicture || '/api/placeholder/150/150'}" alt="${person.firstName} ${person.lastName}" class="profile-image">
            <div class="profile-info">
              <div class="profile-name">${person.firstName} ${person.lastName}</div>
              <div class="profile-role">${isPlayer ? (person as Player).position : formatRole?.((person as Staff).role) || (person as Staff).role}</div>
              <div class="info-item">
                <span class="info-label">Email:</span><span class="info-value">${person.email}</span>
              </div>
              ${person.phoneNumber ? `
                <div class="info-item">
                  <span class="info-label">Phone:</span><span class="info-value">${person.phoneNumber}</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          <div class="info-grid">
            ${generateInfoSections(person, isPlayer)}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const generateInfoSections = (person: Player | Staff, isPlayer: boolean) => {
    if (isPlayer) {
      const player = person as Player;
      return `
        <div class="info-section">
          <div class="section-title">Basic Information</div>
          <div class="info-item">
            <span class="info-label">Date of Birth:</span><span class="info-value">${player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Nationality:</span><span class="info-value">${player.nationality || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Height:</span><span class="info-value">${player.height || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Weight:</span><span class="info-value">${player.weight || 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Jersey Number:</span><span class="info-value">${player.shirtNumber || 'N/A'}</span>
          </div>
        </div>
        
        <div class="info-section">
          <div class="section-title">Contract Details</div>
          <div class="info-item">
            <span class="info-label">Contract Start:</span><span class="info-value">${player.contractStartDate ? new Date(player.contractStartDate).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Contract End:</span><span class="info-value">${player.contractEndDate ? new Date(player.contractEndDate).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Monthly Salary:</span><span class="info-value">${player.monthlySalary && formatCurrency ? formatCurrency(player.monthlySalary.toString(), currency || 'USD') : 'N/A'}</span>
          </div>
        </div>
        
        <div class="info-section">
          <div class="section-title">Medical Information</div>
          <div class="info-item">
            <span class="info-label">Medical Notes:</span><span class="info-value">${player.medicalNotes || 'None'}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Emergency Contact:</span><span class="info-value">${player.emergencyContact || 'N/A'}</span>
          </div>
        </div>
      `;
    } else {
      const staff = person as Staff;
      return `
        <div class="info-section">
          <div class="section-title">Role & Department</div>
          <div class="info-item">
            <span class="info-label">Role:</span><span class="info-value">${formatRole?.(staff.role) || staff.role}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Department:</span><span class="info-value">${staff.department}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Employment Type:</span><span class="info-value">${staff.employmentType.replace('_', ' ')}</span>
          </div>
        </div>
        
        <div class="info-section">
          <div class="section-title">Employment Details</div>
          <div class="info-item">
            <span class="info-label">Start Date:</span><span class="info-value">${new Date(staff.startDate).toLocaleDateString()}</span>
          </div>
          ${staff.contractEndDate ? `
            <div class="info-item">
              <span class="info-label">Contract End:</span><span class="info-value">${new Date(staff.contractEndDate).toLocaleDateString()}</span>
            </div>
          ` : ''}
          ${staff.salary ? `
            <div class="info-item">
              <span class="info-label">Monthly Salary:</span><span class="info-value">${formatCurrency?.(staff.salary.toString(), currency || 'USD') || staff.salary}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="info-section">
          <div class="section-title">Additional Information</div>
          ${staff.qualifications ? `
            <div class="info-item">
              <span class="info-label">Qualifications:</span><span class="info-value">${staff.qualifications}</span>
            </div>
          ` : ''}
          ${staff.emergencyContact ? `
            <div class="info-item">
              <span class="info-label">Emergency Contact:</span><span class="info-value">${staff.emergencyContact}</span>
            </div>
          ` : ''}
          ${staff.idNumber ? `
            <div class="info-item">
              <span class="info-label">ID Number:</span><span class="info-value">${staff.idNumber}</span>
            </div>
          ` : ''}
        </div>
      `;
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const currentDate = new Date().toLocaleDateString();
      const isPlayer = type === 'player';
      const person = data as Player | Staff;
      
      // Add organization header
      pdf.setFontSize(20);
      pdf.setTextColor(37, 99, 235);
      pdf.text(organizationName, 105, 20, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Season ${currentSeason}`, 105, 30, { align: 'center' });
      pdf.text(`Generated: ${currentDate}`, 105, 40, { align: 'center' });
      
      // Add profile section
      pdf.setFontSize(24);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${person.firstName} ${person.lastName}`, 20, 65);
      
      pdf.setFontSize(14);
      pdf.setTextColor(59, 130, 246);
      const roleText = isPlayer ? (person as Player).position : formatRole?.((person as Staff).role) || (person as Staff).role;
      pdf.text(roleText, 20, 75);
      
      // Add basic info
      let yPos = 90;
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      
      const addInfoLine = (label: string, value: string) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${label}:`, 20, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, 80, yPos);
        yPos += 8;
      };
      
      addInfoLine('Email', person.email);
      if (person.phoneNumber) addInfoLine('Phone', person.phoneNumber);
      
      if (isPlayer) {
        const player = person as Player;
        yPos += 5;
        pdf.setFontSize(16);
        pdf.setTextColor(30, 64, 175);
        pdf.text('Player Information', 20, yPos);
        yPos += 10;
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        
        if (player.dateOfBirth) addInfoLine('Date of Birth', new Date(player.dateOfBirth).toLocaleDateString());
        if (player.nationality) addInfoLine('Nationality', player.nationality);
        if (player.height) addInfoLine('Height', player.height.toString());
        if (player.weight) addInfoLine('Weight', player.weight.toString());
        if (player.shirtNumber) addInfoLine('Jersey Number', player.shirtNumber.toString());
        
        yPos += 5;
        pdf.setFontSize(16);
        pdf.setTextColor(30, 64, 175);
        pdf.text('Contract Details', 20, yPos);
        yPos += 10;
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        
        if (player.contractStartDate) addInfoLine('Contract Start', new Date(player.contractStartDate).toLocaleDateString());
        if (player.contractEndDate) addInfoLine('Contract End', new Date(player.contractEndDate).toLocaleDateString());
        if (player.monthlySalary && formatCurrency) addInfoLine('Monthly Salary', formatCurrency(player.monthlySalary.toString(), currency || 'USD'));
        
        if (player.medicalNotes || player.emergencyContact) {
          yPos += 5;
          pdf.setFontSize(16);
          pdf.setTextColor(30, 64, 175);
          pdf.text('Medical Information', 20, yPos);
          yPos += 10;
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          
          if (player.medicalNotes) addInfoLine('Medical Notes', player.medicalNotes);
          if (player.emergencyContact) addInfoLine('Emergency Contact', player.emergencyContact);
        }
      } else {
        const staff = person as Staff;
        yPos += 5;
        pdf.setFontSize(16);
        pdf.setTextColor(30, 64, 175);
        pdf.text('Staff Information', 20, yPos);
        yPos += 10;
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        
        addInfoLine('Role', formatRole?.(staff.role) || staff.role);
        addInfoLine('Department', staff.department);
        addInfoLine('Employment Type', staff.employmentType.replace('_', ' '));
        addInfoLine('Start Date', new Date(staff.startDate).toLocaleDateString());
        
        if (staff.contractEndDate) addInfoLine('Contract End', new Date(staff.contractEndDate).toLocaleDateString());
        if (staff.salary && formatCurrency) addInfoLine('Monthly Salary', formatCurrency(staff.salary.toString(), currency || 'USD'));
        if (staff.qualifications) addInfoLine('Qualifications', staff.qualifications);
        if (staff.emergencyContact) addInfoLine('Emergency Contact', staff.emergencyContact);
        if (staff.idNumber) addInfoLine('ID Number', staff.idNumber);
      }
      
      // Add footer
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text('ProCoach - Professional Football Management System', 105, 280, { align: 'center' });
      pdf.text(`© ${new Date().getFullYear()} ${organizationName}`, 105, 290, { align: 'center' });
      
      const fileName = `${isPlayer ? 'player' : 'staff'}_${person.firstName}_${person.lastName}.pdf`;
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