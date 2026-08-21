import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSettings, formatCurrency } from "@/contexts/SettingsContext";
import { useI18n } from "@/contexts/I18nContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, FileDown, TrendingUp, TrendingDown, DollarSign, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PayrollDetails {
  staff: Array<{
    id: number;
    firstName: string;
    lastName: string;
    role: string;
    department: string;
    employmentType: string;
    salary: number;
    contractEndDate: string | null;
  }>;
  players: Array<{
    id: number;
    firstName: string;
    lastName: string;
    position: string;
    shirtNumber: number | null;
    monthlySalary: number;
    contractEndDate: string | null;
  }>;
}

interface MonthlyBreakdownItem {
  month: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export default function MonthlyBudgets() {
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const { currency } = useSettings();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [showCreateBudget, setShowCreateBudget] = useState(false);

  // Fetch payroll details for selected month
  const { data: payrollDetails, isLoading: payrollLoading, error: payrollError } = useQuery<PayrollDetails>({
    queryKey: [`/api/payroll/${selectedMonth}`],
    queryFn: async () => {
      const response = await fetch(`/api/payroll/${selectedMonth}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch payroll: ${response.statusText}`);
      }
      return await response.json();
    },
  });

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: (budget: any) => apiRequest("POST", "/api/budgets", budget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setShowCreateBudget(false);
      toast({
        title: t("budgets.monthly.toast.createSuccessTitle"),
        description: t("budgets.monthly.toast.createSuccessDesc"),
      });
    },
    onError: (error) => {
      toast({
        title: t("budgets.monthly.toast.createErrorTitle"),
        description: error instanceof Error ? error.message : t("budgets.monthly.toast.createErrorDesc"),
        variant: "destructive",
      });
    },
  });

  const handleCreateBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const budget = {
      month: selectedMonth,
      budgetName: formData.get("budgetName"),
      totalBudget: formData.get("totalBudget"),
      salariesBudget: totalSalaries.toString(),
      operationalBudget: formData.get("operationalBudget") || "0",
      equipmentBudget: formData.get("equipmentBudget") || "0",
      travelBudget: formData.get("travelBudget") || "0",
      medicalBudget: formData.get("medicalBudget") || "0",
      facilitiesBudget: formData.get("facilitiesBudget") || "0",
      marketingBudget: formData.get("marketingBudget") || "0",
      otherBudget: formData.get("otherBudget") || "0",
      notes: formData.get("notes"),
      createdBy: 1, // Current user ID
    };
    createBudgetMutation.mutate(budget);
  };


  // Calculate totals
  const staffTotal = payrollDetails?.staff.reduce((sum, s) => sum + s.salary, 0) || 0;
  const playersTotal = payrollDetails?.players.reduce((sum, p) => sum + p.monthlySalary, 0) || 0;
  const totalSalaries = staffTotal + playersTotal;

  // Generate month options (last 24 months + next 12 months)
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();

    for (let i = -24; i <= 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }

    return options;
  };

  const monthOptions = generateMonthOptions();

  // PDF Generation Handler
  const handleGeneratePDF = async () => {
    if (!payrollDetails) {
      toast({
        title: "Error",
        description: "Missing payroll data for PDF generation",
        variant: "destructive",
      });
      return;
    }

    try {
      const { BudgetPDFGenerator } = await import("@/lib/budget-pdf-generator");
      const generator = new BudgetPDFGenerator(currency);

      const reportData = {
        fiscalYear: selectedMonth,
        budgetName: `Monthly Budget - ${monthOptions.find(m => m.value === selectedMonth)?.label}`,
        totalBudget: totalSalaries,
        salariesBudget: totalSalaries,
        categories: [],
        payroll: {
          staff: payrollDetails.staff,
          players: payrollDetails.players,
        },
        monthlyBreakdown: [],
        summary: {
          staffTotal,
          playersTotal,
          totalSalaries,
          budgeted: totalSalaries,
          actual: 0,
          remaining: totalSalaries,
        },
        currency,
      };

      generator.generateReport(reportData);
      generator.download(`monthly-payroll-${selectedMonth}.pdf`);

      toast({
        title: "PDF Generated",
        description: "Monthly payroll report has been downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("budgets.monthly.title")}</h1>
          <p className="text-muted-foreground">
            {t("budgets.monthly.description")}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("budgets.monthly.selectMonth")} />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {payrollDetails && (
            <Button variant="outline" onClick={handleGeneratePDF}>
              <FileDown className="h-4 w-4 mr-2" />
              {t("budgets.monthly.downloadPdf")}
            </Button>
          )}
          <Button onClick={() => setShowCreateBudget(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("budgets.monthly.createBudget")}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("budgets.monthly.totalSalaries")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSalaries, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("budgets.monthly.monthlyPayrollFor")} {monthOptions.find(m => m.value === selectedMonth)?.label}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("budgets.monthly.staffSalaries")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(staffTotal, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payrollDetails?.staff.length || 0} {t("budgets.monthly.staffMembers")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("budgets.monthly.playerSalaries")}</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(playersTotal, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payrollDetails?.players.length || 0} {t("budgets.monthly.players")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("budgets.monthly.staffPayrollTitle")}</CardTitle>
          <CardDescription>{t("budgets.monthly.staffPayrollDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("budgets.monthly.table.name")}</TableHead>
                <TableHead>{t("budgets.monthly.table.role")}</TableHead>
                <TableHead>{t("budgets.monthly.table.department")}</TableHead>
                <TableHead>{t("budgets.monthly.table.employmentType")}</TableHead>
                <TableHead>{t("budgets.monthly.table.monthlySalary")}</TableHead>
                <TableHead>{t("budgets.monthly.table.contractEnd")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollDetails?.staff.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">
                    {staff.firstName} {staff.lastName}
                  </TableCell>
                  <TableCell className="capitalize">{staff.role.replace('_', ' ')}</TableCell>
                  <TableCell className="capitalize">{staff.department}</TableCell>
                  <TableCell className="capitalize">{staff.employmentType.replace('_', ' ')}</TableCell>
                  <TableCell>{formatCurrency(staff.salary, currency)}</TableCell>
                  <TableCell>
                    {staff.contractEndDate
                      ? new Date(staff.contractEndDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')
                      : t("budgets.monthly.table.permanent")}
                  </TableCell>
                </TableRow>
              ))}
              {(!payrollDetails || payrollDetails.staff.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t("budgets.monthly.noStaffFound")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {payrollDetails && payrollDetails.staff.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{t("budgets.monthly.totalStaffSalaries")}</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(staffTotal, currency)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("budgets.monthly.playerPayrollTitle")}</CardTitle>
          <CardDescription>{t("budgets.monthly.playerPayrollDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("budgets.monthly.table.name")}</TableHead>
                <TableHead>{t("budgets.monthly.table.position")}</TableHead>
                <TableHead>{t("budgets.monthly.table.shirtNumber")}</TableHead>
                <TableHead>{t("budgets.monthly.table.monthlySalary")}</TableHead>
                <TableHead>{t("budgets.monthly.table.contractEnd")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollDetails?.players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">
                    {player.firstName} {player.lastName}
                  </TableCell>
                  <TableCell className="capitalize">{player.position}</TableCell>
                  <TableCell>{player.shirtNumber || t("budgets.monthly.table.na")}</TableCell>
                  <TableCell>{formatCurrency(player.monthlySalary, currency)}</TableCell>
                  <TableCell>
                    {player.contractEndDate
                      ? new Date(player.contractEndDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')
                      : t("budgets.monthly.table.na")}
                  </TableCell>
                </TableRow>
              ))}
              {(!payrollDetails || payrollDetails.players.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("budgets.monthly.noPlayersFound")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {payrollDetails && payrollDetails.players.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{t("budgets.monthly.totalPlayerSalaries")}</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(playersTotal, currency)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Budget Dialog */}
      <Dialog open={showCreateBudget} onOpenChange={setShowCreateBudget}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("budgets.monthly.form.title")}</DialogTitle>
            <DialogDescription>
              {t("budgets.monthly.form.description")} {monthOptions.find(m => m.value === selectedMonth)?.label}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBudget} className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="budgetName">{t("budgets.monthly.form.budgetName")}</Label>
                <Input
                  id="budgetName"
                  name="budgetName"
                  placeholder={t("budgets.monthly.form.budgetNamePlaceholder")}
                  required
                />
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <Label>{t("budgets.monthly.form.salaryBudgetTitle")}</Label>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {formatCurrency(totalSalaries, currency)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("budgets.monthly.form.staffLabel")} {formatCurrency(staffTotal, currency)} + {t("budgets.monthly.form.playersLabel")} {formatCurrency(playersTotal, currency)}
                </p>
              </div>

              <div>
                <Label htmlFor="totalBudget">{t("budgets.monthly.form.totalMonthlyBudget")}</Label>
                <Input
                  id="totalBudget"
                  name="totalBudget"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  defaultValue={totalSalaries}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("budgets.monthly.form.recommendedMinimum")} {formatCurrency(totalSalaries, currency)} {t("budgets.monthly.form.salariesLabel")}
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">{t("budgets.monthly.form.categoryBudgets")}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="operationalBudget">{t("budgets.monthly.form.operational")}</Label>
                    <Input
                      id="operationalBudget"
                      name="operationalBudget"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="equipmentBudget">{t("budgets.monthly.form.equipment")}</Label>
                    <Input
                      id="equipmentBudget"
                      name="equipmentBudget"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="travelBudget">{t("budgets.monthly.form.travel")}</Label>
                    <Input
                      id="travelBudget"
                      name="travelBudget"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="medicalBudget">{t("budgets.monthly.form.medical")}</Label>
                    <Input
                      id="medicalBudget"
                      name="medicalBudget"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="facilitiesBudget">{t("budgets.monthly.form.facilities")}</Label>
                    <Input
                      id="facilitiesBudget"
                      name="facilitiesBudget"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="marketingBudget">{t("budgets.monthly.form.marketing")}</Label>
                    <Input
                      id="marketingBudget"
                      name="marketingBudget"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="otherBudget">{t("budgets.monthly.form.other")}</Label>
                    <Input
                      id="otherBudget"
                      name="otherBudget"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">{t("budgets.monthly.form.notes")}</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder={t("budgets.monthly.form.notesPlaceholder")}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateBudget(false)}
              >
                {t("budgets.monthly.form.cancel")}
              </Button>
              <Button type="submit" disabled={createBudgetMutation.isPending}>
                {createBudgetMutation.isPending ? t("budgets.monthly.form.creating") : t("budgets.monthly.form.createSubmit")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}