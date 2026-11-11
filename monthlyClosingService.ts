import { Invoice, Expense, AdjustmentNote, MonthlySalesClosing } from './types';
import { safeStorage } from './safeStorage';

export const CLOSINGS_STORAGE_KEY = 'carryint_monthly_closings';

/**
 * Loads all finalized monthly sales closings from storage
 */
export const getStoredMonthlyClosings = (): MonthlySalesClosing[] => {
  return safeStorage.getJSON<MonthlySalesClosing[]>(CLOSINGS_STORAGE_KEY, []) || [];
};

/**
 * Saves or updates a monthly sales closing record in storage
 */
export const saveMonthlyClosingToStorage = (closing: MonthlySalesClosing): MonthlySalesClosing[] => {
  const current = getStoredMonthlyClosings();
  const existingIdx = current.findIndex(c => c.month === closing.month || c.id === closing.id);
  
  let updated: MonthlySalesClosing[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = closing;
  } else {
    updated = [...current, closing];
  }

  // Sort descending by month
  updated.sort((a, b) => b.month.localeCompare(a.month));
  safeStorage.setJSON(CLOSINGS_STORAGE_KEY, updated);
  return updated;
};

/**
 * Removes or re-opens a closed monthly sales cycle
 */
export const reopenMonthlyClosingInStorage = (monthOrId: string): MonthlySalesClosing[] => {
  const current = getStoredMonthlyClosings();
  const updated = current.filter(c => c.month !== monthOrId && c.id !== monthOrId);
  safeStorage.setJSON(CLOSINGS_STORAGE_KEY, updated);
  return updated;
};

/**
 * Computes next month string given "YYYY-MM"
 */
