import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import {
  Upload,
  Archive,
  FileJson,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  ArrowRight,
  Database,
  Users,
  FileSpreadsheet,
  Receipt,
  Building2,
  DollarSign,
  FileText,
  Sparkles
} from 'lucide-react';
import { Invoice, Customer, Vendor, Expense, AdjustmentNote, CompanyInfo, User } from '../types';
import { supabase } from '../supabase';

interface SmartBackupRestoreProps {
  currentInvoices: Invoice[];
  currentCustomers: Customer[];
  currentVendors: Vendor[];
  currentExpenses: Expense[];
  currentAdjustmentNotes: AdjustmentNote[];
  currentCompanyInfo: CompanyInfo;
  currentUsers: User[];
  onDataRestored: (data: {
    invoices: Invoice[];
    customers: Customer[];
    vendors: Vendor[];
    expenses: Expense[];
    adjustmentNotes: AdjustmentNote[];
    companyInfo?: CompanyInfo;
    users?: User[];
  }) => void;
}

interface AnalysisResult {
  fileName: string;
  fileType: 'zip' | 'json';
  data: {
    invoices: Invoice[];
    customers: Customer[];
    vendors: Vendor[];
    expenses: Expense[];
    adjustmentNotes: AdjustmentNote[];
    companyInfo?: CompanyInfo;
    users?: User[];
  };
  diff: {
    invoices: { totalInBackup: number; missingCount: number; newItems: Invoice[] };
    customers: { totalInBackup: number; missingCount: number; newItems: Customer[] };
    vendors: { totalInBackup: number; missingCount: number; newItems: Vendor[] };
    expenses: { totalInBackup: number; missingCount: number; newItems: Expense[] };
    adjustmentNotes: { totalInBackup: number; missingCount: number; newItems: AdjustmentNote[] };
    users: { totalInBackup: number; missingCount: number; newItems: User[] };
  };
  totalMissingRecords: number;
}

