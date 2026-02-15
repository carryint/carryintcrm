
import React, { useState, useRef } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { CompanyInfo, Invoice, Customer, Vendor } from '../types';
import Logo from './Logo';
import { downloadSystemZip, downloadExcelOnly } from '../utils';

interface SettingsProps {
  companyInfo: CompanyInfo;
  onUpdate: (info: CompanyInfo) => void;
  invoices: Invoice[];
  customers: Customer[];
  vendors: Vendor[];
}

const Settings: React.FC<SettingsProps> = ({ companyInfo, onUpdate, invoices, customers, vendors }) => {
  const [formData, setFormData] = useState<CompanyInfo>(companyInfo);
  const [isSaved, setIsSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData({ ...formData, logoUrl: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFullBackup = async () => {
    setIsExporting(true);
    const fullData = {
      invoices,
      customers,
      vendors,
      companyInfo
    };
    await downloadSystemZip(fullData);
    setIsExporting(false);
  };

  const handleExcelExport = () => {
    downloadExcelOnly({ invoices, customers, vendors });
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
            All system data is securely stored in your browser. Download copies regularly to ensure you have offline backups of your invoices, client lists, and financial logs.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand Identity / Logo Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <ImageIcon size={20} className="text-orange-500" />
            Brand Identity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <label className={labelClass}>Company Logo</label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-amber-100 border-2 border-dashed border-amber-300 px-6 py-8 rounded-xl text-amber-800 font-black hover:bg-amber-200 transition-all flex-1 text-center justify-center group"
                >
                  <Upload className="group-hover:-translate-y-1 transition-transform" />
                  <span>Upload New Image</span>
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
                >
                  <X size={16} />
                </button>
              )}
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