export const getNextMonthStr = (monthStr: string): string => {
  const [yStr, mStr] = monthStr.split('-');
  let year = parseInt(yStr, 10);
  let month = parseInt(mStr, 10);
  if (month === 12) {
    year += 1;
    month = 1;
  } else {
    month += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
};

/**
 * Computes previous month string given "YYYY-MM"
 */
export const getPrevMonthStr = (monthStr: string): string => {
  const [yStr, mStr] = monthStr.split('-');
  let year = parseInt(yStr, 10);
  let month = parseInt(mStr, 10);
  if (month === 1) {
    year -= 1;
    month = 12;
  } else {
    month -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
};

/**
 * Returns month display name, e.g. "2026-11" -> "November 2026"
 */
export const formatMonthDisplay = (monthStr: string): string => {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

/**
 * Determines which sales cycle an invoice or expense is effectively attributed to.
 * 
 * CORE BUSINESS RULE:
 * If a month (e.g. Nov 2026) is closed as of Nov 28th:
 * - Items dated <= Nov 28th belong to Nov 2026.
 * - Items dated > Nov 28th (e.g. Nov 29, 30) roll forward to Dec 2026!
 * (Their original invoice date remains completely untouched in the document).
 */
export const getEffectiveSalesMonth = (
  dateStr: string,
  closings: MonthlySalesClosing[] = []
): string => {
  if (!dateStr) return '';
  const dateKey = dateStr.slice(0, 10); // YYYY-MM-DD
  const baseMonth = dateKey.slice(0, 7); // YYYY-MM

  // Check if base month was closed
  const monthClosing = closings.find(c => c.month === baseMonth && c.isClosed);
  if (monthClosing) {
    // If invoice date is AFTER the closing cutoff date, roll it forward into next month!
    if (dateKey > monthClosing.cutoffDate) {
      const nextMonth = getNextMonthStr(baseMonth);
      // Recursively check if the next month is also closed
      return getEffectiveSalesMonthForRolled(dateKey, nextMonth, closings);
    }
    return baseMonth;
  }

  // If base month is NOT closed, check if previous month was closed with a cutoff
  // and whether this date was rolled into base month
  return baseMonth;
};

const getEffectiveSalesMonthForRolled = (
  dateKey: string,
  targetMonth: string,
  closings: MonthlySalesClosing[]
): string => {
  const targetClosing = closings.find(c => c.month === targetMonth && c.isClosed);
  if (targetClosing) {
    if (dateKey > targetClosing.cutoffDate) {
      const nextMonth = getNextMonthStr(targetMonth);
      return getEffectiveSalesMonthForRolled(dateKey, nextMonth, closings);
    }
  }
  return targetMonth;
};

/**
 * Checks whether an invoice is locked into a finalized monthly closing
 */
export const isInvoiceInFinalizedClosing = (
  invoice: Invoice,
  closings: MonthlySalesClosing[] = []
): MonthlySalesClosing | null => {
  if (!invoice || !closings || closings.length === 0) return null;

  for (const closing of closings) {
    if (!closing.isClosed) continue;
    // When includedInvoiceIds exists, it is authoritative!
    if (Array.isArray(closing.includedInvoiceIds)) {
      if (closing.includedInvoiceIds.includes(invoice.id)) {
        return closing;
      }
    } else {
      const invDate = (invoice.date || '').slice(0, 10);
      const start = (closing.startDate || `${closing.month}-01`).slice(0, 10);
      const end = (closing.cutoffDate || `${closing.month}-31`).slice(0, 10);
      if (invDate >= start && invDate <= end) {
        return closing;
      }
    }
  }

  return null;
};

/**
 * Filters invoices by sales cycle:
 * - 'active': Excludes invoices already locked in past finalized closings;
 *             Includes new invoices entered after cutoff date (rolled forward) + current open month.
 * - 'all': All invoices across all time.
 * - 'YYYY-MM': Specific month (if closed, returns finalized invoices; if open, returns attributed invoices).
 */
export const filterInvoicesByCycle = (
  invoices: Invoice[],
  cycle: 'active' | 'all' | string,
  closings: MonthlySalesClosing[] = []
): Invoice[] => {
  if (!Array.isArray(invoices)) return [];
  if (cycle === 'all') return invoices;

  if (cycle === 'active') {
    const closedList = closings.filter(c => c.isClosed).sort((a, b) => b.month.localeCompare(a.month));
    if (closedList.length === 0) {
      return invoices;
    }

    return invoices.filter(inv => {
      // Exclude if locked into any closed period
      if (isInvoiceInFinalizedClosing(inv, closings)) return false;
      return true;
    });
  }

  // Specific cycle requested (e.g. "2026-11")
  const specificClosing = closings.find(c => c.month === cycle && c.isClosed);
  if (specificClosing) {
    return invoices.filter(inv => {
      if (specificClosing.includedInvoiceIds && specificClosing.includedInvoiceIds.includes(inv.id)) {
        return true;
      }
      const invDate = (inv.date || '').slice(0, 10);
      const start = (specificClosing.startDate || `${cycle}-01`).slice(0, 10);
      const end = (specificClosing.cutoffDate || `${cycle}-31`).slice(0, 10);
      return invDate >= start && invDate <= end;
    });
  }

  // Open specific month
  return invoices.filter(inv => getEffectiveSalesMonth(inv.date, closings) === cycle);
};

/**
 * Filters expenses by sales cycle
 */
export const filterExpensesByCycle = (
  expenses: Expense[],
  cycle: 'active' | 'all' | string,
  closings: MonthlySalesClosing[] = []
): Expense[] => {
  if (!Array.isArray(expenses)) return [];
  if (cycle === 'all') return expenses;

  if (cycle === 'active') {
    const closedList = closings.filter(c => c.isClosed).sort((a, b) => b.month.localeCompare(a.month));
    if (closedList.length === 0) return expenses;

    const latestClosing = closedList[0];
    return expenses.filter(exp => {
      const expDate = (exp.date || '').slice(0, 10);
      if (expDate > latestClosing.cutoffDate) return true;
      const effectiveMonth = getEffectiveSalesMonth(exp.date, closings);
      return effectiveMonth > latestClosing.month;
    });
  }

  // Specific cycle
  const specificClosing = closings.find(c => c.month === cycle && c.isClosed);
  if (specificClosing) {
    return expenses.filter(exp => {
      const expDate = (exp.date || '').slice(0, 10);
      const start = (specificClosing.startDate || `${cycle}-01`).slice(0, 10);
      const end = (specificClosing.cutoffDate || `${cycle}-31`).slice(0, 10);
      return expDate >= start && expDate <= end;
    });
  }

  return expenses.filter(exp => getEffectiveSalesMonth(exp.date, closings) === cycle);
};

/**
 * Filters adjustments by sales cycle
 */
export const filterAdjustmentsByCycle = (
  adjustments: AdjustmentNote[],
  cycle: 'active' | 'all' | string,
  closings: MonthlySalesClosing[] = []
): AdjustmentNote[] => {
  if (!Array.isArray(adjustments)) return [];
  if (cycle === 'all') return adjustments;

  if (cycle === 'active') {
    const closedList = closings.filter(c => c.isClosed).sort((a, b) => b.month.localeCompare(a.month));
    if (closedList.length === 0) return adjustments;

    const latestClosing = closedList[0];
    return adjustments.filter(adj => {
      const adjDate = (adj.date || '').slice(0, 10);
      if (adjDate > latestClosing.cutoffDate) return true;
      const effectiveMonth = getEffectiveSalesMonth(adj.date, closings);
      return effectiveMonth > latestClosing.month;
    });
  }

  // Specific cycle
  const specificClosing = closings.find(c => c.month === cycle && c.isClosed);
  if (specificClosing) {
    return adjustments.filter(adj => {
      const adjDate = (adj.date || '').slice(0, 10);
      const start = (specificClosing.startDate || `${cycle}-01`).slice(0, 10);
      const end = (specificClosing.cutoffDate || `${cycle}-31`).slice(0, 10);
      return adjDate >= start && adjDate <= end;
    });
  }

  return adjustments.filter(adj => getEffectiveSalesMonth(adj.date, closings) === cycle);
};

/**
 * Previews and auto-calculates financial metrics for a target closing month & cutoff date
 */
export const calculateClosingPreview = (
  targetMonth: string, // "YYYY-MM"
  cutoffDate: string,  // "YYYY-MM-DD"
  invoices: Invoice[],
  expenses: Expense[],
  adjustmentNotes: AdjustmentNote[],
  closings: MonthlySalesClosing[] = []
) => {
  // Determine start date: day after prior month's cutoff date, or 1st of month
  const prevMonth = getPrevMonthStr(targetMonth);
  const prevClosing = closings.find(c => c.month === prevMonth && c.isClosed);
  
  let startDate = `${targetMonth}-01`;
  if (prevClosing && prevClosing.cutoffDate) {
    const prevCutoff = new Date(prevClosing.cutoffDate);
    prevCutoff.setDate(prevCutoff.getDate() + 1);
    const y = prevCutoff.getFullYear();
    const m = String(prevCutoff.getMonth() + 1).padStart(2, '0');
    const d = String(prevCutoff.getDate()).padStart(2, '0');
    startDate = `${y}-${m}-${d}`;
  }

  // Eligible invoices for this month closing
  const eligibleInvoices = invoices.filter(inv => {
    // Cannot be in any prior closed month
    const priorClosing = closings.find(c => c.month < targetMonth && c.isClosed);
    if (priorClosing && isInvoiceInFinalizedClosing(inv, [priorClosing])) return false;

    const invDate = (inv.date || '').slice(0, 10);
    return invDate >= startDate && invDate <= cutoffDate;
  });

  // Invoices entered in this target month after cutoff date (Rolled forward to next month!)
  const rolledForwardInvoices = invoices.filter(inv => {
    const invDate = (inv.date || '').slice(0, 10);
    const endOfMonth = `${targetMonth}-31`;
    return invDate > cutoffDate && invDate <= endOfMonth && invDate.startsWith(targetMonth);
  });

  // Eligible adjustments
  const eligibleAdjustments = adjustmentNotes.filter(adj => {
    const adjDate = (adj.date || '').slice(0, 10);
    return adjDate >= startDate && adjDate <= cutoffDate;
  });

  // Eligible expenses
  const eligibleExpenses = expenses.filter(exp => {
    const expDate = (exp.date || '').slice(0, 10);
    return expDate >= startDate && expDate <= cutoffDate;
  });

  // Net Adjustments
  const debitAdj = eligibleAdjustments.filter(a => a.type === 'DEBIT').reduce((s, a) => s + a.amount, 0);
  const creditAdj = eligibleAdjustments.filter(a => a.type === 'CREDIT').reduce((s, a) => s + a.amount, 0);
  const netAdj = debitAdj - creditAdj;

  // Monthly Revenue
  const totalRevenue = eligibleInvoices.reduce((s, i) => s + i.totalAmount, 0) + netAdj;

  // Gross Profit
  const grossProfit = eligibleInvoices.reduce((s, i) => s + (i.profit || 0), 0) + netAdj;

  // Vendor Payments (sum of vendor paid amounts or costs incurred)
  const vendorPayments = eligibleInvoices.reduce((s, i) => {
    if (i.vendorStatus === 'PAID') return s + (i.vendorCost || 0);
    if (i.vendorStatus === 'PARTIAL') return s + (i.vendorPaidAmount || 0);
    return s;
  }, 0);

  const vendorObligationsIncurred = eligibleInvoices.reduce((s, i) => s + (i.vendorCost || 0), 0);

  // Commission Payments
  const commissionPayments = eligibleInvoices.reduce((s, i) => {
    if (i.agentStatus === 'PAID') return s + (i.agentCommission || 0);
    return s;
  }, 0);

  const totalCommissionsIncurred = eligibleInvoices.reduce((s, i) => s + (i.agentCommission || 0), 0);

  // Company Expenses
  const companyExpenses = eligibleExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  // Net Profit: Gross Profit - Company Expenses
  const calculatedNetProfit = grossProfit - companyExpenses;

  return {
    startDate,
    cutoffDate,
    eligibleInvoices,
    rolledForwardInvoices,
    eligibleExpenses,
    eligibleAdjustments,
    totalRevenue,
    grossProfit,
    vendorPayments,
    vendorObligationsIncurred,
    commissionPayments,
    totalCommissionsIncurred,
    companyExpenses,
    calculatedNetProfit,
    defaultClosingBalance: calculatedNetProfit,
    includedInvoiceIds: eligibleInvoices.map(i => i.id)
  };
};

/**
 * Checks whether the current time is strictly within the last 3 days of the current month
 * (e.g. day >= daysInMonth - 2), and current month is NOT yet closed.
 * Once closed (even on day 1 of the last 3 days), it immediately stops showing.
 */
export const checkClosingWindow = (
  now: Date = new Date(),
  closings: MonthlySalesClosing[] = []
) => {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  const day = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysRemaining = daysInMonth - day;

  const currentMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Has current month been closed?
  const currentClosing = closings.find(c => c.month === currentMonthStr && c.isClosed) || null;
  const isCurrentMonthClosed = !!currentClosing;

  // STRICT RULE: Only active in the last 3 days of the month (e.g. days 28, 29, 30 of a 30-day month)
  // AND if the current month has NOT yet been closed.
  // Once closed, immediately becomes false and will NOT show again until NEXT month's last 3 days!
  const isLastThreeDays = day >= (daysInMonth - 2);
  const isClosingWindowActive = !isCurrentMonthClosed && isLastThreeDays;

  // Previous month metadata
  const prevDate = new Date(year, month - 1, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthName = prevDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const prevClosing = closings.find(c => c.month === prevMonthStr && c.isClosed) || null;
  const isPrevMonthUnclosed = !prevClosing;

  return {
    year,
    month,
    day,
    daysInMonth,
    daysRemaining,
    currentMonthStr,
    currentMonthName,
    isCurrentMonthClosed,
    currentClosing,
    isClosingWindowActive,
    isLastThreeDays,
    isPrevMonthUnclosed,
    prevMonthStr,
    prevMonthName
  };
};


/**
 * Dynamically calculates financials from an arbitrary set of selected invoices
 */
export const calculateTotalsForInvoices = (
  targetInvoices: Invoice[],
  eligibleAdjustments: AdjustmentNote[] = [],
  companyExpensesAmt: number = 0
) => {
  const debitAdj = eligibleAdjustments.filter(a => a.type === 'DEBIT').reduce((s, a) => s + a.amount, 0);
  const creditAdj = eligibleAdjustments.filter(a => a.type === 'CREDIT').reduce((s, a) => s + a.amount, 0);
  const netAdj = debitAdj - creditAdj;

  const totalRevenue = targetInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0) + netAdj;
  const grossProfit = targetInvoices.reduce((s, i) => s + (i.profit || 0), 0) + netAdj;

  const vendorPayments = targetInvoices.reduce((s, i) => {
    if (i.vendorStatus === 'PAID') return s + (i.vendorCost || 0);
    if (i.vendorStatus === 'PARTIAL') return s + (i.vendorPaidAmount || 0);
    return s;
  }, 0);

  const commissionPayments = targetInvoices.reduce((s, i) => {
    if (i.agentStatus === 'PAID') return s + (i.agentCommission || 0);
    return s;
  }, 0);

  const netProfit = grossProfit - companyExpensesAmt;

  return {
    totalRevenue,
    grossProfit,
    vendorPayments,
    commissionPayments,
    netProfit
  };
};