export const SmartBackupRestore: React.FC<SmartBackupRestoreProps> = ({
  currentInvoices,
  currentCustomers,
  currentVendors,
  currentExpenses,
  currentAdjustmentNotes,
  currentCompanyInfo,
  currentUsers,
  onDataRestored,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [restoreProgress, setRestoreProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeParsedData = (parsedData: any, fileName: string, fileType: 'zip' | 'json') => {
    const backupInvoices: Invoice[] = Array.isArray(parsedData.invoices) ? parsedData.invoices : [];
    const backupCustomers: Customer[] = Array.isArray(parsedData.customers) ? parsedData.customers : [];
    const backupVendors: Vendor[] = Array.isArray(parsedData.vendors) ? parsedData.vendors : [];
    const backupExpenses: Expense[] = Array.isArray(parsedData.expenses) ? parsedData.expenses : [];
    const backupAdjustments: AdjustmentNote[] = Array.isArray(parsedData.adjustmentNotes) ? parsedData.adjustmentNotes : [];
    const backupUsers: User[] = Array.isArray(parsedData.users) ? parsedData.users : [];

    // Calculate diffs by ID
    const existingInvoiceIds = new Set(currentInvoices.map((i) => i.id));
    const missingInvoices = backupInvoices.filter((i) => !existingInvoiceIds.has(i.id));

    const existingCustIds = new Set(currentCustomers.map((c) => c.id));
    const missingCustomers = backupCustomers.filter((c) => !existingCustIds.has(c.id));

    const existingVendorIds = new Set(currentVendors.map((v) => v.id));
    const missingVendors = backupVendors.filter((v) => !existingVendorIds.has(v.id));

    const existingExpenseIds = new Set(currentExpenses.map((e) => e.id));
    const missingExpenses = backupExpenses.filter((e) => !existingExpenseIds.has(e.id));

    const existingAdjIds = new Set(currentAdjustmentNotes.map((a) => a.id));
    const missingAdjustments = backupAdjustments.filter((a) => !existingAdjIds.has(a.id));

    const existingUserIds = new Set(currentUsers.map((u) => u.id));
    const missingUsers = backupUsers.filter((u) => !existingUserIds.has(u.id));

    const totalMissing =
      missingInvoices.length +
      missingCustomers.length +
      missingVendors.length +
      missingExpenses.length +
      missingAdjustments.length +
      missingUsers.length;

    setAnalysis({
      fileName,
      fileType,
      data: {
        invoices: backupInvoices,
        customers: backupCustomers,
        vendors: backupVendors,
        expenses: backupExpenses,
        adjustmentNotes: backupAdjustments,
        companyInfo: parsedData.companyInfo,
        users: backupUsers,
      },
      diff: {
        invoices: { totalInBackup: backupInvoices.length, missingCount: missingInvoices.length, newItems: missingInvoices },
        customers: { totalInBackup: backupCustomers.length, missingCount: missingCustomers.length, newItems: missingCustomers },
        vendors: { totalInBackup: backupVendors.length, missingCount: missingVendors.length, newItems: missingVendors },
        expenses: { totalInBackup: backupExpenses.length, missingCount: missingExpenses.length, newItems: missingExpenses },
        adjustmentNotes: { totalInBackup: backupAdjustments.length, missingCount: missingAdjustments.length, newItems: missingAdjustments },
        users: { totalInBackup: backupUsers.length, missingCount: missingUsers.length, newItems: missingUsers },
      },
      totalMissingRecords: totalMissing,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setAnalysis(null);
    setIsAnalyzing(true);

    try {
      if (file.name.endsWith('.zip')) {
        // Read ZIP
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);

        // Find JSON file inside ZIP
        let jsonFile: JSZip.JSZipObject | null = null;
        loadedZip.forEach((relativePath, fileInZip) => {
          if (relativePath.endsWith('.json') && !fileInZip.dir) {
            jsonFile = fileInZip;
          }
        });

        if (!jsonFile) {
          throw new Error('No valid backup JSON file found inside the uploaded ZIP.');
        }

        const jsonContent = await (jsonFile as JSZip.JSZipObject).async('text');
        const parsed = JSON.parse(jsonContent);
        analyzeParsedData(parsed, file.name, 'zip');
      } else if (file.name.endsWith('.json')) {
        // Read JSON directly
        const text = await file.text();
        const parsed = JSON.parse(text);
        analyzeParsedData(parsed, file.name, 'json');
      } else {
        throw new Error('Please upload a .zip or .json backup file.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to parse the backup file. Please ensure it is a valid Carryint backup.');
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const executeRestore = async (mode: 'merge' | 'overwrite') => {
    if (!analysis) return;
    setIsRestoring(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const backup = analysis.data;

      // Calculate final sets
      let finalInvoices: Invoice[] = [];
      let finalCustomers: Customer[] = [];
      let finalVendors: Vendor[] = [];
      let finalExpenses: Expense[] = [];
      let finalAdjustments: AdjustmentNote[] = [];
      let finalUsers: User[] = [];

      if (mode === 'merge') {
        // Map by ID to preserve all records and upsert incoming
        const invMap = new Map(currentInvoices.map((i) => [i.id, i]));
        backup.invoices.forEach((i) => invMap.set(i.id, { ...invMap.get(i.id), ...i }));
        finalInvoices = Array.from(invMap.values());

        const custMap = new Map(currentCustomers.map((c) => [c.id, c]));
        backup.customers.forEach((c) => custMap.set(c.id, { ...custMap.get(c.id), ...c }));
        finalCustomers = Array.from(custMap.values());

        const venMap = new Map(currentVendors.map((v) => [v.id, v]));
        backup.vendors.forEach((v) => venMap.set(v.id, { ...venMap.get(v.id), ...v }));
        finalVendors = Array.from(venMap.values());

        const expMap = new Map(currentExpenses.map((e) => [e.id, e]));
        backup.expenses.forEach((e) => expMap.set(e.id, { ...expMap.get(e.id), ...e }));
        finalExpenses = Array.from(expMap.values());

        const adjMap = new Map(currentAdjustmentNotes.map((a) => [a.id, a]));
        backup.adjustmentNotes.forEach((a) => adjMap.set(a.id, { ...adjMap.get(a.id), ...a }));
        finalAdjustments = Array.from(adjMap.values());

        const userMap = new Map(currentUsers.map((u) => [u.id, u]));
        if (backup.users && backup.users.length > 0) {
          backup.users.forEach((u) => userMap.set(u.id, { ...userMap.get(u.id), ...u }));
        }
        finalUsers = Array.from(userMap.values());
      } else {
        // Overwrite
        finalInvoices = backup.invoices;
        finalCustomers = backup.customers;
        finalVendors = backup.vendors;
        finalExpenses = backup.expenses;
        finalAdjustments = backup.adjustmentNotes;
        finalUsers = backup.users && backup.users.length > 0 ? backup.users : currentUsers;
      }

      // Step 1: Upload to Supabase Cloud
      setRestoreProgress('Syncing customers & vendors to database...');
      if (finalCustomers.length > 0) {
        await supabase.from('customers').upsert(finalCustomers);
      }
      if (finalVendors.length > 0) {
        await supabase.from('vendors').upsert(finalVendors);
      }

      setRestoreProgress('Syncing invoices & adjustment notes...');
      if (finalInvoices.length > 0) {
        await supabase.from('invoices').upsert(finalInvoices);
      }
      if (finalAdjustments.length > 0) {
        await supabase.from('adjustment_notes').upsert(finalAdjustments);
      }

      setRestoreProgress('Syncing expenses & settings...');
      if (finalExpenses.length > 0) {
        await supabase.from('expenses').upsert(finalExpenses);
      }
      if (finalUsers.length > 0) {
        await supabase.from('users').upsert(finalUsers);
      }
      if (backup.companyInfo) {
        await supabase.from('company_info').upsert([{ id: '1', ...backup.companyInfo }]);
      }

      // Step 2: Notify Parent to update live React state
      onDataRestored({
        invoices: finalInvoices,
        customers: finalCustomers,
        vendors: finalVendors,
        expenses: finalExpenses,
        adjustmentNotes: finalAdjustments,
        companyInfo: backup.companyInfo,
        users: finalUsers,
      });

      setSuccessMsg(
        `Successfully restored and synced ${finalInvoices.length} invoices, ${finalCustomers.length} customers, ${finalExpenses.length} expenses, and ${finalVendors.length} vendors to the cloud database!`
      );
      setAnalysis(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Restore failed: ${err.message}`);
    } finally {
      setIsRestoring(false);
      setRestoreProgress('');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden my-8">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-black tracking-wider uppercase mb-2">
              <Sparkles size={14} />
              Cloud Data Recovery & Backup Import
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <Database className="text-orange-500" />
              Smart Backup Restore & Sync
            </h3>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Upload your downloaded <strong>Full System Backup (.zip or .json)</strong> to automatically analyze, recover, and re-populate all missing invoices, customers, and financial records into your cloud CRM.
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".zip,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing || isRestoring}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black px-6 py-3.5 rounded-2xl shadow-lg shadow-orange-500/20 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  Analyzing Backup...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Upload Backup File (.zip / .json)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="bg-red-950/80 border border-red-800 text-red-200 p-4 rounded-2xl flex items-start gap-3 text-sm animate-fade-in">
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-200 p-4 rounded-2xl flex items-start gap-3 text-sm animate-fade-in">
            <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={18} />
            <div className="flex-1 font-medium">{successMsg}</div>
          </div>
        )}

        {/* Analysis & Comparison Diff Card */}
        {analysis && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/20 rounded-xl text-orange-400">
                  {analysis.fileType === 'zip' ? <Archive size={24} /> : <FileJson size={24} />}
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">{analysis.fileName}</h4>
                  <p className="text-xs text-slate-400">
                    Backup Analyzed • {analysis.totalMissingRecords > 0 ? (
                      <span className="text-amber-400 font-bold">{analysis.totalMissingRecords} missing records detected</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">All backup data is already up-to-date in CRM</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Invoices */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                  <span className="flex items-center gap-1"><Receipt size={14} /> Invoices</span>
                </div>
                <div className="text-xl font-black text-white">{analysis.diff.invoices.totalInBackup}</div>
                <div className="text-xs mt-1 font-semibold">
                  {analysis.diff.invoices.missingCount > 0 ? (
                    <span className="text-amber-400">+{analysis.diff.invoices.missingCount} to restore</span>
                  ) : (
                    <span className="text-emerald-400">Synced</span>
                  )}
                </div>
              </div>

              {/* Customers */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                  <span className="flex items-center gap-1"><Users size={14} /> Customers</span>
                </div>
                <div className="text-xl font-black text-white">{analysis.diff.customers.totalInBackup}</div>
                <div className="text-xs mt-1 font-semibold">
                  {analysis.diff.customers.missingCount > 0 ? (
                    <span className="text-amber-400">+{analysis.diff.customers.missingCount} to restore</span>
                  ) : (
                    <span className="text-emerald-400">Synced</span>
                  )}
                </div>
              </div>

              {/* Vendors */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                  <span className="flex items-center gap-1"><Building2 size={14} /> Vendors</span>
                </div>
                <div className="text-xl font-black text-white">{analysis.diff.vendors.totalInBackup}</div>
                <div className="text-xs mt-1 font-semibold">
                  {analysis.diff.vendors.missingCount > 0 ? (
                    <span className="text-amber-400">+{analysis.diff.vendors.missingCount} to restore</span>
                  ) : (
                    <span className="text-emerald-400">Synced</span>
                  )}
                </div>
              </div>

              {/* Expenses */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                  <span className="flex items-center gap-1"><DollarSign size={14} /> Expenses</span>
                </div>
                <div className="text-xl font-black text-white">{analysis.diff.expenses.totalInBackup}</div>
                <div className="text-xs mt-1 font-semibold">
                  {analysis.diff.expenses.missingCount > 0 ? (
                    <span className="text-amber-400">+{analysis.diff.expenses.missingCount} to restore</span>
                  ) : (
                    <span className="text-emerald-400">Synced</span>
                  )}
                </div>
              </div>

              {/* Adjustment Notes */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                  <span className="flex items-center gap-1"><FileText size={14} /> Adjustments</span>
                </div>
                <div className="text-xl font-black text-white">{analysis.diff.adjustmentNotes.totalInBackup}</div>
                <div className="text-xs mt-1 font-semibold">
                  {analysis.diff.adjustmentNotes.missingCount > 0 ? (
                    <span className="text-amber-400">+{analysis.diff.adjustmentNotes.missingCount} to restore</span>
                  ) : (
                    <span className="text-emerald-400">Synced</span>
                  )}
                </div>
              </div>

              {/* Users */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                  <span className="flex items-center gap-1"><Users size={14} /> Users</span>
                </div>
                <div className="text-xl font-black text-white">{analysis.diff.users.totalInBackup}</div>
                <div className="text-xs mt-1 font-semibold">
                  {analysis.diff.users.missingCount > 0 ? (
                    <span className="text-amber-400">+{analysis.diff.users.missingCount} to restore</span>
                  ) : (
                    <span className="text-emerald-400">Synced</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setAnalysis(null)}
                disabled={isRestoring}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold text-sm transition-all"
              >
                Cancel
              </button>

              <button
                onClick={() => executeRestore('merge')}
                disabled={isRestoring}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    {restoreProgress || 'Restoring & Merging...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Restore & Merge All Missing Records
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
