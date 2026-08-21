import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSettings, formatCurrency } from "@/contexts/SettingsContext";
import { useI18n } from "@/contexts/I18nContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarIcon, Plus, DollarSign, Users, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Clock, FileText, Download, Upload,
  PieChart, BarChart3, Wallet, Target, Calculator, Filter, FileDown
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Get current fiscal year (July start)
function getCurrentFiscalYear(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  // If we're in January-June, fiscal year started last year
  // If we're in July-December, fiscal year started this year
  if (currentMonth >= 6) { // July (6) to December (11)
    return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
  } else { // January (0) to June (5)
    return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
  }
}

interface AnnualBudget {
  id: number;
  fiscalYear: string;
  budgetName?: string;
  totalBudget: string;
  salariesBudget: string;
  operationalBudget: string;
  equipmentBudget: string;
  travelBudget: string;
  medicalBudget: string;
  facilitiesBudget: string;
  marketingBudget: string;
  otherBudget: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  seasonStartDate?: string;
  seasonEndDate?: string;
}

interface Expense {
  id: number;
  budgetId: number;
  category: string;
  subcategory?: string;
  description: string;
  amount: string;
  expenseDate: string;
  vendor?: string;
  paymentMethod?: string;
  status: string;
  createdAt: string;
}

interface SalarySummary {
  staff: number;
  players: number;
  total: number;
}

interface BudgetSummary {
  budgeted: number;
  actual: number;
  remaining: number;
  categories: {
    category: string;
    budgeted: number;
    actual: number;
    remaining: number;
    percentage: number;
  }[];
}

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


