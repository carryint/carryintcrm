
import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Building2,
  CreditCard,
  Upload,
  Image as ImageIcon,
  X,
  Download,
  FileSpreadsheet,
  Archive,
  RefreshCw,
  UserPlus,
  ShieldCheck,
  Clock,
  UserCheck,
  Edit2,
  Trash2,
  Stamp,
  FileSignature,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CompanyInfo, Invoice, Customer, Vendor, User, Expense, AdjustmentNote, Quotation } from '../types';
import Logo from './Logo';
import { downloadSystemZip, downloadExcelOnly, generateId } from '../utils';
import { SmartBackupRestore } from './SmartBackupRestore';

interface SettingsProps {
  companyInfo: CompanyInfo;
  onUpdate: (info: CompanyInfo) => void;
  invoices: Invoice[];
  customers: Customer[];
  vendors: Vendor[];
  users: User[];
  expenses: Expense[];
  adjustmentNotes: AdjustmentNote[];
  quotations?: Quotation[];
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser: (user: User) => void;
  currentUser: User | null;
  onDataRestored?: (data: {
    invoices: Invoice[];
    customers: Customer[];
    vendors: Vendor[];
    expenses: Expense[];
    adjustmentNotes: AdjustmentNote[];
    companyInfo?: CompanyInfo;
    users?: User[];
    quotations?: Quotation[];
  }) => void;
}

