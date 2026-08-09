import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

export interface BudgetReportData {
    fiscalYear: string;
    budgetName: string;
    totalBudget: number;
    salariesBudget: number;
    categories: {
        category: string;
        budgeted: number;
        actual: number;
        remaining: number;
        percentage: number;
    }[];
    payroll: {
        staff: Array<{
            firstName: string;
            lastName: string;
            role: string;
            department: string;
            salary: number;
            contractEndDate: string | null;
        }>;
        players: Array<{
            firstName: string;
            lastName: string;
            position: string;
            shirtNumber: number | null;
            monthlySalary: number;
            contractEndDate: string | null;
        }>;
    };
    monthlyBreakdown: Array<{
        month: string;
        allocated: number;
        spent: number;
        remaining: number;
        percentage: number;
    }>;
    summary: {
        staffTotal: number;
        playersTotal: number;
        totalSalaries: number;
        budgeted: number;
        actual: number;
        remaining: number;
    };
    currency: string;
}

export class BudgetPDFGenerator {
    private doc: jsPDF;
    private currency: string;
    private pageHeight: number;
    private pageWidth: number;
    private margin: number = 15;
    private currentY: number = 15;

    constructor(currency: string = 'USD') {
        this.doc = new jsPDF();
        this.currency = currency;
        this.pageHeight = this.doc.internal.pageSize.height;
        this.pageWidth = this.doc.internal.pageSize.width;
    }

    private formatCurrency(amount: number): string {
        const symbols: Record<string, string> = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'SAR': 'SAR ', 'AED': 'AED ',
            'EGP': 'EGP ',
        };
        const symbol = symbols[this.currency] || this.currency + ' ';
        return symbol + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    private checkPageBreak(neededSpace: number = 30): void {
        if (this.currentY + neededSpace > this.pageHeight - this.margin) {
            this.doc.addPage();
            this.currentY = this.margin;
        }
    }

    private addHeader(title: string): void {
        this.doc.setFontSize(20);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(title, this.pageWidth / 2, this.currentY, { align: 'center' });
        this.currentY += 10;

        // Add line
        this.doc.setDrawColor(200, 200, 200);
        this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
        this.currentY += 10;
    }

    private addSection(title: string): void {
        this.checkPageBreak(15);
        this.doc.setFontSize(14);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(0, 102, 204);
        this.doc.text(title, this.margin, this.currentY);
        this.currentY += 8;
        this.doc.setTextColor(0, 0, 0);
    }

    private addText(text: string, fontSize: number = 11, isBold: boolean = false): void {
        this.checkPageBreak();
        this.doc.setFontSize(fontSize);
        this.doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        this.doc.text(text, this.margin, this.currentY);
        this.currentY += 6;
    }

