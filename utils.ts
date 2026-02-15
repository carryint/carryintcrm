
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
  }).format(amount);
};

export const numberToWords = (num: number): string => {
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const numStr = num.toString();
  if (numStr.length > 9) return 'overflow';
  const n = ('000000000' + numStr).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'crore ' : '';
  str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'lakh ' : '';
  str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'thousand ' : '';
  str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'hundred ' : '';
  str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'only' : '';
  return str.toUpperCase();
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Generates an Excel Workbook with multiple sheets
 */
export const exportToExcel = (data: { invoices: any[], customers: any[], vendors: any[] }) => {
  const wb = XLSX.utils.book_new();
  
  // Create Invoices Sheet
  const invSheet = XLSX.utils.json_to_sheet(data.invoices.map(i => ({
    'Invoice No': i.invoiceNumber,
    'Date': new Date(i.date).toLocaleDateString(),
    'Customer': i.customerName,
    'Destination': i.destinationCountry,
    'Net Amount': i.netAmount,
    'VAT': i.totalVat,
    'Total Amount': i.totalAmount,
    'Status': i.status,
    'Profit': i.profit,
    'Vendor': i.vendorName || 'N/A'
  })));
  XLSX.utils.book_append_sheet(wb, invSheet, 'Invoices');

  // Create Customers Sheet
  const custSheet = XLSX.utils.json_to_sheet(data.customers.map(c => ({
    'Name': c.name,
    'Type': c.type,
    'Contact': c.contact,
    'VAT Number': c.vatNumber || 'N/A',
    'Address': c.address
  })));
  XLSX.utils.book_append_sheet(wb, custSheet, 'Customers');

  // Create Vendors Sheet
  const vendSheet = XLSX.utils.json_to_sheet(data.vendors.map(v => ({
    'Name': v.name,
    'Contact': v.contact,
    'Address': v.address
  })));
  XLSX.utils.book_append_sheet(wb, vendSheet, 'Vendors');

  // Write file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return excelBuffer;
};

/**
 * Generates a ZIP file containing a JSON backup and the Excel report
 */
export const downloadSystemZip = async (data: any) => {
  const zip = new JSZip();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Add JSON Data
  zip.file(`carryint_backup_${timestamp}.json`, JSON.stringify(data, null, 2));
  
  // Add Excel Report
  const excelBuffer = exportToExcel({
    invoices: data.invoices,
    customers: data.customers,
    vendors: data.vendors
  });
  zip.file(`carryint_financial_report_${timestamp}.xlsx`, excelBuffer);
  
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Carryint_Full_Backup_${timestamp}.zip`;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadExcelOnly = (data: { invoices: any[], customers: any[], vendors: any[] }) => {
  const buffer = exportToExcel(data);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Carryint_Financial_Report_${new Date().toLocaleDateString()}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};
