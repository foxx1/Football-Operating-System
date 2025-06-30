import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ReportBranding {
  organizationName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  season: string;
  timezone: string;
  currency: string;
}

export interface ReportOptions {
  title: string;
  subtitle?: string;
  branding: ReportBranding;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
}

export class PDFReportGenerator {
  private doc: jsPDF;
  private branding: ReportBranding;
  private pageHeight: number;
  private pageWidth: number;
  private currentY: number;
  private margin: number = 20;

  constructor(options: ReportOptions) {
    this.doc = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.format || 'a4'
    });

    this.branding = options.branding;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.currentY = this.margin;

    this.addHeader(options.title, options.subtitle);
  }

  private addHeader(title: string, subtitle?: string) {
    // Add organization header
    this.doc.setFontSize(20);
    const [r, g, b] = this.hexToRgb(this.branding.primaryColor);
    this.doc.setTextColor(r, g, b);
    this.doc.text(this.branding.organizationName, this.margin, this.currentY);
    this.currentY += 10;

    // Add season and timestamp
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(`Season: ${this.branding.season}`, this.margin, this.currentY);
    this.doc.text(`Generated: ${format(new Date(), 'PPpp')}`, this.pageWidth - 60, this.currentY);
    this.currentY += 15;

    // Add title
    this.doc.setFontSize(16);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;

    // Add subtitle if provided
    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(subtitle, this.margin, this.currentY);
      this.currentY += 8;
    }

    // Add line separator
    const [sr, sg, sb] = this.hexToRgb(this.branding.secondaryColor);
    this.doc.setDrawColor(sr, sg, sb);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  }

  addSection(title: string) {
    this.checkPageBreak(15);
    this.doc.setFontSize(14);
    const [r, g, b] = this.hexToRgb(this.branding.primaryColor);
    this.doc.setTextColor(r, g, b);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 10;
  }

  addText(text: string, fontSize: number = 10) {
    this.checkPageBreak(8);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(0, 0, 0);
    
    const lines = this.doc.splitTextToSize(text, this.pageWidth - (this.margin * 2));
    this.doc.text(lines, this.margin, this.currentY);
    this.currentY += lines.length * (fontSize * 0.4) + 5;
  }

  addTable(headers: string[], data: (string | number)[][], options?: any) {
    this.checkPageBreak(30);
    
    const tableOptions = {
      startY: this.currentY,
      head: [headers],
      body: data,
      theme: 'striped',
      headStyles: {
        fillColor: this.hexToRgb(this.branding.primaryColor),
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [0, 0, 0]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: this.margin, right: this.margin },
      ...options
    };

    (this.doc as any).autoTable(tableOptions);
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  addPlayerStatsTable(players: any[]) {
    const headers = ['Player', 'Position', 'Matches', 'Goals', 'Assists', 'Rating'];
    const data = players.map(player => [
      `${player.firstName} ${player.lastName}`,
      player.position || 'N/A',
      player.matches || 0,
      player.goals || 0,
      player.assists || 0,
      player.rating ? player.rating.toFixed(1) : 'N/A'
    ]);

    this.addTable(headers, data);
  }

  addMatchDetails(match: any) {
    this.addSection('Match Details');
    
    const matchDate = new Date(match.date);
    this.addText(`Date: ${format(matchDate, 'PPP')}`, 11);
    this.addText(`Competition: ${match.competition || 'Friendly'}`, 11);
    this.addText(`Venue: ${match.venue || 'TBD'}`, 11);
    this.addText(`Result: ${match.homeTeam} ${match.homeScore || 0} - ${match.awayScore || 0} ${match.awayTeam}`, 11);
    
    if (match.notes) {
      this.addText(`Notes: ${match.notes}`, 10);
    }
  }

  addTrainingSessionSummary(session: any, attendance: any[]) {
    this.addSection('Training Session Summary');
    
    const sessionDate = new Date(session.date);
    this.addText(`Date: ${format(sessionDate, 'PPP')}`, 11);
    this.addText(`Type: ${session.type}`, 11);
    this.addText(`Duration: ${session.duration} minutes`, 11);
    this.addText(`Attendance: ${attendance.length} players`, 11);
    
    if (session.objectives) {
      this.addText(`Objectives: ${session.objectives}`, 10);
    }
    
    if (session.notes) {
      this.addText(`Notes: ${session.notes}`, 10);
    }

    // Add attendance table
    if (attendance.length > 0) {
      this.addSection('Attendance');
      const headers = ['Player', 'Status', 'Rating', 'Notes'];
      const data = attendance.map(att => [
        `${att.player.firstName} ${att.player.lastName}`,
        att.status,
        att.performanceRating ? att.performanceRating.toString() : 'N/A',
        att.notes || '-'
      ]);
      this.addTable(headers, data);
    }
  }

  addAnalyticsSummary(analytics: any) {
    this.addSection('Team Analytics');
    
    // Key metrics
    this.addText(`Total Matches: ${analytics.totalMatches || 0}`, 11);
    this.addText(`Wins: ${analytics.wins || 0} | Draws: ${analytics.draws || 0} | Losses: ${analytics.losses || 0}`, 11);
    this.addText(`Win Rate: ${analytics.winRate ? (analytics.winRate * 100).toFixed(1) : 0}%`, 11);
    this.addText(`Goals Scored: ${analytics.goalsScored || 0} | Goals Conceded: ${analytics.goalsConceded || 0}`, 11);
    this.addText(`Average Attendance: ${analytics.avgAttendance ? analytics.avgAttendance.toFixed(1) : 0}%`, 11);
  }

  addFooter() {
    const footerY = this.pageHeight - 15;
    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('Generated by ProCoach Team Management System', this.margin, footerY);
    this.doc.text(`Page ${this.doc.getNumberOfPages()}`, this.pageWidth - 30, footerY);
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  addPageBreak() {
    this.doc.addPage();
    this.currentY = this.margin;
  }

  formatCurrency(amount: number): string {
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'SAR': 'SR',
      'QAR': 'QR',
      'AED': 'AED',
      'OMR': 'OMR',
      'KWD': 'KD',
      'BHD': 'BD',
      'GBP': '£',
      'JPY': '¥'
    };

    const symbol = currencySymbols[this.branding.currency] || this.branding.currency;
    return `${symbol}${amount.toLocaleString()}`;
  }

  save(filename: string) {
    this.addFooter();
    this.doc.save(filename);
  }

  getBlob(): Blob {
    this.addFooter();
    return this.doc.output('blob');
  }

  getPDFDataUri(): string {
    this.addFooter();
    return this.doc.output('datauristring');
  }
}

// Report type definitions
export interface MatchReport {
  match: any;
  teamStats: any;
  playerStats: any[];
  matchEvents: any[];
}

export interface TrainingReport {
  session: any;
  attendance: any[];
  objectives: string[];
  performance: any;
}

export interface PlayerReport {
  player: any;
  stats: any;
  matches: any[];
  trainingAttendance: any[];
}

export interface TeamAnalyticsReport {
  team: any;
  season: string;
  matches: any[];
  players: any[];
  analytics: any;
}