    generateReport(data: BudgetReportData): jsPDF {
        // Header
        this.addHeader(`Budget Report - Fiscal Year ${data.fiscalYear}`);

        // Budget Overview
        this.addSection('Budget Overview');
        this.addText(`Budget Name: ${data.budgetName}`);
        this.addText(`Total Budget: ${this.formatCurrency(data.totalBudget)}`, 11, true);
        this.addText(`Status: Active`);
        this.currentY += 5;

        // Summary Cards
        this.addSection('Financial Summary');
        const summaryData = [
            ['Total Budget', this.formatCurrency(data.summary.budgeted)],
            ['Total Expenses', this.formatCurrency(data.summary.actual)],
            ['Remaining', this.formatCurrency(data.summary.remaining)],
            ['Utilization', `${((data.summary.actual / data.summary.budgeted) * 100).toFixed(1)}%`],
        ];

        this.doc.autoTable({
            startY: this.currentY,
            head: [['Category', 'Amount']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [0, 102, 204], textColor: 255 },
            margin: { left: this.margin, right: this.margin },
        });
        this.currentY = (this.doc as any).lastAutoTable.finalY + 10;

        // Budget Categories
        this.addSection('Budget by Category');
        const categoryData = data.categories.map(cat => [
            cat.category.charAt(0).toUpperCase() + cat.category.slice(1).replace('_', ' '),
            this.formatCurrency(cat.budgeted),
            this.formatCurrency(cat.actual),
            this.formatCurrency(cat.remaining),
            `${cat.percentage.toFixed(1)}%`
        ]);

        this.doc.autoTable({
            startY: this.currentY,
            head: [['Category', 'Budgeted', 'Actual', 'Remaining', 'Used']],
            body: categoryData,
            theme: 'striped',
            headStyles: { fillColor: [0, 102, 204], textColor: 255 },
            margin: { left: this.margin, right: this.margin },
        });
        this.currentY = (this.doc as any).lastAutoTable.finalY + 10;

        // Payroll Section - Staff
        this.checkPageBreak(60);
        this.addSection('Staff Payroll');
        const staffData = data.payroll.staff.map(s => [
            `${s.firstName} ${s.lastName}`,
            s.role,
            s.department,
            this.formatCurrency(s.salary),
            s.contractEndDate || 'N/A'
        ]);

        this.doc.autoTable({
            startY: this.currentY,
            head: [['Name', 'Role', 'Department', 'Monthly Salary', 'Contract End']],
            body: staffData,
            theme: 'striped',
            headStyles: { fillColor: [0, 102, 204], textColor: 255 },
            margin: { left: this.margin, right: this.margin },
            foot: [[' ', '', 'Total Staff Salaries:', this.formatCurrency(data.summary.staffTotal), '']],
            footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
        });
        this.currentY = (this.doc as any).lastAutoTable.finalY + 10;

        // Payroll Section - Players
        this.checkPageBreak(60);
        this.addSection('Player Payroll');
        const playerData = data.payroll.players.map(p => [
            `${p.firstName} ${p.lastName}`,
            p.position,
            p.shirtNumber?.toString() || 'N/A',
            this.formatCurrency(p.monthlySalary),
            p.contractEndDate || 'N/A'
        ]);

        this.doc.autoTable({
            startY: this.currentY,
            head: [['Name', 'Position', 'Shirt #', 'Monthly Salary', 'Contract End']],
            body: playerData,
            theme: 'striped',
            headStyles: { fillColor: [0, 102, 204], textColor: 255 },
            margin: { left: this.margin, right: this.margin },
            foot: [['', '', 'Total Player Salaries:', this.formatCurrency(data.summary.playersTotal), '']],
            footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
        });
        this.currentY = (this.doc as any).lastAutoTable.finalY + 10;

        // Monthly Breakdown
        this.checkPageBreak(60);
        this.addSection('Monthly Budget Breakdown');
        const monthlyData = data.monthlyBreakdown.map(m => [
            m.month,
            this.formatCurrency(m.allocated),
            this.formatCurrency(m.spent),
            this.formatCurrency(m.remaining),
            `${m.percentage.toFixed(1)}%`
        ]);

        this.doc.autoTable({
            startY: this.currentY,
            head: [['Month', 'Allocated', 'Spent', 'Remaining', 'Used']],
            body: monthlyData,
            theme: 'grid',
            headStyles: { fillColor: [0, 102, 204], textColor: 255 },
            margin: { left: this.margin, right: this.margin },
        });
        this.currentY = (this.doc as any).lastAutoTable.finalY + 10;

        // Footer
        const totalPages = this.doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            this.doc.setPage(i);
            this.doc.setFontSize(9);
            this.doc.setTextColor(128, 128, 128);
            this.doc.text(
                `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
                this.pageWidth / 2,
                this.pageHeight - 10,
                { align: 'center' }
            );
        }

        return this.doc;
    }

    download(filename: string = 'budget-report.pdf'): void {
        this.doc.save(filename);
    }

    getBlob(): Blob {
        return this.doc.output('blob');
    }
}