const Settings: React.FC<SettingsProps> = ({
  companyInfo, onUpdate, invoices, customers, vendors, users, expenses, adjustmentNotes, quotations = [], onAddUser, onDeleteUser, onUpdateUser, currentUser, onDataRestored
}) => {
  const [formData, setFormData] = useState<CompanyInfo>(companyInfo);
  const [isSaved, setIsSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({ role: 'STAFF' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sealInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = currentUser?.role === 'ADMIN';

  // Sync formData whenever companyInfo prop updates (e.g. on load from Supabase)
  useEffect(() => {
    setFormData(companyInfo);
  }, [companyInfo]);

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.name && newUser.email && newUser.password) {
      if (editingUserId) {
        onUpdateUser({
          ...newUser as User,
          id: editingUserId,
        });
        setEditingUserId(null);
      } else {
        onAddUser({
          ...newUser as User,
          id: generateId(),
        });
      }
      setIsAddingUser(false);
      setNewUser({ role: 'STAFF' });
    }
  };

  const startEditUser = (user: User) => {
    setNewUser(user);
    setEditingUserId(user.id);
    setIsAddingUser(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      alert('Only Administrators can update the company logo.');
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newLogoUrl = reader.result as string;
        const updated = { ...formData, logoUrl: newLogoUrl };
        setFormData(updated);
        onUpdate(updated);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    if (!isAdmin) {
      alert('Only Administrators can update the company logo.');
      return;
    }
    const updated = { ...formData, logoUrl: '' };
    setFormData(updated);
    onUpdate(updated);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSealUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      alert('Only Administrators can upload or change the official company seal.');
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newSealUrl = reader.result as string;
        const updated: CompanyInfo = {
          ...formData,
          sealUrl: newSealUrl,
          bank: {
            ...formData.bank,
            sealUrl: newSealUrl
          }
        };
        setFormData(updated);
        onUpdate(updated); // Save immediately to localStorage & Supabase for all users!
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSeal = () => {
    if (!isAdmin) {
      alert('Only Administrators can remove the official company seal.');
      return;
    }
    const updated: CompanyInfo = {
      ...formData,
      sealUrl: '',
      bank: {
        ...formData.bank,
        sealUrl: ''
      }
    };
    setFormData(updated);
    onUpdate(updated); // Save immediately to localStorage & Supabase!
    if (sealInputRef.current) sealInputRef.current.value = '';
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleFullBackup = async () => {
    setIsExporting(true);
    const fullData = {
      invoices,
      customers,
      vendors,
      expenses,
      adjustmentNotes,
      quotations,
      companyInfo,
      users
    };
    await downloadSystemZip(fullData);
    setIsExporting(false);
  };

  const handleExcelExport = () => {
    downloadExcelOnly({ invoices, customers, vendors, expenses, adjustmentNotes, quotations });
  };

  const inputClass = "w-full px-4 py-3 rounded-lg border border-amber-300 bg-amber-100 text-slate-950 font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all";
  const labelClass = "text-sm font-black text-gray-500 uppercase tracking-widest";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Building2 className="text-orange-500" />
            Core Configuration
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage TRN, legal identity, and settlement accounts</p>
        </div>
        {isSaved && (
          <div className="bg-green-100 text-green-700 px-6 py-3 rounded-xl font-black animate-pulse shadow-sm">
            SETTINGS UPDATED SUCCESSFULLY
          </div>
        )}
      </div>

      {/* Smart Backup Restore & Data Recovery Tool */}
      <SmartBackupRestore
        currentInvoices={invoices}
        currentCustomers={customers}
        currentVendors={vendors}
        currentExpenses={expenses}
        currentAdjustmentNotes={adjustmentNotes}
        currentQuotations={quotations}
        currentCompanyInfo={companyInfo}
        currentUsers={users}
        onDataRestored={(restored) => {
          if (onDataRestored) {
            onDataRestored(restored);
          }
        }}
      />

      {/* Data Management Section */}
      <div className="bg-slate-900 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Archive size={120} />
        </div>
        <div className="relative z-10">
          <h3 className="text-xl font-black mb-2 flex items-center gap-2">
            <Archive className="text-orange-500" />
            Data Management & Backups
          </h3>
          <p className="text-slate-400 text-sm mb-6 max-w-lg">
            Download full system snapshots and spreadsheet exports to keep offline copies of your CRM records.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleExcelExport}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg"
            >
              <FileSpreadsheet size={20} />
              Excel Export (Multi-sheet)
            </button>
            <button
              onClick={handleFullBackup}
              disabled={isExporting}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg disabled:opacity-50"
            >
              {isExporting ? <RefreshCw className="animate-spin" size={20} /> : <Archive size={20} />}
              Full System Backup (ZIP)
            </button>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      {currentUser?.role === 'ADMIN' && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <ShieldCheck className="text-orange-500" />
                User Access Control
              </h3>
              <p className="text-sm text-gray-500 mt-1">Manage who can access the application and their roles</p>
            </div>
            <button
              onClick={() => { setIsAddingUser(!isAddingUser); setEditingUserId(null); setNewUser({ role: 'STAFF' }); }}
              className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-black hover:bg-orange-700 transition-all flex items-center gap-2"
            >
              <UserPlus size={20} />
              Add System User
            </button>
          </div>

          {isAddingUser && (
            <div className="mb-8 p-6 bg-orange-50 rounded-2xl border-2 border-orange-200 animate-in fade-in slide-in-from-top-4">
              <h4 className="text-sm font-black text-orange-800 uppercase tracking-widest mb-4">
                {editingUserId ? 'Modify User Credentials' : 'New User Credentials'}
              </h4>
              <form onSubmit={handleUserSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  placeholder="Employee Name"
                  required
                  className={inputClass}
                  value={newUser.name || ''}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                />
                <input
                  placeholder="Email Address"
                  type="email"
                  required
                  className={inputClass}
                  value={newUser.email || ''}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                />
                <input
                  placeholder="Access Password"
                  type="password"
                  required
                  className={inputClass}
                  value={newUser.password || ''}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                />
                <select
                  className={inputClass}
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                >
                  <option value="ADMIN">System Administrator (Full Control & Users)</option>
                  <option value="MANAGER">Manager Access (Edit Invoices, Reports & Exports)</option>
                  <option value="STAFF">Standard Staff Access (Enter Invoices & Sales Dashboard)</option>
                  <option value="ACCOUNTANT">Accountant Access (Full Accounting & VAT Suite)</option>
                </select>
                <div className="md:col-span-2 flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-slate-900 text-white font-black py-3 rounded-xl hover:bg-slate-800 transition-colors">
                    {editingUserId ? 'Update User Access' : 'Confirm User Access'}
                  </button>
                  <button type="button" onClick={() => { setIsAddingUser(false); setEditingUserId(null); setNewUser({ role: 'STAFF' }); }} className="flex-1 bg-white text-gray-500 font-bold py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-hidden border border-gray-100 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">User Details</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Access Role</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Permissions Scope</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                        u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        u.role === 'MANAGER' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        u.role === 'ACCOUNTANT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {u.role === 'ADMIN' ? 'System Administrator' :
                         u.role === 'MANAGER' ? 'Manager Access' :
                         u.role === 'ACCOUNTANT' ? 'Chief Accountant' : 'Standard Staff'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                      {u.role === 'ADMIN' ? 'All tools, user mgmt, backups & backend' :
                       u.role === 'MANAGER' ? 'Edit invoices, accounting analysis & exports' :
                       u.role === 'ACCOUNTANT' ? 'General ledger, VAT, CT, AR/AP, closings' :
                       'Enter invoices & quotations, personal sales KPI'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEditUser(u)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Edit User"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand Identity & Official Seal Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-8">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <ImageIcon size={20} className="text-orange-500" />
              Brand Identity & Official Seal
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload your official company logo and authorized signature seal / stamp for quotations and documents
            </p>
          </div>

          {/* 1. Company Logo */}
          <div className="border-b border-gray-100 pb-6">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ImageIcon size={16} className="text-orange-600" />
              Company Logo (Header)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <label className={labelClass}>Upload Company Logo</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 bg-amber-100 border-2 border-dashed border-amber-300 px-6 py-8 rounded-xl text-amber-800 font-black hover:bg-amber-200 transition-all flex-1 text-center justify-center group"
                  >
                    <Upload className="group-hover:-translate-y-1 transition-transform" />
                    <span>Upload Logo Image</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-amber-800 font-bold uppercase">Supports PNG, JPG, or SVG</p>
              </div>

              <div className="relative group p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center justify-center min-h-[160px]">
                <div className="text-[10px] font-black text-gray-400 absolute top-3 left-3 tracking-widest uppercase">Preview</div>
                <Logo src={formData.logoUrl} className="h-20" />
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"
                    title="Remove Logo"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Company Official Seal / Signature Stamp */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Stamp size={16} className="text-orange-600" />
                Company Seal / Official Stamp & Signature
              </h4>
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={12} />
                    Admin Upload Access
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock size={12} />
                    Admin Managed
                  </span>
                )}
                <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full">
                  For Quotations & Signatory
                </span>
              </div>
            </div>

            {!isAdmin && (
              <div className="p-3.5 bg-blue-50/80 border border-blue-200/70 rounded-xl text-blue-900 text-xs flex items-center gap-2.5 mb-5 shadow-sm">
                <Lock size={16} className="text-blue-600 shrink-0" />
                <span>
                  <strong>Administrator Managed:</strong> The official company seal stamp is configured by Administrators. The active seal below is automatically synced across all team members and applied to official documents.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <label className={labelClass}>Company Stamp / Seal (Signature)</label>
                {isAdmin ? (
                  <>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => sealInputRef.current?.click()}
                        className="flex items-center gap-2 bg-orange-50 border-2 border-dashed border-orange-300 px-6 py-8 rounded-xl text-orange-900 font-black hover:bg-orange-100 transition-all flex-1 text-center justify-center group"
                      >
                        <Upload className="group-hover:-translate-y-1 transition-transform text-orange-600" />
                        <span>{formData.sealUrl ? 'Replace Company Seal' : 'Upload Company Seal / Stamp'}</span>
                      </button>
                      <input
                        type="file"
                        ref={sealInputRef}
                        onChange={handleSealUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>Any uploaded seal is instantly synced to cloud storage for all users.</span>
                    </div>
                  </>
                ) : (
                  <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-gray-700">Official Stamp Sync Status</p>
                    <p className="text-xs text-gray-500">
                      {formData.sealUrl
                        ? 'Official company seal is active and synced from Supabase cloud database.'
                        : 'No company seal has been uploaded by the administrator yet.'}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 font-medium">
                  Transparent PNG recommended. This seal is stamped under <strong className="text-gray-800">Authorized Signatory / Operations Dept</strong> on official quotations and invoices.
                </p>
              </div>

              <div className="relative group p-4 bg-slate-50/80 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center min-h-[160px]">
                <div className="text-[10px] font-black text-gray-400 absolute top-3 left-3 tracking-widest uppercase">
                  Seal Stamp Preview
                </div>
                {formData.sealUrl ? (
                  <div className="p-2 flex flex-col items-center">
                    <img
                      src={formData.sealUrl}
                      alt="Company Seal Stamp"
                      className="max-h-24 max-w-[200px] object-contain drop-shadow-sm"
                    />
                    <span className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Active Official Seal (All Users)
                    </span>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    <Stamp size={36} className="mx-auto mb-1 opacity-40" />
                    <p className="text-xs font-bold text-gray-400">No company seal uploaded</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {isAdmin ? 'Upload a round stamp or signature image above' : 'Waiting for Admin to upload seal'}
                    </p>
                  </div>
                )}
                {isAdmin && formData.sealUrl && (
                  <button
                    type="button"
                    onClick={removeSeal}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"
                    title="Remove Seal"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Default Seal Preferences */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider mb-3">
                Default Seal / Stamp Behavior
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">Quotations Default Mode</p>
                    <p className="text-[10px] text-gray-500">Initial stamp state when creating quotations</p>
                  </div>
                  <div className="inline-flex p-1 bg-white rounded-lg border border-gray-200 text-xs font-bold">
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => {
                        const updated = {
                          ...formData,
                          defaultQuotationSeal: false,
                          bank: { ...formData.bank, defaultQuotationSeal: false }
                        };
                        setFormData(updated);
                        onUpdate(updated);
                      }}
                      className={`px-3 py-1 rounded-md transition-all ${
                        !formData.defaultQuotationSeal ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                      } ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      Disabled
                    </button>
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => {
                        const updated = {
                          ...formData,
                          defaultQuotationSeal: true,
                          bank: { ...formData.bank, defaultQuotationSeal: true }
                        };
                        setFormData(updated);
                        onUpdate(updated);
                      }}
                      className={`px-3 py-1 rounded-md transition-all ${
                        formData.defaultQuotationSeal ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                      } ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      Enabled
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">Invoices Default Mode</p>
                    <p className="text-[10px] text-gray-500">Initial stamp state when creating invoices</p>
                  </div>
                  <div className="inline-flex p-1 bg-white rounded-lg border border-gray-200 text-xs font-bold">
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => {
                        const updated = {
                          ...formData,
                          defaultInvoiceSeal: false,
                          bank: { ...formData.bank, defaultInvoiceSeal: false }
                        };
                        setFormData(updated);
                        onUpdate(updated);
                      }}
                      className={`px-3 py-1 rounded-md transition-all ${
                        !formData.defaultInvoiceSeal ? 'bg-slate-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                      } ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      Disabled
                    </button>
                    <button
                      type="button"
                      disabled={!isAdmin}
                      onClick={() => {
                        const updated = {
                          ...formData,
                          defaultInvoiceSeal: true,
                          bank: { ...formData.bank, defaultInvoiceSeal: true }
                        };
                        setFormData(updated);
                        onUpdate(updated);
                      }}
                      className={`px-3 py-1 rounded-md transition-all ${
                        formData.defaultInvoiceSeal ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                      } ${!isAdmin ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      Enabled
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <CreditCard size={20} className="text-orange-500" />
            Tax Identity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClass}>Company TRN Number</label>
              <input
                type="text"
                value={formData.trn}
                onChange={(e) => setFormData({ ...formData, trn: e.target.value })}
                className={`${inputClass} font-mono text-xl text-orange-700`}
                placeholder="100XXXXXXXXXXXX"
                required
              />
            </div>
            <div className="flex items-center justify-center p-6 bg-amber-100 rounded-xl border border-amber-200">
              <p className="text-sm text-amber-900 font-bold italic text-center">
                This TRN is applied to all official Tax Invoices.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Building2 size={20} className="text-orange-500" />
            Company Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClass}>Entity Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Official Website</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className={labelClass}>Registered Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={`${inputClass} h-24`}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <CreditCard size={20} className="text-orange-500" />
            Bank Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClass}>Beneficiary Name</label>
              <input
                type="text"
                value={formData.bank.name}
                onChange={(e) => setFormData({ ...formData, bank: { ...formData.bank, name: e.target.value } })}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>IBAN</label>
              <input
                type="text"
                value={formData.bank.iban}
                onChange={(e) => setFormData({ ...formData, bank: { ...formData.bank, iban: e.target.value } })}
                className={`${inputClass} font-mono uppercase`}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Account Number</label>
              <input
                type="text"
                value={formData.bank.accNo}
                onChange={(e) => setFormData({ ...formData, bank: { ...formData.bank, accNo: e.target.value } })}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>CIF / Swift</label>
              <input
                type="text"
                value={formData.bank.cif}
                onChange={(e) => setFormData({ ...formData, bank: { ...formData.bank, cif: e.target.value } })}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="bg-orange-600 text-white px-16 py-5 rounded-xl font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-2xl shadow-orange-200 flex items-center gap-3"
          >
            <Save size={24} /> Commit Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
