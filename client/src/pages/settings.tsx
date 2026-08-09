import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings as SettingsIcon, Save, Bell, Shield, Users, Globe, Database, Mail, DollarSign, Clock, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SystemSettings } from "@shared/schema";

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [tempSettings, setTempSettings] = useState<Record<string, any>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: settings = [], isLoading } = useQuery<SystemSettings[]>({
    queryKey: ["/api/settings"],
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/settings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const createSettingMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("POST", "/api/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Setting created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create setting",
        variant: "destructive",
      });
    },
  });

  const getSettingValue = (category: string, key: string, defaultValue: string = "") => {
    // Check temporary settings first
    const settingId = `${category}_${key}`;
    if (tempSettings[settingId]) {
      return tempSettings[settingId].value;
    }

    // Fall back to stored settings
    const setting = settings.find((s: SystemSettings) =>
      s.category === category && s.settingKey === key
    );
    return setting?.settingValue || defaultValue;
  };

  const updateSetting = (category: string, key: string, value: string, description?: string) => {
    // Store changes temporarily instead of immediately saving
    const settingId = `${category}_${key}`;
    setTempSettings(prev => ({
      ...prev,
      [settingId]: { category, key, value, description }
    }));
    setHasUnsavedChanges(true);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Error",
          description: "Image file size should be less than 2MB",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      setHasUnsavedChanges(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveAllSettings = async () => {
    try {
      // Create a copy of temp settings to work with
      const settingsToSave = { ...tempSettings };

      // Save logo as base64 data URL directly — no file upload server needed
      if (logoFile && logoPreview) {
        settingsToSave['general_logo_url'] = {
          category: "general",
          key: "logo_url",
          value: logoPreview,
          description: "Organization logo URL"
        };
      }

      // Save all settings including the new logo if applicable
      for (const [settingId, setting] of Object.entries(settingsToSave)) {
        const existing = settings.find((s: SystemSettings) =>
          s.category === setting.category && s.settingKey === setting.key
        );

        const data = {
          category: setting.category,
          settingKey: setting.key,
          settingValue: setting.value,
          description: setting.description || `${setting.category} ${setting.key} setting`,
          updatedBy: 1, // This would be the current user ID
          isActive: true,
        };

        if (existing) {
          await apiRequest("PATCH", `/api/settings/${existing.id}`, data);
        } else {
          await apiRequest("POST", "/api/settings", data);
        }
      }

      // Clear temporary state
      setTempSettings({});
      setHasUnsavedChanges(false);
      setLogoFile(null);

      // Refresh settings and force re-render of all components
      await queryClient.invalidateQueries({ queryKey: ["/api/settings"] });

      // Clear all query cache to ensure fresh data
      queryClient.clear();

      // Force a page reload to ensure all components pick up the new settings
      setTimeout(() => {
        window.location.reload();
      }, 500);

      toast({
        title: "Success",
        description: "All settings saved successfully! Page will refresh to apply changes.",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage system preferences and configurations</p>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600 font-medium">
              Unsaved changes
            </span>
          )}
          <Button
            onClick={saveAllSettings}
            disabled={!hasUnsavedChanges}
            className="flex items-center gap-2 px-6"
            size="lg"
          >
            <Save className="w-4 h-4" />
            Save All Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Organization Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload Section */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Organization Logo</Label>
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      {logoPreview || getSettingValue("general", "logo_url") ? (
                        <img
                          src={logoPreview || getSettingValue("general", "logo_url")}
                          alt="Organization Logo"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Logo
                      </Button>
                      <span className="text-sm text-gray-500">
                        PNG, JPG up to 2MB
                      </span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500">
                      Recommended size: 200x200px. Will be used across all pages and reports.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Organization Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    defaultValue={getSettingValue("general", "org_name", "360 FOS")}
                    onChange={(e) => updateSetting("general", "org_name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-name-ar">Organization Name (Arabic)</Label>
                  <Input
                    id="org-name-ar"
                    defaultValue={getSettingValue("general", "org_name_ar", "")}
                    onChange={(e) => updateSetting("general", "org_name_ar", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="season">Current Season</Label>
                  <Input
                    id="season"
                    defaultValue={getSettingValue("general", "current_season", "2024-25")}
                    onChange={(e) => updateSetting("general", "current_season", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Regional & Currency Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={getSettingValue("general", "timezone", "Asia/Kuwait")}
                    onValueChange={(value) => updateSetting("general", "timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kuwait">AST - Kuwait Time</SelectItem>
                      <SelectItem value="Asia/Qatar">AST - Qatar Time</SelectItem>
                      <SelectItem value="Asia/Dubai">AST - UAE Time</SelectItem>
                      <SelectItem value="Asia/Muscat">AST - Oman Time</SelectItem>
                      <SelectItem value="Asia/Riyadh">AST - Saudi Arabia Time</SelectItem>
                      <SelectItem value="Asia/Bahrain">AST - Bahrain Time</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={getSettingValue("general", "currency", "USD")}
                    onValueChange={(value) => updateSetting("general", "currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                      <SelectItem value="QAR">QAR - Qatari Riyal</SelectItem>
                      <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                      <SelectItem value="OMR">OMR - Omani Rial</SelectItem>
                      <SelectItem value="KWD">KWD - Kuwaiti Dinar</SelectItem>
                      <SelectItem value="BHD">BHD - Bahraini Dinar</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select
                  value={getSettingValue("general", "date_format", "DD/MM/YYYY")}
                  onValueChange={(value) => updateSetting("general", "date_format", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (International)</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US Format)</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</SelectItem>
                    <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Default Training Duration</Label>
                  <p className="text-sm text-gray-600">Standard duration for training sessions</p>
                </div>
                <Select
                  value={getSettingValue("general", "default_training_duration", "90")}
                  onValueChange={(value) => updateSetting("general", "default_training_duration", value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Match Report Auto-Generation</Label>
                  <p className="text-sm text-gray-600">Automatically generate reports after matches</p>
                </div>
                <Switch
                  checked={getSettingValue("general", "auto_match_reports", "false") === "true"}
                  onCheckedChange={(checked) =>
                    updateSetting("general", "auto_match_reports", checked.toString())
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
                <Switch
                  checked={getSettingValue("notifications", "email_enabled", "true") === "true"}
                  onCheckedChange={(checked) =>
                    updateSetting("notifications", "email_enabled", checked.toString())
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Training Reminders</Label>
                  <p className="text-sm text-gray-600">Notify about upcoming training sessions</p>
                </div>
                <Switch
                  checked={getSettingValue("notifications", "training_reminders", "true") === "true"}
                  onCheckedChange={(checked) =>
                    updateSetting("notifications", "training_reminders", checked.toString())
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Match Alerts</Label>
                  <p className="text-sm text-gray-600">Notify about match schedules and results</p>
                </div>
                <Switch
                  checked={getSettingValue("notifications", "match_alerts", "true") === "true"}
                  onCheckedChange={(checked) =>
                    updateSetting("notifications", "match_alerts", checked.toString())
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-600">Add an extra layer of security</p>
                </div>
                <Switch
                  checked={getSettingValue("security", "2fa_enabled", "false") === "true"}
                  onCheckedChange={(checked) =>
                    updateSetting("security", "2fa_enabled", checked.toString())
                  }
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <Select
                  value={getSettingValue("security", "session_timeout", "60")}
                  onValueChange={(value) => updateSetting("security", "session_timeout", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                External Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-provider">Email Service Provider</Label>
                <Select
                  value={getSettingValue("integrations", "email_provider", "smtp")}
                  onValueChange={(value) => updateSetting("integrations", "email_provider", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smtp">SMTP</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                    <SelectItem value="ses">Amazon SES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="backup-frequency">Backup Frequency</Label>
                <Select
                  value={getSettingValue("integrations", "backup_frequency", "daily")}
                  onValueChange={(value) => updateSetting("integrations", "backup_frequency", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
