import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, MonthlySalesClosing, CompanyInfo } from './types';
import { formatCurrency } from './utils';
import { COMPANY_INFO as DEFAULT_COMPANY_INFO } from './constants';
import { formatMonthDisplay } from './monthlyClosingService';

export interface ExportClosingPDFParams {
  closing: MonthlySalesClosing | {
    id?: string;
    month: string;
    monthName?: string;
    startDate: string;
    cutoffDate: string;
    totalRevenue: number;
    grossProfit: number;
    vendorPayments: number;
    commissionPayments: number;
    companyExpenses: number;
    netProfit: number;
    closingBalance: number;
    notes?: string;
    isClosed?: boolean;
    closedByName?: string;
    closedAt?: string;
    includedInvoiceIds?: string[];
  };
  invoices: Invoice[];
  companyInfo?: CompanyInfo;
  authorizedByName?: string;
  isDraft?: boolean;
}

/**
 * Generates and downloads an official Monthly Sales Closing Statement PDF
 */
export const downloadMonthlyClosingPDF = ({
  closing,
  invoices,
  companyInfo,
  authorizedByName,
  isDraft = false
}: ExportClosingPDFParams): void => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const comp = companyInfo || DEFAULT_COMPANY_INFO;
    const monthName = closing.monthName || formatMonthDisplay(closing.month);
    const authorName = authorizedByName || closing.closedByName || 'Finance Director';
    const statusText = isDraft
      ? 'CLOSING REVENUE PREVIEW / DRAFT'
      : closing.isClosed
      ? 'FINALIZED & OFFICIALLY SEALED'
      : 'ACTIVE SALES CYCLE AUDIT';

    // Header Banner (Dark Charcoal / Orange accent)
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 38, 'F');

    // Orange Accent Border
    doc.setFillColor(249, 115, 22); // orange-500
    doc.rect(0, 38, 210, 2, 'F');

    // Header Brand Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(comp.name.toUpperCase(), 15, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`${comp.address} | Tel: ${comp.contact} | Email: ${comp.email}`, 15, 21);
    doc.text(`TRN: ${(comp as any)?.trn || '100456209800003'} | Official Financial Statement`, 15, 27);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(251, 146, 60); // orange-400
    doc.text(`STATUS: ${statusText}`, 15, 33);

    // Document Title Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(`MONTHLY SALES CLOSING & REVENUE REPORT`, 15, 48);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Reporting Period: ${monthName} (${closing.startDate} to ${closing.cutoffDate}) | Cutoff Date: ${closing.cutoffDate}`, 15, 54);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Authorized By: ${authorName}`, 15, 59);

    // Section 1: Executive Financial Summary Table
    const summaryHeaders = [['Financial Metric', 'Amount (AED)', 'Operational Context']];
    const revenue = closing.totalRevenue || 0;
    const grossProfit = closing.grossProfit || 0;
    const netProfit = closing.netProfit || 0;
    const grossMarginPct = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : '0.0';
    const netMarginPct = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0.0';

    const summaryRows = [
      ['Monthly Billed Revenue', formatCurrency(revenue), 'Total invoice billing & net adjustments'],
      ['Direct Shipment / Carrier Costs', formatCurrency(revenue - grossProfit), 'Freight line haul, air waybill, & courier tariffs'],
      ['Gross Profit Contribution', formatCurrency(grossProfit), `Gross Margin: ${grossMarginPct}% on sales`],
      ['Vendor Payments Disbursed', formatCurrency(closing.vendorPayments || 0), 'Settled carrier and supplier obligations'],
      ['Broker & Commission Disbursed', formatCurrency(closing.commissionPayments || 0), 'Agent fees and partner commissions settled'],
      ['Company Operating Expenses', formatCurrency(closing.companyExpenses || 0), 'Office rent, utilities, overhead & staff costs'],
      ['Calculated Net Profit', formatCurrency(netProfit), `Net Operating Margin: ${netMarginPct}% retained`],
      ['CONFIRMED MONTH CLOSING BALANCE', formatCurrency(closing.closingBalance || 0), 'Officially certified closing profit balance in accounts']
    ];

    autoTable(doc, {
      startY: 64,
      head: summaryHeaders,
      body: summaryRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 70 },
        1: { fontStyle: 'bold', halign: 'right', cellWidth: 45 },
        2: { fontSize: 7.5, textColor: [100, 116, 139], cellWidth: 65 }
      },
      didParseCell: (data) => {
        if (data.row.index === summaryRows.length - 1 && data.section === 'body') {
          data.cell.styles.fillColor = [254, 243, 199]; // amber-100
          data.cell.styles.textColor = [180, 83, 9];   // amber-700
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 15, right: 15 }
    });

    let nextY = (doc as any).lastAutoTable.finalY + 8;

    // Accounting Rule Notice Box
    doc.setFillColor(254, 242, 242);
    doc.rect(15, nextY, 180, 13, 'F');
    doc.setDrawColor(251, 146, 60);
    doc.rect(15, nextY, 180, 13, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(194, 65, 12);
    doc.text('POST-CUTOFF SALES ROLL-FORWARD NOTICE:', 18, nextY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(75, 85, 99);
    doc.text(`Invoices entered after cutoff date (${closing.cutoffDate}) automatically roll forward to next month's sales report. Original dates on individual customer billing invoices remain intact.`, 18, nextY + 9.5);

    nextY += 18;

    // Section 2: Included Invoices
    const targetInvoices = Array.isArray(closing.includedInvoiceIds) && closing.includedInvoiceIds.length > 0
      ? invoices.filter(inv => closing.includedInvoiceIds?.includes(inv.id))
      : invoices.filter(inv => {
          const invDate = (inv.date || '').slice(0, 10);
          return invDate >= closing.startDate && invDate <= closing.cutoffDate;
        });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`INVOICES & SHIPMENTS FINALIZED IN THIS MONTH (${targetInvoices.length} Consignments)`, 15, nextY);

    const invoiceHeaders = [['#', 'Invoice Number', 'Date', 'Customer Name', 'Destination', 'Total (AED)', 'Profit (AED)']];
    const invoiceRows = targetInvoices.map((inv, idx) => [
      (idx + 1).toString(),
      inv.invoiceNumber || '-',
      (inv.date || '').slice(0, 10),
      (inv.customerName || '-').slice(0, 24),
      (inv.destinationCountry || '-').slice(0, 16),
      formatCurrency(inv.totalAmount || 0),
      formatCurrency(inv.profit || 0)
    ]);

    const totalBilledSum = targetInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const totalProfitSum = targetInvoices.reduce((s, i) => s + (i.profit || 0), 0);
    invoiceRows.push([
      '',
      `Total: ${targetInvoices.length}`,
      '',
      'Consolidated Schedule Totals',
      '',
      formatCurrency(totalBilledSum),
      formatCurrency(totalProfitSum)
    ]);

    autoTable(doc, {
      startY: nextY + 4,
      head: invoiceHeaders,
      body: invoiceRows,
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { fontStyle: 'bold', cellWidth: 26 },
        2: { cellWidth: 20 },
        3: { cellWidth: 48 },
        4: { cellWidth: 26 },
        5: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
        6: { halign: 'right', cellWidth: 26 }
      },
      didParseCell: (data) => {
        if (data.row.index === invoiceRows.length - 1 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
      margin: { left: 15, right: 15 }
    });

    // Section 3: Auditor Signatures & Notes
    let signY = (doc as any).lastAutoTable.finalY + 9;
    if (signY > 240) {
      doc.addPage();
      signY = 25;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('AUDITOR & MANAGEMENT SIGN-OFF:', 15, signY);

    if (closing.notes) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Notes: "${closing.notes}"`, 15, signY + 4.5);
      signY += 5;
    }

    signY += 11;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);

    // Left: Prepared By
    doc.line(15, signY, 85, signY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(`Prepared By: ${authorName}`, 15, signY + 3.5);
    doc.text(`Date & Stamp: ______________________`, 15, signY + 7);

    // Right: Executive Approval
    doc.line(125, signY, 195, signY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('Authorized Finance Director / Managing Director', 125, signY + 3.5);
    doc.text(`Approval Signature: __________________`, 125, signY + 7);

    const safeMonthStr = closing.month.replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`Carryint_Sales_Closing_${safeMonthStr}_${Date.now()}.pdf`);
  } catch (error) {
    console.error('Failed to generate closing PDF:', error);
    alert('Could not export PDF statement. Please try again.');
  }
};

/**
 * Generates an Executive Multi-Month Comparative Sales Closing Statement PDF
 */
export const downloadAllMonthsClosingSummaryPDF = (
  closings: MonthlySalesClosing[],
  companyInfo?: CompanyInfo,
  authorizedByName?: string
): void => {
  try {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for columnar comparison!
    const comp = companyInfo || DEFAULT_COMPANY_INFO;
    const authorName = authorizedByName || 'Executive Finance Office';

    // Header Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 34, 'F');
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 34, 297, 2, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(comp.name.toUpperCase(), 15, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`${comp.address} | Tel: ${comp.contact} | Email: ${comp.email}`, 15, 19);
    doc.text(`TRN: ${(comp as any)?.trn || '100456209800003'} | Consolidated Multi-Period Closing Statement`, 15, 25);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(251, 146, 60);
    doc.text(`AUDIT TRAIL: ${closings.length} FINALIZED PERIODS`, 15, 30);

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(`ALL MONTHS SALES CLOSING CONSOLIDATED REPORT`, 15, 43);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Exported: ${new Date().toLocaleString()} | Certified By: ${authorName}`, 15, 48);

    // Sort chronologically ascending for multi-month statement
    const sorted = [...closings].sort((a, b) => a.month.localeCompare(b.month));

    const headers = [[
      'Period',
      'Cutoff Date',
      'Invoices',
      'Revenue (AED)',
      'Direct Costs',
      'Gross Profit',
      'Gross %',
      'Vendor Pay',
      'Commissions',
      'Expenses',
      'Net Profit',
      'Net %',
      'Closing Balance'
    ]];

    let totRev = 0, totGross = 0, totVendor = 0, totComm = 0, totExp = 0, totNet = 0, totBal = 0, totInvs = 0;

    const rows = sorted.map(c => {
      const invCount = c.includedInvoiceIds ? c.includedInvoiceIds.length : 0;
      const gPct = c.totalRevenue > 0 ? ((c.grossProfit / c.totalRevenue) * 100).toFixed(1) : '0.0';
      const nPct = c.totalRevenue > 0 ? ((c.netProfit / c.totalRevenue) * 100).toFixed(1) : '0.0';
      const directCosts = c.totalRevenue - c.grossProfit;

      totRev += c.totalRevenue;
      totGross += c.grossProfit;
      totVendor += c.vendorPayments;
      totComm += c.commissionPayments;
      totExp += c.companyExpenses;
      totNet += c.netProfit;
      totBal += c.closingBalance;
      totInvs += invCount;

      return [
        c.monthName || c.month,
        c.cutoffDate,
        invCount.toString(),
        formatCurrency(c.totalRevenue),
        formatCurrency(directCosts),
        formatCurrency(c.grossProfit),
        `${gPct}%`,
        formatCurrency(c.vendorPayments),
        formatCurrency(c.commissionPayments),
        formatCurrency(c.companyExpenses),
        formatCurrency(c.netProfit),
        `${nPct}%`,
        formatCurrency(c.closingBalance)
      ];
    });

    // Total Row
    const overallGPct = totRev > 0 ? ((totGross / totRev) * 100).toFixed(1) : '0.0';
    const overallNPct = totRev > 0 ? ((totNet / totRev) * 100).toFixed(1) : '0.0';
    rows.push([
      'CONSOLIDATED TOTALS',
      '-',
      totInvs.toString(),
      formatCurrency(totRev),
      formatCurrency(totRev - totGross),
      formatCurrency(totGross),
      `${overallGPct}%`,
      formatCurrency(totVendor),
      formatCurrency(totComm),
      formatCurrency(totExp),
      formatCurrency(totNet),
      `${overallNPct}%`,
      formatCurrency(totBal)
    ]);

    autoTable(doc, {
      startY: 52,
      head: headers,
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { cellWidth: 20 },
        2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'right', fontStyle: 'bold', cellWidth: 24 },
        4: { halign: 'right', cellWidth: 22 },
        5: { halign: 'right', fontStyle: 'bold', cellWidth: 22 },
        6: { halign: 'center', cellWidth: 15 },
        7: { halign: 'right', cellWidth: 22 },
        8: { halign: 'right', cellWidth: 20 },
        9: { halign: 'right', cellWidth: 22 },
        10: { halign: 'right', fontStyle: 'bold', cellWidth: 24 },
        11: { halign: 'center', cellWidth: 15 },
        12: { halign: 'right', fontStyle: 'bold', cellWidth: 24 }
      },
      didParseCell: (data) => {
        if (data.row.index === rows.length - 1 && data.section === 'body') {
          data.cell.styles.fillColor = [254, 243, 199];
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      margin: { left: 15, right: 15 }
    });

    const signY = (doc as any).lastAutoTable.finalY + 12;
    if (signY < 185) {
      doc.setDrawColor(203, 213, 225);
      doc.line(15, signY + 10, 95, signY + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`Certified By: ${authorName}`, 15, signY + 14);

      doc.line(195, signY + 10, 275, signY + 10);
      doc.text('Managing Director / Board Sign-off', 195, signY + 14);
    }

    doc.save(`Carryint_All_Months_Closing_Consolidated_${Date.now()}.pdf`);
  } catch (error) {
    console.error('Failed to export multi-month summary:', error);
    alert('Could not export consolidated PDF statement.');
  }
};
