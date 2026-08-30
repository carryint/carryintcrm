import React, { useState, useMemo } from 'react';
import {
  User,
  Invoice,
  Quotation,
  Expense,
  AdjustmentNote,
  UserRole
} from '../types';
import {
  Users,
  Clock,
  Receipt,
  TrendingUp,
  FileCheck,
  Calendar,
  Download,
  FileSpreadsheet,
  Award,
  CheckCircle2,
  AlertCircle,
  Activity,
  ShieldCheck,
  Search,
  Filter,
  ArrowUpRight,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
  UserCheck,
  Briefcase,
  Zap,
  Trophy,
  Target,
  ArrowUpDown,
  Eye,
  Hash,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface UserAnalyticsDashboardProps {
  users: User[];
  invoices: Invoice[];
  quotations: Quotation[];
  expenses: Expense[];
  adjustmentNotes: AdjustmentNote[];
  currentUser: User;
  onNavigate: (tab: string) => void;
  onViewInvoice?: (invoice: Invoice) => void;
}

export interface UserActivityItem {
  id: string;
  type: 'INVOICE_CREATE' | 'INVOICE_EDIT' | 'CARRIER_ASSIGN' | 'TRACKING_UPDATE' | 'QUOTE_CREATE' | 'EXPENSE_LOG' | 'ADJUSTMENT_NOTE';
  title: string;
  timestamp: string;
  referenceNumber: string;
  details?: string;
  amount?: number;
  status?: string;
  linkInvoice?: Invoice;
}

export interface DailyWorkSummary {
  dateStr: string;
  firstActionTime: string;
  lastActionTime: string;
  activeHours: number;
  actionsCount: number;
  invoicesCount: number;
  revenue: number;
  profit: number;
  quotesCount: number;
  activities: UserActivityItem[];
}

export interface UserPerformanceMetric {
  user: User;
  activeDaysCount: number;
  totalWorkingHours: number;
  avgDailyHours: number;
  latestActivityTimestamp: string | null;
  earliestActivityTimestamp: string | null;
  dailySummaries: DailyWorkSummary[];
  allActivities: UserActivityItem[];
  invoicesCreated: Invoice[];
  invoicesCreatedCount: number;
  invoicesProcessedCount: number;
  invoiceRevenue: number;
  invoiceProfit: number;
  profitMarginPercent: number;
  paidInvoicesCount: number;
  unpaidInvoicesCount: number;
  avgInvoiceValue: number;
  quotesCreated: Quotation[];
  quotesCreatedCount: number;
  quotesAcceptedCount: number;
  quotesAcceptedVolume: number;
  quoteConversionRate: number;
  carrierAssignmentsCount: number;
  trackingMilestonesCount: number;
  expensesLogged: Expense[];
  expensesTotalAmount: number;
  adjustmentsLogged: AdjustmentNote[];
  totalWorkUnits: number;
  revenuePerHour: number;
  profitPerHour: number;
  productivityScore: number;
}

type SortField = 'hours' | 'invoices' | 'revenue' | 'profit' | 'quotes' | 'conversion' | 'actions' | 'lastActive';
type ViewMode = 'matrix' | 'charts' | 'leaderboard';
type DatePreset = 'today' | 'yesterday' | '7days' | '30days' | 'month' | 'lastMonth' | 'all' | 'custom';

const formatCurrency = (val: number) => {
  return (val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' AED';
};

const formatHours = (hrs: number) => {
  const rounded = Math.round(hrs * 10) / 10;
  const wholeHours = Math.floor(rounded);
  const minutes = Math.round((rounded - wholeHours) * 60);
  if (wholeHours === 0 && minutes === 0) return '0 hrs';
  if (wholeHours === 0) return `${minutes} mins`;
  if (minutes === 0) return `${wholeHours} hrs`;
  return `${wholeHours}h ${minutes}m`;
};

const UserAnalyticsDashboard: React.FC<UserAnalyticsDashboardProps> = ({
  users,
  invoices,
  quotations,
  expenses,
  adjustmentNotes,
  currentUser,
  onNavigate,
  onViewInvoice,
}) => {
  const [dateFilter, setDateFilter] = useState<DatePreset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
  const [modalTab, setModalTab] = useState<'timeline' | 'invoices' | 'quotes' | 'timesheet' | 'financials'>('timeline');
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');

  // Security Guardrail: Super Admin Only
  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-lg mx-auto mt-12">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-600 mt-2">
          The Users Working Time & Work-Done Analytics Dashboard is restricted to <strong>Super Administrators</strong> only.
        </p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="mt-6 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Date filter evaluator
  const isDateInFilter = (dateStr?: string) => {
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return false;
    const now = new Date();

    if (dateFilter === 'today') {
      return itemDate.toDateString() === now.toDateString();
    }
    if (dateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      return itemDate.toDateString() === yesterday.toDateString();
    }
    if (dateFilter === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return itemDate >= sevenDaysAgo;
    }
    if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      return itemDate >= thirtyDaysAgo;
    }
    if (dateFilter === 'month') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'lastMonth') {
      const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return itemDate.getMonth() === prevMonth && itemDate.getFullYear() === prevYear;
    }
    if (dateFilter === 'custom') {
      if (customStart) {
        const start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }
      if (customEnd) {
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        if (itemDate > end) return false;
      }
      return true;
    }
    return true; // 'all'
  };

  // Helper to match user to an item
  const doesUserMatch = (user: User, targetId?: string, targetName?: string, targetEmail?: string) => {
    if (targetId && (targetId === user.id || targetId === user.email)) return true;
    if (targetEmail && targetEmail.toLowerCase() === user.email.toLowerCase()) return true;
    if (targetName && user.name && targetName.trim().toLowerCase() === user.name.trim().toLowerCase()) return true;
    return false;
  };

  // Comprehensive metric calculation per user
  const userWorkMetrics = useMemo<UserPerformanceMetric[]>(() => {
    return users.map(user => {
      const activities: UserActivityItem[] = [];

      // 1. Invoices created by user
      const userInvoicesCreated = invoices.filter(inv => {
        const match = doesUserMatch(user, inv.createdBy, inv.createdByName);
        return match && isDateInFilter(inv.date);
      });

      userInvoicesCreated.forEach(inv => {
        activities.push({
          id: `inv-create-${inv.id}`,
          type: 'INVOICE_CREATE',
          title: `Created Tax Invoice ${inv.invoiceNumber}`,
          timestamp: inv.date,
          referenceNumber: inv.invoiceNumber,
          amount: inv.totalAmount,
          status: inv.status,
          details: `Client: ${inv.customerName} | Route: UAE -> ${inv.destinationCountry}`,
          linkInvoice: inv
        });
      });

      // 2. Audit logs on all invoices (Edits, Status updates, Carrier assignments)
      let processedInvoicesCount = userInvoicesCreated.length;
      let carrierAssignmentsCount = 0;
      let trackingMilestonesCount = 0;

      invoices.forEach(inv => {
        // Carrier assigned by user
        if (inv.carrierAssignedBy && doesUserMatch(user, undefined, inv.carrierAssignedBy)) {
          carrierAssignmentsCount++;
          if (inv.carrierAssignedAt && isDateInFilter(inv.carrierAssignedAt)) {
            activities.push({
              id: `carrier-${inv.id}-${inv.carrierAssignedAt}`,
              type: 'CARRIER_ASSIGN',
              title: `Assigned Carrier ${inv.carrier || 'Logistics'} to ${inv.invoiceNumber}`,
              timestamp: inv.carrierAssignedAt,
              referenceNumber: inv.invoiceNumber,
              details: `AWB: ${inv.carrierTrackingNumber || inv.awbNumber || 'Assigned'}`,
              linkInvoice: inv
            });
          }
        }

        // Tracking milestone updates
        if (Array.isArray(inv.trackingEvents)) {
          inv.trackingEvents.forEach(ev => {
            if (ev.updatedBy && doesUserMatch(user, undefined, ev.updatedBy)) {
              trackingMilestonesCount++;
              if (ev.date && isDateInFilter(ev.date)) {
                activities.push({
                  id: `trk-${ev.id || Math.random()}`,
                  type: 'TRACKING_UPDATE',
                  title: `Updated Shipment Status: ${ev.status} for ${inv.invoiceNumber}`,
                  timestamp: ev.date,
                  referenceNumber: inv.invoiceNumber,
                  details: `${ev.location || ''} - ${ev.description || ''}`,
                  linkInvoice: inv
                });
              }
            }
          });
        }

        // Audit Logs (Edits, Audit notes)
        if (Array.isArray(inv.auditLogs)) {
          inv.auditLogs.forEach((log, idx) => {
            if (doesUserMatch(user, log.userId, log.userName) && log.action !== 'CREATE') {
              processedInvoicesCount++;
              if (log.timestamp && isDateInFilter(log.timestamp)) {
                activities.push({
                  id: `audit-${inv.id}-${idx}`,
                  type: 'INVOICE_EDIT',
                  title: `Edited Invoice ${inv.invoiceNumber}`,
                  timestamp: log.timestamp,
                  referenceNumber: inv.invoiceNumber,
                  details: log.details || `Action: ${log.action}`,
                  linkInvoice: inv
                });
              }
            }
          });
        }
      });

      // 3. Quotations created by user
      const userQuotes = quotations.filter(q => {
        const match = doesUserMatch(user, q.createdBy, q.createdByName);
        const dateToTest = q.createdAt || q.date;
        return match && isDateInFilter(dateToTest);
      });

      userQuotes.forEach(q => {
        activities.push({
          id: `quote-${q.id}`,
          type: 'QUOTE_CREATE',
          title: `Issued Quotation ${q.quotationNumber}`,
          timestamp: q.createdAt || q.date,
          referenceNumber: q.quotationNumber,
          amount: q.totalAmount,
          status: q.status,
          details: `Client: ${q.customerName} | Category: ${q.customerCategory} | Status: ${q.status}`
        });
      });

      // 4. Expenses logged by user
      const userExpenses = expenses.filter(e => {
        const match = doesUserMatch(user, e.createdBy, e.createdByName);
        return match && isDateInFilter(e.date);
      });

      userExpenses.forEach(e => {
        activities.push({
          id: `exp-${e.id}`,
          type: 'EXPENSE_LOG',
          title: `Logged Business Expense: ${e.itemDetails}`,
          timestamp: e.date,
          referenceNumber: e.paymentReference || e.id,
          amount: e.amount,
          details: `Payee: ${e.payeeName} | Method: ${e.paymentMethod}`
        });
      });

      // 5. Adjustment Notes logged by user
      const userAdjustments = adjustmentNotes.filter(n => {
        const match = doesUserMatch(user, n.createdBy, n.createdByName);
        const dateToTest = n.timestamp || n.date;
        return match && isDateInFilter(dateToTest);
      });

      userAdjustments.forEach(n => {
        activities.push({
          id: `adj-${n.id}`,
          type: 'ADJUSTMENT_NOTE',
          title: `Issued ${n.type} Note ${n.noteNumber}`,
          timestamp: n.timestamp || n.date,
          referenceNumber: n.noteNumber,
          amount: n.amount,
          details: `For Invoice ${n.originalInvoiceNumber} | Reason: ${n.reason}`
        });
      });

      // Sort all activities chronologically (newest first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // 6. Group activities by day for accurate timesheet calculation
      const dayGroups: Record<string, UserActivityItem[]> = {};
      activities.forEach(act => {
        const d = act.timestamp ? act.timestamp.split('T')[0] : 'Unknown';
        if (!dayGroups[d]) dayGroups[d] = [];
        dayGroups[d].push(act);
      });

      const dailySummaries: DailyWorkSummary[] = Object.keys(dayGroups).map(dateStr => {
        const dayActs = dayGroups[dateStr];
        const dayTimestamps = dayActs
          .map(a => new Date(a.timestamp))
          .filter(d => !isNaN(d.getTime()))
          .sort((a, b) => a.getTime() - b.getTime());

        if (dayTimestamps.length === 0) {
          return {
            dateStr,
            firstActionTime: 'N/A',
            lastActionTime: 'N/A',
            activeHours: 0,
            actionsCount: dayActs.length,
            invoicesCount: dayActs.filter(a => a.type === 'INVOICE_CREATE').length,
            revenue: dayActs.filter(a => a.type === 'INVOICE_CREATE').reduce((s, a) => s + (a.amount || 0), 0),
            profit: 0,
            quotesCount: dayActs.filter(a => a.type === 'QUOTE_CREATE').length,
            activities: dayActs
          };
        }

        const first = dayTimestamps[0];
        const last = dayTimestamps[dayTimestamps.length - 1];

        // Group into active sessions (gap threshold: 45 min, baseline focus 20 min)
        let totalMs = 0;
        let sessionStart = dayTimestamps[0].getTime();
        let sessionLast = dayTimestamps[0].getTime();
        const MAX_GAP = 45 * 60 * 1000;
        const OP_FOCUS = 20 * 60 * 1000;

        for (let i = 1; i < dayTimestamps.length; i++) {
          const t = dayTimestamps[i].getTime();
          if (t - sessionLast <= MAX_GAP) {
            sessionLast = t;
          } else {
            totalMs += Math.max(sessionLast - sessionStart + OP_FOCUS, OP_FOCUS);
            sessionStart = t;
            sessionLast = t;
          }
        }
        totalMs += Math.max(sessionLast - sessionStart + OP_FOCUS, OP_FOCUS);

        const activeHours = Math.min(Math.round((totalMs / (1000 * 60 * 60)) * 10) / 10, 12);
        const dayInvoices = userInvoicesCreated.filter(i => i.date.startsWith(dateStr));
        const dayRev = dayInvoices.reduce((s, i) => s + i.totalAmount, 0);
        const dayProf = dayInvoices.reduce((s, i) => s + (i.profit || (i.totalAmount - i.vendorCost)), 0);
        const dayQuotes = userQuotes.filter(q => (q.createdAt || q.date).startsWith(dateStr));

        return {
          dateStr,
          firstActionTime: first.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          lastActionTime: last.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          activeHours,
          actionsCount: dayActs.length,
          invoicesCount: dayInvoices.length,
          revenue: dayRev,
          profit: dayProf,
          quotesCount: dayQuotes.length,
          activities: dayActs
        };
      }).sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());

      // 7. Calculate aggregate totals
      const totalWorkingHours = dailySummaries.reduce((s, d) => s + d.activeHours, 0);
      const activeDaysCount = dailySummaries.length;
      const avgDailyHours = activeDaysCount > 0 ? Math.round((totalWorkingHours / activeDaysCount) * 10) / 10 : 0;

      const invoiceRevenue = userInvoicesCreated.reduce((s, i) => s + i.totalAmount, 0);
      const invoiceProfit = userInvoicesCreated.reduce((s, i) => s + (i.profit || (i.totalAmount - i.vendorCost)), 0);
      const profitMarginPercent = invoiceRevenue > 0 ? Math.round((invoiceProfit / invoiceRevenue) * 100) : 0;
      const paidInvoicesCount = userInvoicesCreated.filter(i => i.status === 'PAID').length;
      const unpaidInvoicesCount = userInvoicesCreated.filter(i => i.status === 'UNPAID').length;
      const avgInvoiceValue = userInvoicesCreated.length > 0 ? Math.round(invoiceRevenue / userInvoicesCreated.length) : 0;

      const quotesAccepted = userQuotes.filter(q => q.status === 'ACCEPTED');
      const quotesAcceptedCount = quotesAccepted.length;
      const quotesAcceptedVolume = quotesAccepted.reduce((s, q) => s + q.totalAmount, 0);
      const quoteConversionRate = userQuotes.length > 0
        ? Math.round((quotesAcceptedCount / userQuotes.length) * 100)
        : (userInvoicesCreated.length > 0 ? 80 : 0);

      const expensesTotalAmount = userExpenses.reduce((s, e) => s + e.amount, 0);
      const totalWorkUnits = activities.length;

      const revenuePerHour = totalWorkingHours > 0 ? Math.round(invoiceRevenue / totalWorkingHours) : 0;
      const profitPerHour = totalWorkingHours > 0 ? Math.round(invoiceProfit / totalWorkingHours) : 0;

      // Productivity score: balanced metric taking into account volume, profit, active days, conversion
      const productivityScore = Math.min(
        Math.round(
          (userInvoicesCreated.length * 15) +
          (userQuotes.length * 8) +
          (quotesAcceptedCount * 12) +
          (carrierAssignmentsCount * 5) +
          (activeDaysCount * 4) +
          (invoiceProfit > 0 ? Math.min(invoiceProfit / 500, 30) : 0)
        ),
        100
      );

      return {
        user,
        activeDaysCount,
        totalWorkingHours: Math.round(totalWorkingHours * 10) / 10,
        avgDailyHours,
        latestActivityTimestamp: activities.length > 0 ? activities[0].timestamp : null,
        earliestActivityTimestamp: activities.length > 0 ? activities[activities.length - 1].timestamp : null,
        dailySummaries,
        allActivities: activities,
        invoicesCreated: userInvoicesCreated,
        invoicesCreatedCount: userInvoicesCreated.length,
        invoicesProcessedCount: processedInvoicesCount,
        invoiceRevenue,
        invoiceProfit,
        profitMarginPercent,
        paidInvoicesCount,
        unpaidInvoicesCount,
        avgInvoiceValue,
        quotesCreated: userQuotes,
        quotesCreatedCount: userQuotes.length,
        quotesAcceptedCount,
        quotesAcceptedVolume,
        quoteConversionRate,
        carrierAssignmentsCount,
        trackingMilestonesCount,
        expensesLogged: userExpenses,
        expensesTotalAmount,
        adjustmentsLogged: userAdjustments,
        totalWorkUnits,
        revenuePerHour,
        profitPerHour,
        productivityScore
      };
    });
  }, [users, invoices, quotations, expenses, adjustmentNotes, dateFilter, customStart, customEnd]);

  // Filtered & Sorted list for display
  const displayedUserMetrics = useMemo(() => {
    const filtered = userWorkMetrics.filter(m => {
      const matchesRole = selectedRole === 'ALL' || m.user.role === selectedRole;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        m.user.name.toLowerCase().includes(q) ||
        m.user.email.toLowerCase().includes(q) ||
        (m.user.department && m.user.department.toLowerCase().includes(q));
      return matchesRole && matchesSearch;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'hours':
          comparison = a.totalWorkingHours - b.totalWorkingHours;
          break;
        case 'invoices':
          comparison = a.invoicesCreatedCount - b.invoicesCreatedCount;
          break;
        case 'revenue':
          comparison = a.invoiceRevenue - b.invoiceRevenue;
          break;
        case 'profit':
          comparison = a.invoiceProfit - b.invoiceProfit;
          break;
        case 'quotes':
          comparison = a.quotesCreatedCount - b.quotesCreatedCount;
          break;
        case 'conversion':
          comparison = a.quoteConversionRate - b.quoteConversionRate;
          break;
        case 'actions':
          comparison = a.totalWorkUnits - b.totalWorkUnits;
          break;
        case 'lastActive':
          const timeA = a.latestActivityTimestamp ? new Date(a.latestActivityTimestamp).getTime() : 0;
          const timeB = b.latestActivityTimestamp ? new Date(b.latestActivityTimestamp).getTime() : 0;
          comparison = timeA - timeB;
          break;
        default:
          comparison = a.invoiceRevenue - b.invoiceRevenue;
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [userWorkMetrics, selectedRole, searchQuery, sortField, sortAsc]);

  // Team Global Totals
  const teamTotals = useMemo(() => {
    const totalHours = displayedUserMetrics.reduce((s, u) => s + u.totalWorkingHours, 0);
    const totalInvoices = displayedUserMetrics.reduce((s, u) => s + u.invoicesCreatedCount, 0);
    const totalRevenue = displayedUserMetrics.reduce((s, u) => s + u.invoiceRevenue, 0);
    const totalProfit = displayedUserMetrics.reduce((s, u) => s + u.invoiceProfit, 0);
    const totalQuotes = displayedUserMetrics.reduce((s, u) => s + u.quotesCreatedCount, 0);
    const totalQuotesWon = displayedUserMetrics.reduce((s, u) => s + u.quotesAcceptedCount, 0);
    const totalActions = displayedUserMetrics.reduce((s, u) => s + u.totalWorkUnits, 0);
    const activeStaff = displayedUserMetrics.filter(u => u.totalWorkUnits > 0).length;
    const overallMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      totalInvoices,
      totalRevenue,
      totalProfit,
      totalQuotes,
      totalQuotesWon,
      totalActions,
      activeStaff,
      overallMargin
    };
  }, [displayedUserMetrics]);

  // Chart dataset
  const chartData = useMemo(() => {
    return displayedUserMetrics.map(m => ({
      name: m.user.name.split(' ')[0],
      fullName: m.user.name,
      revenue: Math.round(m.invoiceRevenue),
      profit: Math.round(m.invoiceProfit),
      hours: m.totalWorkingHours,
      invoices: m.invoicesCreatedCount,
      quotes: m.quotesCreatedCount,
      actions: m.totalWorkUnits
    }));
  }, [displayedUserMetrics]);

  // Top performers
  const topRevenuePerformer = useMemo(() => {
    const sorted = [...displayedUserMetrics].sort((a, b) => b.invoiceRevenue - a.invoiceRevenue);
    return sorted[0]?.invoiceRevenue > 0 ? sorted[0] : null;
  }, [displayedUserMetrics]);

  const topProfitPerformer = useMemo(() => {
    const sorted = [...displayedUserMetrics].sort((a, b) => b.invoiceProfit - a.invoiceProfit);
    return sorted[0]?.invoiceProfit > 0 ? sorted[0] : null;
  }, [displayedUserMetrics]);

  const topHoursPerformer = useMemo(() => {
    const sorted = [...displayedUserMetrics].sort((a, b) => b.totalWorkingHours - a.totalWorkingHours);
    return sorted[0]?.totalWorkingHours > 0 ? sorted[0] : null;
  }, [displayedUserMetrics]);

  const topConverter = useMemo(() => {
    const sorted = [...displayedUserMetrics].filter(m => m.quotesCreatedCount > 0).sort((a, b) => b.quoteConversionRate - a.quoteConversionRate);
    return sorted[0] || null;
  }, [displayedUserMetrics]);

  // Export to Excel (Full 4-Sheet Workbook)
  const exportUserReportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Team Productivity Summary
    const summaryRows = displayedUserMetrics.map(m => ({
      'Staff Name': m.user.name,
      'Email': m.user.email,
      'Role': m.user.role,
      'Department': m.user.department || 'Operations',
      'Active Days': m.activeDaysCount,
      'Tracked Work Hours': m.totalWorkingHours,
      'Avg Hours / Day': m.avgDailyHours,
      'Invoices Created': m.invoicesCreatedCount,
      'Invoices Processed': m.invoicesProcessedCount,
      'Sales Volume (AED)': m.invoiceRevenue,
      'Gross Profit (AED)': m.invoiceProfit,
      'Profit Margin (%)': `${m.profitMarginPercent}%`,
      'Paid Invoices': m.paidInvoicesCount,
      'Unpaid Invoices': m.unpaidInvoicesCount,
      'Avg Deal Value (AED)': m.avgInvoiceValue,
      'Quotations Created': m.quotesCreatedCount,
      'Quotations Won': m.quotesAcceptedCount,
      'Quote Conversion Rate': `${m.quoteConversionRate}%`,
      'Carrier AWBs Assigned': m.carrierAssignmentsCount,
      'Expenses Logged (AED)': m.expensesTotalAmount,
      'Total Work Operations': m.totalWorkUnits,
      'Productivity Score': `${m.productivityScore}/100`,
      'Last Active Timestamp': m.latestActivityTimestamp ? new Date(m.latestActivityTimestamp).toLocaleString() : 'N/A'
    }));
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Team Performance Summary');

    // Sheet 2: Daily Timesheet Logs
    const timesheetRows: any[] = [];
    displayedUserMetrics.forEach(m => {
      m.dailySummaries.forEach(d => {
        timesheetRows.push({
          'Staff Name': m.user.name,
          'Role': m.user.role,
          'Date': d.dateStr,
          'First Action Time': d.firstActionTime,
          'Last Action Time': d.lastActionTime,
          'Work Duration (Hours)': d.activeHours,
          'Operations Count': d.actionsCount,
          'Invoices Created': d.invoicesCount,
          'Sales Generated (AED)': d.revenue,
          'Profit Generated (AED)': d.profit,
          'Quotes Created': d.quotesCount
        });
      });
    });
    const wsTimesheet = XLSX.utils.json_to_sheet(timesheetRows);
    XLSX.utils.book_append_sheet(wb, wsTimesheet, 'Daily Work Logs');

    // Sheet 3: Invoices Created Audit
    const invoiceRows: any[] = [];
    invoices.filter(i => isDateInFilter(i.date)).forEach(inv => {
      invoiceRows.push({
        'Invoice #': inv.invoiceNumber,
        'Date': inv.date,
        'Customer': inv.customerName,
        'AWB Number': inv.awbNumber || inv.carrierTrackingNumber || 'N/A',
        'Carrier': inv.carrier || 'N/A',
        'Destination': inv.destinationCountry,
        'Total (AED)': inv.totalAmount,
        'Vendor Cost (AED)': inv.vendorCost,
        'Profit (AED)': inv.profit,
        'Status': inv.status,
        'Created By Name': inv.createdByName || 'Admin',
        'Created By ID': inv.createdBy,
        'Carrier Assigned By': inv.carrierAssignedBy || 'N/A'
      });
    });
    const wsInvoices = XLSX.utils.json_to_sheet(invoiceRows);
    XLSX.utils.book_append_sheet(wb, wsInvoices, 'Invoices List');

    // Sheet 4: Quotations Audit
    const quoteRows: any[] = [];
    quotations.filter(q => isDateInFilter(q.createdAt || q.date)).forEach(q => {
      quoteRows.push({
        'Quote #': q.quotationNumber,
        'Date': q.date,
        'Customer': q.customerName,
        'Category': q.customerCategory,
        'Total (AED)': q.totalAmount,
        'Status': q.status,
        'Created By Name': q.createdByName || 'Admin',
        'Created By ID': q.createdBy
      });
    });
    const wsQuotes = XLSX.utils.json_to_sheet(quoteRows);
    XLSX.utils.book_append_sheet(wb, wsQuotes, 'Quotations List');

    XLSX.writeFile(wb, `Carryint_Team_User_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export User Productivity Report to PDF
  const exportUserReportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('Carryint CRM - Team Working Time & Work-Done Report', 14, 15);

    doc.setFontSize(9);
    doc.text(`Generated by Super Admin: ${currentUser.name} | Period: ${dateFilter.toUpperCase()} | Date: ${new Date().toLocaleDateString()}`, 14, 22);
    doc.text(`Team Summary: ${teamTotals.activeStaff} Active Staff | ${teamTotals.totalHours} Tracked Hours | ${formatCurrency(teamTotals.totalRevenue)} Sales | ${formatCurrency(teamTotals.totalProfit)} Profit (${teamTotals.overallMargin}%)`, 14, 27);

    const tableRows = displayedUserMetrics.map(m => [
      m.user.name,
      m.user.role,
      `${m.totalWorkingHours} hrs (${m.activeDaysCount} days)`,
      m.invoicesCreatedCount.toString(),
      `${m.invoiceRevenue.toLocaleString()} AED`,
      `${m.invoiceProfit.toLocaleString()} AED (${m.profitMarginPercent}%)`,
      `${m.quotesCreatedCount} (${m.quoteConversionRate}% won)`,
      m.totalWorkUnits.toString(),
      m.latestActivityTimestamp ? new Date(m.latestActivityTimestamp).toLocaleDateString() : 'N/A'
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['Staff Name', 'Role', 'Work Time', 'Invoices', 'Sales Volume', 'Gross Profit', 'Quotes Won', 'Operations', 'Last Active']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8 }
    });

    doc.save(`Carryint_User_Productivity_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">ADMIN</span>;
      case 'MANAGER':
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">MANAGER</span>;
      case 'ACCOUNTANT':
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">ACCOUNTANT</span>;
      case 'STAFF':
      default:
        return <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">STAFF</span>;
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Banner for Super Admin */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-xl p-4 sm:p-5 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-purple-500/30 flex items-center gap-1">
                <ShieldCheck size={13} /> Super Admin Control
              </span>
              <span className="text-[11px] text-slate-300">
                Staff Working Time & Work-Done Audit Suite
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight">
              User Productivity & Performance Analytics
            </h1>
            <p className="text-slate-300 text-xs mt-0.5 max-w-2xl">
              Accurately audit individual staff members: active working hours tracked, invoices created & modified, sales volume, gross profit generated, and quotation pipeline conversions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportUserReportExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 text-xs"
              title="Download detailed multi-sheet Excel spreadsheet"
            >
              <FileSpreadsheet size={15} />
              <span>Export Team Excel</span>
            </button>
            <button
              onClick={exportUserReportPDF}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 text-xs"
              title="Download executive PDF audit report"
            >
              <Download size={15} />
              <span>Download PDF Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date, Role & Search Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Period selection */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-black text-gray-700 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Calendar size={13} className="text-orange-500" /> Period:
          </span>
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: '7 Days' },
              { id: '30days', label: '30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'lastMonth', label: 'Last Month' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                dateFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5 ml-1 animate-in fade-in">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="px-2 py-1 border border-gray-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="px-2 py-1 border border-gray-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}
        </div>

        {/* View Switcher, Role Filter, Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'matrix' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-600 hover:text-slate-900'
              }`}
            >
              <Users size={13} />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'charts' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={13} />
              <span>Charts</span>
            </button>
            <button
              onClick={() => setViewMode('leaderboard')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === 'leaderboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-600 hover:text-slate-900'
              }`}
            >
              <Trophy size={13} />
              <span>Leaders</span>
            </button>
          </div>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Super Admins</option>
            <option value="MANAGER">Managers</option>
            <option value="STAFF">Standard Staff</option>
            <option value="ACCOUNTANT">Accountants</option>
          </select>

          {/* Search Input */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-7 pr-3 py-1 border border-gray-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500 w-36 sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* Global Team KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Staff</span>
            <Users size={16} className="text-indigo-600" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mt-1">
            {teamTotals.activeStaff} / {displayedUserMetrics.length}
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Active team members with work logged</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Working Time</span>
            <Clock size={16} className="text-blue-600" />
          </div>
          <h3 className="text-xl font-black text-blue-600 mt-1">{teamTotals.totalHours} Hours</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Avg {displayedUserMetrics.length > 0 ? (teamTotals.totalHours / displayedUserMetrics.length).toFixed(1) : 0} hrs/staff
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoices Done</span>
            <Receipt size={16} className="text-orange-600" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mt-1">{teamTotals.totalInvoices} Invoices</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Vol: {formatCurrency(teamTotals.totalRevenue)}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Gross Profit</span>
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <h3 className="text-xl font-black text-emerald-800 mt-1">{formatCurrency(teamTotals.totalProfit)}</h3>
          <p className="text-[11px] text-emerald-600 mt-0.5">
            {teamTotals.overallMargin}% net team margin
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quotations Pipeline</span>
            <FileCheck size={16} className="text-purple-600" />
          </div>
          <h3 className="text-xl font-black text-purple-700 mt-1">
            {teamTotals.totalQuotesWon} / {teamTotals.totalQuotes}
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {teamTotals.totalQuotes > 0 ? Math.round((teamTotals.totalQuotesWon / teamTotals.totalQuotes) * 100) : 0}% pipeline win rate
          </p>
        </div>
      </div>

      {/* VIEW 1: MATRIX TABLE VIEW */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <UserCheck className="text-indigo-600" size={16} />
                <span>Staff Working Time & Work-Done Breakdown Matrix</span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Click on any staff row or the arrow button to inspect their detailed daily timesheet, activity timeline, and created documents.
              </p>
            </div>
            <span className="text-xs font-bold text-gray-400">
              Showing {displayedUserMetrics.length} staff members
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-4 py-2.5">Staff / User</th>
                  <th className="px-4 py-2.5">Role</th>
                  <th
                    className="px-4 py-2.5 text-center cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('hours')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Work Time</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th
                    className="px-4 py-2.5 text-center cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('invoices')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Invoices</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th
                    className="px-4 py-2.5 text-right cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('revenue')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Sales Volume</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th
                    className="px-4 py-2.5 text-right cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('profit')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Gross Profit</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th
                    className="px-4 py-2.5 text-center cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('quotes')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Quotes & Win</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th
                    className="px-4 py-2.5 text-center cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('actions')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Operations</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th
                    className="px-4 py-2.5 cursor-pointer hover:text-slate-900 transition-colors"
                    onClick={() => handleSort('lastActive')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Last Active</span>
                      <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="px-4 py-2.5 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {displayedUserMetrics.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-gray-400">
                      No staff members matching selected criteria.
                    </td>
                  </tr>
                ) : (
                  displayedUserMetrics.map(m => (
                    <tr
                      key={m.user.id}
                      onClick={() => {
                        setSelectedUserDetail(m.user);
                        setModalTab('timeline');
                      }}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-sm flex-shrink-0">
                            {m.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-gray-900 block group-hover:text-indigo-600 transition-colors">
                              {m.user.name}
                            </strong>
                            <span className="text-[11px] text-gray-400 block">{m.user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {getRoleBadge(m.user.role)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-gray-800 bg-blue-50 px-2 py-0.5 rounded text-xs">
                          <Clock size={11} className="text-blue-500" />
                          {formatHours(m.totalWorkingHours)}
                        </span>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {m.activeDaysCount} active {m.activeDaysCount === 1 ? 'day' : 'days'}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="font-black text-gray-900">{m.invoicesCreatedCount}</div>
                        <div className="text-[10px] text-gray-400">
                          {m.paidInvoicesCount} Paid · {m.unpaidInvoicesCount} Unpaid
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="font-black text-gray-900">{formatCurrency(m.invoiceRevenue)}</div>
                        <div className="text-[10px] text-gray-400">
                          Avg {formatCurrency(m.avgInvoiceValue)}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="font-black text-emerald-600">{formatCurrency(m.invoiceProfit)}</div>
                        <div className="text-[10px] text-emerald-700">
                          {m.profitMarginPercent}% margin
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="font-bold text-gray-800">{m.quotesCreatedCount} Quotes</div>
                        <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                          m.quoteConversionRate >= 70 ? 'bg-green-100 text-green-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {m.quotesAcceptedCount} Won ({m.quoteConversionRate}%)
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full text-xs">
                          {m.totalWorkUnits}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-500 text-[11px]">
                        {m.latestActivityTimestamp
                          ? new Date(m.latestActivityTimestamp).toLocaleDateString()
                          : 'No recent activity'}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserDetail(m.user);
                            setModalTab('timeline');
                          }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                          title="Open deep audit inspection"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: VISUAL CHARTS VIEW */}
      {viewMode === 'charts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sales Volume vs Gross Profit Chart */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-gray-900">Sales Volume vs Gross Profit by Staff</h3>
                  <p className="text-xs text-gray-400">Direct financial contributions per team member</p>
                </div>
                <TrendingUp size={16} className="text-emerald-600" />
              </div>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${val / 1000}k`} />
                    <Tooltip
                      formatter={(val: number) => [`${val.toLocaleString()} AED`, '']}
                      labelFormatter={(label) => `Staff: ${label}`}
                      contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="revenue" name="Sales Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Gross Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tracked Work Hours vs Completed Invoices */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-gray-900">Work Hours vs Invoices Produced</h3>
                  <p className="text-xs text-gray-400">Effort investment versus output volume</p>
                </div>
                <Clock size={16} className="text-blue-600" />
              </div>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#3b82f6" fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" stroke="#f97316" fontSize={11} />
                    <Tooltip
                      labelFormatter={(label) => `Staff: ${label}`}
                      contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar yAxisId="left" dataKey="hours" name="Tracked Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="invoices" name="Invoices Created" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: LEADERBOARDS & RECOGNITION */}
      {viewMode === 'leaderboard' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Top Revenue */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/60 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Revenue Leader</span>
              <Trophy size={18} className="text-amber-600" />
            </div>
            {topRevenuePerformer ? (
              <div>
                <h4 className="text-base font-black text-slate-900">{topRevenuePerformer.user.name}</h4>
                <p className="text-lg font-black text-amber-700 mt-1">{formatCurrency(topRevenuePerformer.invoiceRevenue)}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{topRevenuePerformer.invoicesCreatedCount} invoices generated</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No revenue data in this period.</p>
            )}
          </div>

          {/* Top Profit */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200/60 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Profit Driver</span>
              <Award size={18} className="text-emerald-600" />
            </div>
            {topProfitPerformer ? (
              <div>
                <h4 className="text-base font-black text-slate-900">{topProfitPerformer.user.name}</h4>
                <p className="text-lg font-black text-emerald-700 mt-1">{formatCurrency(topProfitPerformer.invoiceProfit)}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{topProfitPerformer.profitMarginPercent}% net margin rate</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No profit recorded in this period.</p>
            )}
          </div>

          {/* Most Active Hours */}
          <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-200/60 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Most Dedicated Time</span>
              <Clock size={18} className="text-blue-600" />
            </div>
            {topHoursPerformer ? (
              <div>
                <h4 className="text-base font-black text-slate-900">{topHoursPerformer.user.name}</h4>
                <p className="text-lg font-black text-blue-700 mt-1">{formatHours(topHoursPerformer.totalWorkingHours)}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{topHoursPerformer.activeDaysCount} active working days</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No hours logged in this period.</p>
            )}
          </div>

          {/* Top Deal Closer */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-200/60 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-purple-800 uppercase tracking-widest">Top Quote Closer</span>
              <Target size={18} className="text-purple-600" />
            </div>
            {topConverter ? (
              <div>
                <h4 className="text-base font-black text-slate-900">{topConverter.user.name}</h4>
                <p className="text-lg font-black text-purple-700 mt-1">{topConverter.quoteConversionRate}% Win Rate</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{topConverter.quotesAcceptedCount} of {topConverter.quotesCreatedCount} quotes closed</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No quotations logged in this period.</p>
            )}
          </div>
        </div>
      )}

      {/* INDIVIDUAL STAFF AUDIT DRILLDOWN MODAL */}
      {selectedUserDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            {(() => {
              const metric = userWorkMetrics.find(m => m.user.id === selectedUserDetail.id);
              if (!metric) return null;

              return (
                <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-lg flex-shrink-0">
                      {selectedUserDetail.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white">{selectedUserDetail.name}</h3>
                        {getRoleBadge(selectedUserDetail.role)}
                      </div>
                      <p className="text-xs text-slate-300">{selectedUserDetail.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Productivity Score</span>
                      <span className="text-sm font-black text-emerald-400">{metric.productivityScore} / 100</span>
                    </div>
                    <button
                      onClick={() => setSelectedUserDetail(null)}
                      className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Modal Sub-Tabs */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto">
              {[
                { id: 'timeline', label: 'Activity Feed & Audit Log', icon: Activity },
                { id: 'timesheet', label: 'Daily Timesheets', icon: Clock },
                { id: 'invoices', label: 'Invoices Created', icon: Receipt },
                { id: 'quotes', label: 'Quotations', icon: FileCheck },
                { id: 'financials', label: 'Expenses & Adjustments', icon: TrendingUp },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setModalTab(tab.id as any)}
                    className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      modalTab === tab.id
                        ? 'border-indigo-600 text-indigo-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {(() => {
                const metric = userWorkMetrics.find(m => m.user.id === selectedUserDetail.id);
                if (!metric) return <p className="text-gray-400 text-center py-8">No data found for this user.</p>;

                return (
                  <>
                    {/* Top User KPI Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
                        <span className="text-[10px] font-bold text-blue-700 uppercase">Work Time</span>
                        <p className="text-base font-black text-blue-900 mt-0.5">{formatHours(metric.totalWorkingHours)}</p>
                        <span className="text-[10px] text-blue-600 block mt-0.5">{metric.activeDaysCount} active days ({metric.avgDailyHours}h/day)</span>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Invoices Created</span>
                        <p className="text-base font-black text-gray-900 mt-0.5">{metric.invoicesCreatedCount}</p>
                        <span className="text-[10px] text-gray-500 block mt-0.5">{metric.paidInvoicesCount} Paid · {metric.unpaidInvoicesCount} Unpaid</span>
                      </div>
                      <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Sales Volume</span>
                        <p className="text-base font-black text-gray-900 mt-0.5">{formatCurrency(metric.invoiceRevenue)}</p>
                        <span className="text-[10px] text-gray-500 block mt-0.5">Avg: {formatCurrency(metric.avgInvoiceValue)}</span>
                      </div>
                      <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">Gross Profit</span>
                        <p className="text-base font-black text-emerald-800 mt-0.5">{formatCurrency(metric.invoiceProfit)}</p>
                        <span className="text-[10px] text-emerald-600 block mt-0.5">{metric.profitMarginPercent}% net margin rate</span>
                      </div>
                    </div>

                    {/* TAB 1: CHRONOLOGICAL ACTIVITY TIMELINE */}
                    {modalTab === 'timeline' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                            Chronological Activity Log ({metric.allActivities.length} Operations)
                          </h4>
                          <span className="text-[11px] text-gray-400">All audit actions with exact timestamps</span>
                        </div>

                        {metric.allActivities.length === 0 ? (
                          <p className="text-center py-10 text-xs text-gray-400 border border-dashed rounded-xl">
                            No operational actions recorded for this user in the selected period.
                          </p>
                        ) : (
                          <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 max-h-96 overflow-y-auto">
                            {metric.allActivities.map((act) => (
                              <div key={act.id} className="p-3 hover:bg-gray-50 transition-colors flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase ${
                                      act.type === 'INVOICE_CREATE' ? 'bg-orange-100 text-orange-800' :
                                      act.type === 'INVOICE_EDIT' ? 'bg-indigo-100 text-indigo-800' :
                                      act.type === 'CARRIER_ASSIGN' ? 'bg-slate-800 text-white' :
                                      act.type === 'QUOTE_CREATE' ? 'bg-purple-100 text-purple-800' :
                                      act.type === 'EXPENSE_LOG' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {act.type.replace('_', ' ')}
                                    </span>
                                    <strong className="text-xs font-bold text-gray-900">{act.title}</strong>
                                    {act.status && (
                                      <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded bg-gray-100 text-gray-700">
                                        {act.status}
                                      </span>
                                    )}
                                  </div>
                                  {act.details && (
                                    <p className="text-[11px] text-gray-500">{act.details}</p>
                                  )}
                                </div>

                                <div className="text-right flex-shrink-0">
                                  {act.amount !== undefined && (
                                    <span className="text-xs font-black text-gray-900 block">{formatCurrency(act.amount)}</span>
                                  )}
                                  <span className="text-[10px] text-gray-400 block mt-0.5">
                                    {new Date(act.timestamp).toLocaleString()}
                                  </span>
                                  {act.linkInvoice && onViewInvoice && (
                                    <button
                                      onClick={() => {
                                        onViewInvoice(act.linkInvoice!);
                                        setSelectedUserDetail(null);
                                      }}
                                      className="text-[10px] font-bold text-orange-600 hover:underline inline-flex items-center gap-0.5 mt-0.5"
                                    >
                                      <span>View Invoice</span>
                                      <ExternalLink size={10} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 2: DAILY TIMESHEETS */}
                    {modalTab === 'timesheet' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                            Daily Work Timesheets ({metric.dailySummaries.length} Days Active)
                          </h4>
                          <span className="text-[11px] text-gray-400">First action to last action working session breakdown</span>
                        </div>

                        {metric.dailySummaries.length === 0 ? (
                          <p className="text-center py-10 text-xs text-gray-400 border border-dashed rounded-xl">
                            No daily timesheets available for this period.
                          </p>
                        ) : (
                          <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                <tr>
                                  <th className="px-3 py-2.5">Date</th>
                                  <th className="px-3 py-2.5">First Action</th>
                                  <th className="px-3 py-2.5">Last Action</th>
                                  <th className="px-3 py-2.5 text-center">Tracked Work Duration</th>
                                  <th className="px-3 py-2.5 text-center">Operations</th>
                                  <th className="px-3 py-2.5 text-center">Invoices</th>
                                  <th className="px-3 py-2.5 text-right">Revenue Generated</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 font-medium">
                                {metric.dailySummaries.map(d => (
                                  <tr key={d.dateStr} className="hover:bg-gray-50">
                                    <td className="px-3 py-2.5 font-bold text-gray-900">{d.dateStr}</td>
                                    <td className="px-3 py-2.5 text-gray-600">{d.firstActionTime}</td>
                                    <td className="px-3 py-2.5 text-gray-600">{d.lastActionTime}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs">
                                        {formatHours(d.activeHours)}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center font-bold text-slate-700">{d.actionsCount}</td>
                                    <td className="px-3 py-2.5 text-center font-bold text-orange-600">{d.invoicesCount}</td>
                                    <td className="px-3 py-2.5 text-right font-black text-gray-900">
                                      {d.revenue > 0 ? formatCurrency(d.revenue) : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 3: INVOICES CREATED */}
                    {modalTab === 'invoices' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                            Invoices Generated by {selectedUserDetail.name} ({metric.invoicesCreated.length})
                          </h4>
                          <span className="text-[11px] text-gray-400">Click any row to inspect invoice preview</span>
                        </div>

                        {metric.invoicesCreated.length === 0 ? (
                          <p className="text-center py-10 text-xs text-gray-400 border border-dashed rounded-xl">
                            No invoices generated by this user in the selected period.
                          </p>
                        ) : (
                          <div className="border border-gray-100 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-0 border-b border-gray-100">
                                <tr>
                                  <th className="px-3 py-2.5">Invoice #</th>
                                  <th className="px-3 py-2.5">Date</th>
                                  <th className="px-3 py-2.5">Customer</th>
                                  <th className="px-3 py-2.5">Destination</th>
                                  <th className="px-3 py-2.5 text-right">Amount</th>
                                  <th className="px-3 py-2.5 text-right">Profit</th>
                                  <th className="px-3 py-2.5 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 font-medium">
                                {metric.invoicesCreated.map(inv => (
                                  <tr
                                    key={inv.id}
                                    className="hover:bg-orange-50/50 cursor-pointer transition-colors"
                                    onClick={() => {
                                      if (onViewInvoice) {
                                        onViewInvoice(inv);
                                        setSelectedUserDetail(null);
                                      }
                                    }}
                                  >
                                    <td className="px-3 py-2.5 font-bold text-orange-600">{inv.invoiceNumber}</td>
                                    <td className="px-3 py-2.5 text-gray-500">{new Date(inv.date).toLocaleDateString()}</td>
                                    <td className="px-3 py-2.5 font-bold text-gray-900">{inv.customerName}</td>
                                    <td className="px-3 py-2.5 text-gray-600">{inv.destinationCountry}</td>
                                    <td className="px-3 py-2.5 text-right font-black text-gray-900">{formatCurrency(inv.totalAmount)}</td>
                                    <td className="px-3 py-2.5 text-right font-black text-emerald-600">{formatCurrency(inv.profit || 0)}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-full ${
                                        inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                      }`}>
                                        {inv.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 4: QUOTATIONS */}
                    {modalTab === 'quotes' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                            Quotations Logged by {selectedUserDetail.name} ({metric.quotesCreated.length})
                          </h4>
                          <span className="text-[11px] text-gray-400">Quotation offers and customer conversions</span>
                        </div>

                        {metric.quotesCreated.length === 0 ? (
                          <p className="text-center py-10 text-xs text-gray-400 border border-dashed rounded-xl">
                            No quotations logged by this user in the selected period.
                          </p>
                        ) : (
                          <div className="border border-gray-100 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-0 border-b border-gray-100">
                                <tr>
                                  <th className="px-3 py-2.5">Quote #</th>
                                  <th className="px-3 py-2.5">Date</th>
                                  <th className="px-3 py-2.5">Customer</th>
                                  <th className="px-3 py-2.5">Category</th>
                                  <th className="px-3 py-2.5 text-right">Total</th>
                                  <th className="px-3 py-2.5 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 font-medium">
                                {metric.quotesCreated.map(q => (
                                  <tr key={q.id} className="hover:bg-purple-50/40">
                                    <td className="px-3 py-2.5 font-bold text-purple-600">{q.quotationNumber}</td>
                                    <td className="px-3 py-2.5 text-gray-500">{new Date(q.date).toLocaleDateString()}</td>
                                    <td className="px-3 py-2.5 font-bold text-gray-900">{q.customerName}</td>
                                    <td className="px-3 py-2.5 text-gray-600">{q.customerCategory}</td>
                                    <td className="px-3 py-2.5 text-right font-black text-gray-900">{formatCurrency(q.totalAmount)}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-full ${
                                        q.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                                        q.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-100 text-gray-600'
                                      }`}>
                                        {q.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 5: FINANCIALS (EXPENSES & ADJUSTMENTS) */}
                    {modalTab === 'financials' && (
                      <div className="space-y-4">
                        {/* Expenses */}
                        <div>
                          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2">
                            Expenses Logged ({metric.expensesLogged.length})
                          </h4>
                          {metric.expensesLogged.length === 0 ? (
                            <p className="text-xs text-gray-400 py-4 text-center border border-dashed rounded-lg">No expenses logged.</p>
                          ) : (
                            <div className="border border-gray-100 rounded-xl overflow-hidden">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                                  <tr>
                                    <th className="px-3 py-2">Date</th>
                                    <th className="px-3 py-2">Details</th>
                                    <th className="px-3 py-2">Payee</th>
                                    <th className="px-3 py-2">Method</th>
                                    <th className="px-3 py-2 text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {metric.expensesLogged.map(e => (
                                    <tr key={e.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 text-gray-500">{new Date(e.date).toLocaleDateString()}</td>
                                      <td className="px-3 py-2 font-bold text-gray-900">{e.itemDetails}</td>
                                      <td className="px-3 py-2 text-gray-700">{e.payeeName}</td>
                                      <td className="px-3 py-2 text-gray-500">{e.paymentMethod}</td>
                                      <td className="px-3 py-2 text-right font-black text-red-600">{formatCurrency(e.amount)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Adjustment Notes */}
                        <div>
                          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-2">
                            Credit / Debit Adjustment Notes ({metric.adjustmentsLogged.length})
                          </h4>
                          {metric.adjustmentsLogged.length === 0 ? (
                            <p className="text-xs text-gray-400 py-4 text-center border border-dashed rounded-lg">No adjustment notes issued.</p>
                          ) : (
                            <div className="border border-gray-100 rounded-xl overflow-hidden">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                                  <tr>
                                    <th className="px-3 py-2">Note #</th>
                                    <th className="px-3 py-2">Type</th>
                                    <th className="px-3 py-2">Original Invoice</th>
                                    <th className="px-3 py-2">Reason</th>
                                    <th className="px-3 py-2 text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {metric.adjustmentsLogged.map(n => (
                                    <tr key={n.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 font-bold text-gray-900">{n.noteNumber}</td>
                                      <td className="px-3 py-2">
                                        <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-full ${
                                          n.type === 'CREDIT' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          {n.type} NOTE
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 font-medium text-gray-700">{n.originalInvoiceNumber}</td>
                                      <td className="px-3 py-2 text-gray-500">{n.reason}</td>
                                      <td className="px-3 py-2 text-right font-black text-gray-900">{formatCurrency(n.amount)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAnalyticsDashboard;
