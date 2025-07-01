import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSettings, formatCurrency } from "@/contexts/SettingsContext";
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
  PieChart, BarChart3, Wallet, Target, Calculator, Filter
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

interface MonthlyBudget {
  id: number;
  month: string;
  budgetName: string;
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



export default function MonthlyBudgets() {
  const { toast } = useToast();
  const { currency } = useSettings();
  const [selectedPeriod, setSelectedPeriod] = useState("2025-26");
  const [showCreateBudget, setShowCreateBudget] = useState(false);
  const [showCreateExpense, setShowCreateExpense] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null);
  const [expenseFilter, setExpenseFilter] = useState<string>("");

  // Fetch budgets
  const { data: budgets, isLoading: budgetsLoading } = useQuery<MonthlyBudget[]>({
    queryKey: ["/api/budgets"],
  });

  // Fetch expenses for selected budget
  const { data: expenses } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", selectedBudgetId],
    enabled: !!selectedBudgetId,
  });

  // Fetch salary summary
  const { data: salarySummary } = useQuery<SalarySummary>({
    queryKey: [`/api/budgets/salary-summary/${selectedPeriod}`],
  });

  // Fetch budget vs actual summary
  const { data: budgetSummary } = useQuery<BudgetSummary>({
    queryKey: ["/api/budgets/summary", selectedBudgetId],
    enabled: !!selectedBudgetId,
  });

  const currentBudget = budgets?.find(b => b.month === selectedPeriod);
  
  // Set selectedBudgetId when currentBudget is found
  useEffect(() => {
    if (currentBudget) {
      setSelectedBudgetId(currentBudget.id);
    } else {
      setSelectedBudgetId(null);
    }
  }, [currentBudget]);

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: (budget: any) => apiRequest("/api/budgets", "POST", budget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      setShowCreateBudget(false);
      toast({ title: "Budget created successfully!" });
    },
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: (expense: any) => apiRequest("/api/expenses", "POST", expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setShowCreateExpense(false);
      toast({ title: "Expense added successfully!" });
    },
  });

  // Approve expense mutation
  const approveExpenseMutation = useMutation({
    mutationFn: (expenseId: number) => apiRequest(`/api/expenses/${expenseId}/approve`, "PATCH"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense approved!" });
    },
  });

  const handleCreateBudget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const budget = {
      month: selectedPeriod,
      budgetName: formData.get("budgetName"),
      totalBudget: formData.get("totalBudget"),
      salariesBudget: salarySummary?.total || 0,
      operationalBudget: formData.get("operationalBudget"),
      equipmentBudget: formData.get("equipmentBudget"),
      travelBudget: formData.get("travelBudget"),
      medicalBudget: formData.get("medicalBudget"),
      facilitiesBudget: formData.get("facilitiesBudget"),
      marketingBudget: formData.get("marketingBudget"),
      otherBudget: formData.get("otherBudget"),
      notes: formData.get("notes"),
      createdBy: 1, // Current user ID
    };
    createBudgetMutation.mutate(budget);
  };

  const handleCreateExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const expense = {
      budgetId: selectedBudgetId,
      category: formData.get("category"),
      subcategory: formData.get("subcategory"),
      description: formData.get("description"),
      amount: formData.get("amount"),
      expenseDate: formData.get("expenseDate"),
      vendor: formData.get("vendor"),
      paymentMethod: formData.get("paymentMethod"),
      notes: formData.get("notes"),
      createdBy: 1, // Current user ID
    };
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
    !expenseFilter || expense.category === expenseFilter
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fiscal Year Budgets</h1>
          <p className="text-muted-foreground">
            Manage fiscal year budgets, track expenses, and monitor salary costs
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4" />
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select fiscal year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023-24">Fiscal Year 2023-24</SelectItem>
                <SelectItem value="2024-25">Fiscal Year 2024-25</SelectItem>
                <SelectItem value="2025-26">Fiscal Year 2025-26</SelectItem>
                <SelectItem value="2026-27">Fiscal Year 2026-27</SelectItem>
                <SelectItem value="2027-28">Fiscal Year 2027-28</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={showCreateBudget} onOpenChange={setShowCreateBudget}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentBudget ? formatCurrency(parseFloat(currentBudget.totalBudget), currency) : formatCurrency(0, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Fiscal Year {selectedPeriod} budget allocation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Salaries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salarySummary ? formatCurrency(salarySummary.total, currency) : formatCurrency(0, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Staff: {salarySummary ? formatCurrency(salarySummary.staff, currency) : formatCurrency(0, currency)} | 
              Players: {salarySummary ? formatCurrency(salarySummary.players, currency) : formatCurrency(0, currency)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Expenses</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {budgetSummary ? formatCurrency(budgetSummary.actual, currency) : formatCurrency(0, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {budgetSummary && currentBudget 
                ? `${((budgetSummary.actual / parseFloat(currentBudget.totalBudget)) * 100).toFixed(1)}% of budget`
                : "No budget set"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {budgetSummary ? formatCurrency(budgetSummary.remaining, currency) : formatCurrency(0, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for spending
            </p>
          </CardContent>
        </Card>
      </div>

      {currentBudget ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Budget Overview</TabsTrigger>
            <TabsTrigger value="expenses">Expense Management</TabsTrigger>
            <TabsTrigger value="analysis">Budget Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Budget Categories Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Categories</CardTitle>
                <CardDescription>Track spending across different budget categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {budgetSummary?.categories.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="capitalize">{category.category.replace('_', ' ')}</Label>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(category.actual, currency)} / {formatCurrency(category.budgeted, currency)}
                      </div>
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{category.percentage.toFixed(1)}% used</span>
                      <span>{formatCurrency(category.remaining, currency)} remaining</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Select value={expenseFilter} onValueChange={setExpenseFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
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
              <Dialog open={showCreateExpense} onOpenChange={setShowCreateExpense}>
                <DialogTrigger asChild>
                  <Button onClick={() => setSelectedBudgetId(currentBudget.id)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>

            {/* Expenses Table */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Tracking</CardTitle>
                <CardDescription>Monitor and approve club expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
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
                              Approve
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
                  <CardTitle>Budget vs Actual Analysis</CardTitle>
                  <CardDescription>Compare planned vs actual spending</CardDescription>
                </CardHeader>
                <CardContent>
                  {budgetSummary && (
                    <div className="space-y-4">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          {budgetSummary.remaining > 0 
                            ? `You are ${formatCurrency(budgetSummary.remaining, currency)} under budget this month.`
                            : `You are ${formatCurrency(Math.abs(budgetSummary.remaining), currency)} over budget this month.`
                          }
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Budget Utilization</span>
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
                  <CardTitle>Salary Breakdown</CardTitle>
                  <CardDescription>Monthly staff and player salary costs</CardDescription>
                </CardHeader>
                <CardContent>
                  {salarySummary && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(salarySummary.staff, currency)}
                          </div>
                          <div className="text-sm text-blue-600">Staff Salaries</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(salarySummary.players, currency)}
                          </div>
                          <div className="text-sm text-green-600">Player Salaries</div>
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-3xl font-bold">
                          {formatCurrency(salarySummary.total, currency)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Monthly Salaries</div>
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
            <h3 className="text-lg font-semibold mb-2">No Budget Found</h3>
            <p className="text-muted-foreground mb-4">
              Create a budget for fiscal year {selectedPeriod} to start tracking expenses
            </p>
            <Button onClick={() => setShowCreateBudget(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Budget for {selectedPeriod}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Budget Dialog */}
      <Dialog open={showCreateBudget} onOpenChange={setShowCreateBudget}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Fiscal Year Budget</DialogTitle>
            <DialogDescription>
              Set up budget allocations for fiscal year {selectedPeriod}
            </DialogDescription>
          </DialogHeader>
        <form onSubmit={handleCreateBudget} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetName">Budget Name</Label>
              <Input
                id="budgetName"
                name="budgetName"
                placeholder="e.g., Monthly Operations Budget"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalBudget">Total Budget</Label>
              <Input
                id="totalBudget"
                name="totalBudget"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Salary Budget (Auto-calculated)</Label>
            <Input
              value={salarySummary ? formatCurrency(salarySummary.total, currency) : "Loading..."}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-muted-foreground">
              Based on current staff and player contracts
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operationalBudget">Operational</Label>
              <Input
                id="operationalBudget"
                name="operationalBudget"
                type="number"
                step="0.01"
                placeholder="0.00"
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
              />
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
            />
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
        <DialogContent>
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
                <Select name="category" required>
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
              <Select name="paymentMethod">
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