export default function AnnualBudgets() {
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const { currency } = useSettings();
  const [selectedPeriod, setSelectedPeriod] = useState("2025-26");
  const [showCreateBudget, setShowCreateBudget] = useState(false);
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
  const [expenseFilter, setExpenseFilter] = useState<string>("all");

  // Budget form state
  const [seasonStartDate, setSeasonStartDate] = useState<Date | undefined>(new Date(new Date().getFullYear(), 6, 1)); // July 1st
  const [seasonEndDate, setSeasonEndDate] = useState<Date | undefined>(new Date(new Date().getFullYear() + 1, 5, 30)); // June 30th
  const [budgetCategories, setBudgetCategories] = useState({
    operational: 0,
    equipment: 0,
    travel: 0,
    medical: 0,
    facilities: 0,
    marketing: 0,
    other: 0,
  });
  const [calculatedTotalBudget, setCalculatedTotalBudget] = useState(0);
  const [calculatedSalaryBudget, setCalculatedSalaryBudget] = useState(0);

  // Expense form state
  const [expenseCategory, setExpenseCategory] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");

  // Fetch annual budgets
  const { data: budgets, isLoading: budgetsLoading } = useQuery<AnnualBudget[]>({
    queryKey: ["/api/annual-budgets"],
  });

  // Fetch expenses for selected budget
  const { data: expenses } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", selectedBudgetId],
    enabled: !!selectedBudgetId,
  });

  // Fetch salary summary
  const { data: salarySummary } = useQuery<SalarySummary>({
    queryKey: [`/api/salary-summary/${selectedPeriod}`],
  });

  // Fetch budget vs actual summary
  const { data: budgetSummary } = useQuery<BudgetSummary>({
    queryKey: [`/api/budgets/summary/${selectedBudgetId}`],
    enabled: !!selectedBudgetId,
  });

  // Fetch payroll details
  const { data: payrollDetails } = useQuery<PayrollDetails>({
    queryKey: [`/api/payroll/${selectedPeriod}`],
  });

  // Fetch monthly breakdown
  const { data: monthlyBreakdown } = useQuery<MonthlyBreakdownItem[]>({
    queryKey: [`/api/budgets/${selectedBudgetId}/monthly-breakdown`],
    enabled: !!selectedBudgetId,
  });

  const currentBudget = budgets?.find(b => b.fiscalYear === selectedPeriod);

  // Set selectedBudgetId when currentBudget is found
  useEffect(() => {
    if (currentBudget) {
      setSelectedBudgetId(currentBudget.id);
    } else {
      setSelectedBudgetId(null);
    }
  }, [currentBudget]);

  // Calculate salary budget based on season duration
  useEffect(() => {
    if (seasonStartDate && seasonEndDate && salarySummary) {
      const monthsDiff = Math.round(
        (seasonEndDate.getTime() - seasonStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      );
      const salaryBudget = salarySummary.total * Math.max(1, monthsDiff);
      setCalculatedSalaryBudget(salaryBudget);
    }
  }, [seasonStartDate, seasonEndDate, salarySummary]);

  // Calculate total budget as sum of all categories + salary budget
  useEffect(() => {
    const categoriesSum = Object.values(budgetCategories).reduce((sum, value) => sum + value, 0);
    setCalculatedTotalBudget(categoriesSum + calculatedSalaryBudget);
  }, [budgetCategories, calculatedSalaryBudget]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (showCreateBudget) {
      // Reset to default values when opening
      setSeasonStartDate(new Date(new Date().getFullYear(), 6, 1)); // July 1st
      setSeasonEndDate(new Date(new Date().getFullYear() + 1, 5, 30)); // June 30th
      setBudgetCategories({
        operational: 0,
        equipment: 0,
        travel: 0,
        medical: 0,
        facilities: 0,
        marketing: 0,
        other: 0,
      });
    }
  }, [showCreateBudget]);

  // PDF Generation Handler
  const handleGeneratePDF = async () => {
    if (!currentBudget || !payrollDetails || !budgetSummary) {
      toast({
        title: t("budgets.monthly.toast.createErrorTitle"), // we can use the monthly ones if there aren't annual equivalents, but let's stick to what we created: budgets.annual.toast.budgetError? Wait, I didn't create a title for error here in annual, I will just use text.
        description: "Missing required data for PDF generation",
        variant: "destructive",
      });
      return;
    }

    try {
      const { BudgetPDFGenerator } = await import("@/lib/budget-pdf-generator");
      const generator = new BudgetPDFGenerator(currency);

      const reportData = {
        fiscalYear: selectedPeriod,
        budgetName: currentBudget.budgetName || currentBudget.fiscalYear,
        totalBudget: parseFloat(currentBudget.totalBudget),
        salariesBudget: parseFloat(currentBudget.salariesBudget),
        categories: budgetSummary.categories,
        payroll: {
          staff: payrollDetails.staff,
          players: payrollDetails.players,
        },
        monthlyBreakdown: monthlyBreakdown || [],
        summary: {
          staffTotal: salarySummary?.staff || 0,
          playersTotal: salarySummary?.players || 0,
          totalSalaries: salarySummary?.total || 0,
          budgeted: budgetSummary.budgeted,
          actual: budgetSummary.actual,
          remaining: budgetSummary.remaining,
        },
        currency,
      };

      generator.generateReport(reportData);
      generator.download(`budget-report-${selectedPeriod}.pdf`);

      toast({
        title: "PDF Generated",
        description: "Budget report has been downloaded successfully",
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


  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: (budget: any) => apiRequest("POST", "/api/annual-budgets", budget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/annual-budgets"] });
      setShowCreateBudget(false);
      toast({ title: t("budgets.annual.toast.budgetCreated") });
    },
    onError: (error: any) => {
      console.error("Failed to create budget:", error);
      toast({
        title: t("budgets.annual.toast.budgetError"),
        description: error.message || "Failed to create budget",
        variant: "destructive",
      });
    },
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: (expense: any) => apiRequest("POST", "/api/expenses", expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setShowCreateExpense(false);
      toast({ title: t("budgets.annual.toast.expenseAdded") });
    },
  });

  // Approve expense mutation
  const approveExpenseMutation = useMutation({
    mutationFn: (expenseId: number) => apiRequest("PATCH", `/api/expenses/${expenseId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: t("budgets.annual.toast.expenseApproved") });
    },
  });

  const handleCreateBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submitting budget form...");
    const formData = new FormData(e.currentTarget);
    // Remove "Fiscal Year " prefix if present in budgetName, or let user type what they want
    const budget = {
      fiscalYear: selectedPeriod,
      // budgetName is no longer in annual_budgets schema, so we can ignore it or store in notes?
      // Wait, checking schema: annual_budgets does NOT have budgetName field.
      // It has fiscalYear text unique.
      // I should remove budgetName from payload.
      totalBudget: calculatedTotalBudget.toString(),
      salariesBudget: calculatedSalaryBudget.toString(),
      operationalBudget: budgetCategories.operational.toString(),
      equipmentBudget: budgetCategories.equipment.toString(),
      travelBudget: budgetCategories.travel.toString(),
      medicalBudget: budgetCategories.medical.toString(),
      facilitiesBudget: budgetCategories.facilities.toString(),
      marketingBudget: budgetCategories.marketing.toString(),
      otherBudget: budgetCategories.other.toString(),
      notes: formData.get("notes"),
      createdBy: 1, // Current user ID
      seasonStartDate: seasonStartDate ? format(seasonStartDate, "yyyy-MM-dd") : undefined,
      seasonEndDate: seasonEndDate ? format(seasonEndDate, "yyyy-MM-dd") : undefined,
    };
    console.log("Budget payload:", budget);
    createBudgetMutation.mutate(budget);
  };

  const handleCategoryChange = (category: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setBudgetCategories(prev => ({
      ...prev,
      [category]: numValue,
    }));
  };

  const handleCreateExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBudgetId) {
      toast({
        title: "Error",
        description: t("budgets.annual.toast.selectBudgetError"),
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const expense = {
      budgetId: selectedBudgetId,
      category: expenseCategory,
      subcategory: formData.get("subcategory") || "",
      description: formData.get("description"),
      amount: formData.get("amount"),
      expenseDate: formData.get("expenseDate"),
      vendor: formData.get("vendor") || "",
      paymentMethod: paymentMethod,
      notes: formData.get("notes") || "",
      createdBy: 1, // Current user ID
    };

    console.log("Creating expense:", expense);
    createExpenseMutation.mutate(expense);
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      case 'paid': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredExpenses = expenses?.filter(expense =>
    expenseFilter === "all" || expense.category === expenseFilter
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("budgets.annual.title")}</h1>
          <p className="text-muted-foreground">
            {t("budgets.annual.description")}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4" />
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("budgets.annual.selectFiscalYear")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023-24">{t("budgets.annual.fiscalYearPrefix")}2023-24</SelectItem>
                <SelectItem value="2024-25">{t("budgets.annual.fiscalYearPrefix")}2024-25</SelectItem>
                <SelectItem value="2025-26">{t("budgets.annual.fiscalYearPrefix")}2025-26</SelectItem>
                <SelectItem value="2026-27">{t("budgets.annual.fiscalYearPrefix")}2026-27</SelectItem>
                <SelectItem value="2027-28">{t("budgets.annual.fiscalYearPrefix")}2027-28</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {currentBudget && (
            <Button variant="outline" onClick={handleGeneratePDF}>
              <FileDown className="h-4 w-4 mr-2" />
              {t("budgets.annual.downloadPdf")}
            </Button>
          )}
          <Button onClick={() => setShowCreateBudget(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("budgets.annual.createAllocation")}
          </Button>
        </div>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("budgets.annual.totalAllocation")}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentBudget ? formatCurrency(parseFloat(currentBudget.totalBudget), currency) : formatCurrency(0, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("budgets.annual.fiscalYearPrefix")} {selectedPeriod} {t("budgets.annual.budgetAllocation")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("budgets.annual.totalSalaries")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salarySummary ? formatCurrency(salarySummary.total * 12, currency) : formatCurrency(0, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("budgets.annual.annualStaff")} {salarySummary ? formatCurrency(salarySummary.staff * 12, currency) : formatCurrency(0, currency)} |
              {t("budgets.annual.players")} {salarySummary ? formatCurrency(salarySummary.players * 12, currency) : formatCurrency(0, currency)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("budgets.annual.actualExpenses")}</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {budgetSummary ? formatCurrency(budgetSummary.actual, currency) : formatCurrency(0, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {budgetSummary && currentBudget
                ? `${((budgetSummary.actual / parseFloat(currentBudget.totalBudget)) * 100).toFixed(1)}% ${t("budgets.annual.ofBudget")}`
                : t("budgets.annual.noBudgetSet")
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("budgets.annual.remainingBudget")}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const totalBudget = currentBudget ? parseFloat(currentBudget.totalBudget) : 0;
                const annualSalaries = (salarySummary?.total || 0) * 12;
                const actualExpenses = budgetSummary?.actual || 0;
                const remaining = totalBudget - annualSalaries - actualExpenses;

                // Determine color based on budget health
                let colorClass = "text-green-600"; // Default: healthy budget
                let statusIcon = null;

                if (remaining < 0) {
                  // Deficit - critical
                  colorClass = "text-red-600";
                  statusIcon = <AlertTriangle className="h-5 w-5 text-red-600 inline ml-2" />;
                } else if (totalBudget > 0 && remaining < totalBudget * 0.2) {
                  // Less than 20% remaining - warning
                  colorClass = "text-yellow-600";
                  statusIcon = <AlertTriangle className="h-5 w-5 text-yellow-600 inline ml-2" />;
                } else if (remaining === 0 && totalBudget === 0) {
                  // No budget set - neutral
                  colorClass = "text-gray-600";
                }

                return (
                  <span className={colorClass}>
                    {formatCurrency(remaining, currency)}
                    {statusIcon}
                  </span>
                );
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("budgets.annual.afterAnnual")}
            </p>
          </CardContent>
        </Card>
      </div>

      {currentBudget ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">{t("budgets.annual.tabs.overview")}</TabsTrigger>
            <TabsTrigger value="payroll">{t("budgets.annual.tabs.payroll")}</TabsTrigger>
            <TabsTrigger value="monthly">{t("budgets.annual.tabs.monthly")}</TabsTrigger>
            <TabsTrigger value="expenses">{t("budgets.annual.tabs.expenses")}</TabsTrigger>
            <TabsTrigger value="analysis">{t("budgets.annual.tabs.analysis")}</TabsTrigger>
          </TabsList>


          <TabsContent value="overview" className="space-y-6">
            {/* Budget Categories Progress */}
            <Card>
              <CardHeader>
                <CardTitle>{t("budgets.annual.budgetCategoriesTitle")}</CardTitle>
                <CardDescription>{t("budgets.annual.budgetCategoriesDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {budgetSummary?.categories.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="capitalize">{category.category === 'operational' ? t('budgets.annual.operational') : category.category === 'equipment' ? t('budgets.annual.equipment') : category.category === 'travel' ? t('budgets.annual.travel') : category.category === 'medical' ? t('budgets.annual.medical') : category.category === 'facilities' ? t('budgets.annual.facilities') : category.category === 'marketing' ? t('budgets.annual.marketing') : category.category === 'other' ? t('budgets.annual.other') : category.category.replace('_', ' ')}</Label>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(category.actual, currency)} / {formatCurrency(category.budgeted, currency)}
                      </div>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{category.percentage.toFixed(1)}% {t("budgets.annual.used")}</span>
                      <span>{formatCurrency(category.remaining, currency)} {t("budgets.annual.remaining")}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payroll Details Tab */}
          <TabsContent value="payroll" className="space-y-6">
            {/* Staff Payroll */}
            <Card>
              <CardHeader>
                <CardTitle>{t("budgets.annual.staffPayrollTitle")}</CardTitle>
                <CardDescription>{t("budgets.annual.staffPayrollDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("budgets.annual.table.name")}</TableHead>
                      <TableHead>{t("budgets.annual.table.role")}</TableHead>
                      <TableHead>{t("budgets.annual.table.department")}</TableHead>
                      <TableHead>{t("budgets.annual.table.employmentType")}</TableHead>
                      <TableHead>{t("budgets.annual.table.monthlySalary")}</TableHead>
                      <TableHead>{t("budgets.annual.table.contractEnd")}</TableHead>
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
                            : t("budgets.annual.table.permanent")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!payrollDetails || payrollDetails.staff.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          {t("budgets.annual.table.noStaff")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {payrollDetails && payrollDetails.staff.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20 dark:text-blue-400">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{t("budgets.annual.totalStaffSalaries")}</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(
                          payrollDetails.staff.reduce((sum, s) => sum + s.salary, 0),
                          currency
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Player Payroll */}
            <Card>
              <CardHeader>
                <CardTitle>{t("budgets.annual.playerPayrollTitle")}</CardTitle>
                <CardDescription>{t("budgets.annual.playerPayrollDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("budgets.annual.table.name")}</TableHead>
                      <TableHead>{t("budgets.annual.table.position")}</TableHead>
                      <TableHead>{t("budgets.annual.table.shirtNumber")}</TableHead>
                      <TableHead>{t("budgets.annual.table.monthlySalary")}</TableHead>
                      <TableHead>{t("budgets.annual.table.contractEnd")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollDetails?.players.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">
                          {player.firstName} {player.lastName}
                        </TableCell>
                        <TableCell className="capitalize">{player.position}</TableCell>
                        <TableCell>{player.shirtNumber || t("budgets.annual.table.na")}</TableCell>
                        <TableCell>{formatCurrency(player.monthlySalary, currency)}</TableCell>
                        <TableCell>
                          {player.contractEndDate
                            ? new Date(player.contractEndDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')
                            : t("budgets.annual.table.na")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!payrollDetails || payrollDetails.players.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          {t("budgets.annual.table.noPlayers")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {payrollDetails && payrollDetails.players.length > 0 && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg dark:bg-green-900/20 dark:text-green-400">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">{t("budgets.annual.totalPlayerSalaries")}</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(
                          payrollDetails.players.reduce((sum, p) => sum + p.monthlySalary, 0),
                          currency
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Breakdown Tab */}
          <TabsContent value="monthly" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("budgets.annual.monthlyBudgetAllocTitle")}</CardTitle>
                <CardDescription>
                  {t("budgets.annual.monthlyBudgetAllocDesc")} {selectedPeriod}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("budgets.annual.table.month")}</TableHead>
                      <TableHead>{t("budgets.annual.table.allocatedBudget")}</TableHead>
                      <TableHead>{t("budgets.annual.table.spent")}</TableHead>
                      <TableHead>{t("budgets.annual.table.remaining")}</TableHead>
                      <TableHead>{t("budgets.annual.table.usage")}</TableHead>
                      <TableHead>{t("budgets.annual.table.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyBreakdown?.map((month, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{month.month}</TableCell>
                        <TableCell>{formatCurrency(month.allocated, currency)}</TableCell>
                        <TableCell>{formatCurrency(month.spent, currency)}</TableCell>
                        <TableCell>{formatCurrency(month.remaining, currency)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={month.percentage ?? 0} className="w-16 h-2" />
                            <span>{(month.percentage ?? 0).toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(month.percentage ?? 0) < 80 ? (
                            <Badge className="bg-green-500">{t("budgets.annual.status.onTrack")}</Badge>
                          ) : (month.percentage ?? 0) < 100 ? (
                            <Badge className="bg-yellow-500">{t("budgets.annual.status.warning")}</Badge>
                          ) : (
                            <Badge className="bg-red-500">{t("budgets.annual.status.overBudget")}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!monthlyBreakdown || monthlyBreakdown.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          {t("budgets.annual.table.noMonthlyData")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {monthlyBreakdown && monthlyBreakdown.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20 dark:text-blue-400">
                      <div className="text-sm text-muted-foreground">{t("budgets.annual.totalAllocated")}</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(
                          monthlyBreakdown.reduce((sum, m) => sum + m.allocated, 0),
                          currency
                        )}
                      </div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400">
                      <div className="text-sm text-muted-foreground">{t("budgets.annual.totalSpent")}</div>
                      <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(
                          monthlyBreakdown.reduce((sum, m) => sum + m.spent, 0),
                          currency
                        )}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg dark:bg-green-900/20 dark:text-green-400">
                      <div className="text-sm text-muted-foreground">{t("budgets.annual.totalRemaining")}</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(
                          monthlyBreakdown.reduce((sum, m) => sum + m.remaining, 0),
                          currency
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Select value={expenseFilter} onValueChange={setExpenseFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t("budgets.annual.filterByCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("budgets.annual.allCategories")}</SelectItem>
                    <SelectItem value="operational">{t("budgets.annual.operational")}</SelectItem>
                    <SelectItem value="equipment">{t("budgets.annual.equipment")}</SelectItem>
                    <SelectItem value="travel">{t("budgets.annual.travel")}</SelectItem>
                    <SelectItem value="medical">{t("budgets.annual.medical")}</SelectItem>
                    <SelectItem value="facilities">{t("budgets.annual.facilities")}</SelectItem>
                    <SelectItem value="marketing">{t("budgets.annual.marketing")}</SelectItem>
                    <SelectItem value="other">{t("budgets.annual.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => {
                if (currentBudget) {
                  setSelectedBudgetId(currentBudget.id);
                  setShowCreateExpense(true);
                }
              }}>
                <Plus className="h-4 w-4 mr-2" />
                {t("budgets.annual.addExpense")}
              </Button>
            </div>

            {/* Expenses Table */}
            <Card>
              <CardHeader>
                <CardTitle>{t("budgets.annual.expenseTrackingTitle")}</CardTitle>
                <CardDescription>{t("budgets.annual.expenseTrackingDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("budgets.annual.table.date")}</TableHead>
                      <TableHead>{t("budgets.annual.table.category")}</TableHead>
                      <TableHead>{t("budgets.annual.table.description")}</TableHead>
                      <TableHead>{t("budgets.annual.table.vendor")}</TableHead>
                      <TableHead>{t("budgets.annual.table.amount")}</TableHead>
                      <TableHead>{t("budgets.annual.table.status")}</TableHead>
                      <TableHead>{t("budgets.annual.table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{new Date(expense.expenseDate).toLocaleDateString()}</TableCell>
                        <TableCell className="capitalize">{expense.category}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>{expense.vendor || "-"}</TableCell>
                        <TableCell>{formatCurrency(parseFloat(expense.amount), currency)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(expense.status)}>
                            {expense.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {expense.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveExpenseMutation.mutate(expense.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t("budgets.annual.table.approve")}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("budgets.annual.analysisTitle")}</CardTitle>
                  <CardDescription>{t("budgets.annual.analysisDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {budgetSummary && (
                    <div className="space-y-4">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {budgetSummary.remaining > 0
                            ? t("budgets.annual.underBudget").replace('{0}', formatCurrency(budgetSummary.remaining, currency))
                            : t("budgets.annual.overBudget").replace('{0}', formatCurrency(Math.abs(budgetSummary.remaining), currency))
                          }
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>{t("budgets.annual.budgetUtilization")}</span>
                          <span>{((budgetSummary.actual / budgetSummary.budgeted) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress
                          value={(budgetSummary.actual / budgetSummary.budgeted) * 100}
                          className="h-3"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("budgets.annual.salaryBreakdownTitle")}</CardTitle>
                  <CardDescription>{t("budgets.annual.salaryBreakdownDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {salarySummary && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20 dark:text-blue-400">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(salarySummary.staff, currency)}
                          </div>
                          <div className="text-sm text-blue-600">{t("budgets.annual.staffSalariesLabel")}</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg dark:bg-green-900/20 dark:text-green-400">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(salarySummary.players, currency)}
                          </div>
                          <div className="text-sm text-green-600">{t("budgets.annual.playerSalariesLabel")}</div>
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg dark:bg-gray-900/20">
                        <div className="text-3xl font-bold">
                          {formatCurrency(salarySummary.total, currency)}
                        </div>
                        <div className="text-sm text-muted-foreground">{t("budgets.annual.totalMonthlySalaries")}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("budgets.annual.noBudgetTitle")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("budgets.annual.noBudgetDesc")} {selectedPeriod} {t("budgets.annual.toStartTracking")}
            </p>
            <Button onClick={() => setShowCreateBudget(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("budgets.annual.createBudgetFor")} {selectedPeriod}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Budget Dialog */}
      <Dialog open={showCreateBudget} onOpenChange={setShowCreateBudget}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Fiscal Year Budget</DialogTitle>
            <DialogDescription>
              Set up budget allocations for fiscal year {selectedPeriod}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBudget} className="space-y-4">
            {/* Budget Name input removed as it is not needed for annual budgets */}
            <input type="hidden" name="fiscalYear" value={selectedPeriod} />

            {/* Season Duration */}
            <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <Label className="text-base font-semibold">Budget Duration (Season Dates)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Select the start and end dates for this budget period
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seasonStart">Season Start</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !seasonStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {seasonStartDate ? format(seasonStartDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={seasonStartDate}
                        onSelect={setSeasonStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seasonEnd">Season End</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !seasonEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {seasonEndDate ? format(seasonEndDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={seasonEndDate}
                        onSelect={setSeasonEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              {seasonStartDate && seasonEndDate && (
                <p className="text-xs text-blue-600 font-medium mt-2">
                  Duration: {Math.round((seasonEndDate.getTime() - seasonStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44))} months
                </p>
              )}
            </div>

            {/* Salary Budget - Auto-calculated */}
            <div className="space-y-2 p-4 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
              <Label>Salary Budget (Auto-calculated)</Label>
              <Input
                value={formatCurrency(calculatedSalaryBudget, currency)}
                disabled
                className="bg-white dark:bg-gray-800 font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                Based on current monthly salaries ({formatCurrency(salarySummary?.total || 0, currency)}) × selected duration
              </p>
            </div>

            {/* Budget Categories */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Budget Categories</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operationalBudget">Operational</Label>
                  <Input
                    id="operationalBudget"
                    name="operationalBudget"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={budgetCategories.operational || ''}
                    onChange={(e) => handleCategoryChange('operational', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipmentBudget">Equipment</Label>
                  <Input
                    id="equipmentBudget"
                    name="equipmentBudget"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={budgetCategories.equipment || ''}
                    onChange={(e) => handleCategoryChange('equipment', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="travelBudget">Travel</Label>
                  <Input
                    id="travelBudget"
                    name="travelBudget"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={budgetCategories.travel || ''}
                    onChange={(e) => handleCategoryChange('travel', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicalBudget">Medical</Label>
                  <Input
                    id="medicalBudget"
                    name="medicalBudget"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={budgetCategories.medical || ''}
                    onChange={(e) => handleCategoryChange('medical', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facilitiesBudget">Facilities</Label>
                  <Input
                    id="facilitiesBudget"
                    name="facilitiesBudget"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={budgetCategories.facilities || ''}
                    onChange={(e) => handleCategoryChange('facilities', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marketingBudget">Marketing</Label>
                  <Input
                    id="marketingBudget"
                    name="marketingBudget"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={budgetCategories.marketing || ''}
                    onChange={(e) => handleCategoryChange('marketing', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherBudget">Other</Label>
              <Input
                id="otherBudget"
                name="otherBudget"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={budgetCategories.other || ''}
                onChange={(e) => handleCategoryChange('other', e.target.value)}
              />
            </div>

            {/* Total Budget - Auto-calculated */}
            <div className="space-y-2 p-4 bg-purple-50 rounded-lg border border-purple-200 dark:bg-purple-900/20 dark:border-purple-800">
              <Label className="text-base font-semibold">Total Budget (Auto-calculated)</Label>
              <Input
                value={formatCurrency(calculatedTotalBudget, currency)}
                disabled
                className="bg-white dark:bg-gray-800 font-bold text-lg"
              />
              <p className="text-xs text-muted-foreground">
                Sum of all category budgets + salary budget = {formatCurrency(Object.values(budgetCategories).reduce((sum, val) => sum + val, 0), currency)} + {formatCurrency(calculatedSalaryBudget, currency)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional budget notes or guidelines..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateBudget(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createBudgetMutation.isPending}>
                {createBudgetMutation.isPending ? "Creating..." : "Create Budget"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Expense Dialog */}
      <Dialog open={showCreateExpense} onOpenChange={setShowCreateExpense}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Record a new expense for the current budget
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={expenseCategory} onValueChange={setExpenseCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="facilities">Facilities</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Brief description of the expense"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input
                  id="vendor"
                  name="vendor"
                  placeholder="Supplier or vendor name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenseDate">Expense Date</Label>
                <Input
                  id="expenseDate"
                  name="expenseDate"
                  type="date"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional notes about this expense..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateExpense(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createExpenseMutation.isPending}>
                {createExpenseMutation.isPending ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
