import React from 'react';
import {
  LayoutDashboard,
  Users,
  Truck,
  PieChart,
  Settings,
  PlusCircle,
  Receipt,
  X,
  Wallet,
  FileText,
  FileCheck,
  ShieldCheck,
  BookOpen,
  UserCheck
} from 'lucide-react';
import { User, UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose, currentUser }) => {
  const role: UserRole = currentUser?.role || 'STAFF';

  // Build menu items dynamically per role
  const getMenuItems = () => {
    if (role === 'STAFF') {
      return [
        { id: 'dashboard', label: 'My Sales Dashboard', icon: LayoutDashboard },
        { id: 'invoices', label: 'Invoices', icon: Receipt },
        { id: 'tracking', label: 'Shipment Tracking', icon: Truck },
        { id: 'create-invoice', label: 'Create Invoice', icon: PlusCircle },
        { id: 'quotations', label: 'Quotations', icon: FileCheck },
        { id: 'customers', label: 'Customers', icon: Users },
      ];
    }

    if (role === 'ACCOUNTANT') {
      return [
        { id: 'accounting-suite', label: 'Accountant Suite', icon: BookOpen },
        { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
        { id: 'invoices', label: 'Invoices', icon: Receipt },
        { id: 'tracking', label: 'Shipment Tracking', icon: Truck },
        { id: 'customers', label: 'Customers & AR', icon: Users },
        { id: 'vendors', label: 'Vendors & AP', icon: Truck },
        { id: 'adjustments', label: 'Credit/Debit Notes', icon: FileText },
        { id: 'expenses', label: 'Company Expenses', icon: Wallet },
        { id: 'reports', label: 'Financial Reports', icon: PieChart },
        { id: 'settings', label: 'Settings & TRN', icon: Settings },
      ];
    }

    if (role === 'MANAGER') {
      return [
        { id: 'dashboard', label: 'Business Dashboard', icon: LayoutDashboard },
        { id: 'invoices', label: 'Invoices (Edit & Manage)', icon: Receipt },
        { id: 'tracking', label: 'Shipment Tracking & WP', icon: Truck },
        { id: 'quotations', label: 'Quotations', icon: FileCheck },
        { id: 'create-invoice', label: 'Create Invoice', icon: PlusCircle },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'vendors', label: 'Vendors & Payables', icon: Truck },
        { id: 'adjustments', label: 'Credit/Debit Notes', icon: FileText },
        { id: 'expenses', label: 'Company Expenses', icon: Wallet },
        { id: 'accounting-suite', label: 'Accounting Overview', icon: BookOpen },
        { id: 'reports', label: 'Analytics & Reports', icon: PieChart },
        { id: 'settings', label: 'Settings', icon: Settings },
      ];
    }

    // Default: ADMIN (System Administrator)
    return [
      { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
      { id: 'user-analytics', label: 'Users & Work Reports', icon: UserCheck },
      { id: 'invoices', label: 'Invoices', icon: Receipt },
      { id: 'tracking', label: 'Shipment Tracking & WP', icon: Truck },
      { id: 'quotations', label: 'Quotations', icon: FileCheck },
      { id: 'create-invoice', label: 'Create Invoice', icon: PlusCircle },
      { id: 'customers', label: 'Customers', icon: Users },
      { id: 'adjustments', label: 'Credit/Debit Notes', icon: FileText },
      { id: 'vendors', label: 'Vendors', icon: Truck },
      { id: 'expenses', label: 'Company Expenses', icon: Wallet },
      { id: 'accounting-suite', label: 'Accounting Suite', icon: BookOpen },
      { id: 'reports', label: 'Financial Reports', icon: PieChart },
      { id: 'settings', label: 'Admin Settings & Users', icon: Settings },
    ];
  };

  const menuItems = getMenuItems();

  const getRoleBadgeStyle = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-purple-900/60 text-purple-300 border-purple-700';
      case 'MANAGER':
        return 'bg-blue-900/60 text-blue-300 border-blue-700';
      case 'ACCOUNTANT':
        return 'bg-amber-900/60 text-amber-300 border-amber-700';
      case 'STAFF':
      default:
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-700';
    }
  };

  const getRoleDisplay = (r: UserRole) => {
    switch (r) {
      case 'ADMIN':
        return 'System Admin';
      case 'MANAGER':
        return 'Manager';
      case 'ACCOUNTANT':
        return 'Chief Accountant';
      case 'STAFF':
      default:
        return 'Standard Staff';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden no-print backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div className={`
        w-64 bg-slate-900 h-screen fixed left-0 top-0 text-white flex flex-col z-50 no-print transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-orange-600/30">C</div>
            <div>
              <span className="font-black text-base tracking-tight block leading-tight">Carryint CRM</span>
              <span className="text-[10px] text-slate-400 font-medium">Invoicing & Accounting</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                onClose();
              }}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-orange-600 text-white font-bold shadow-md shadow-orange-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white font-medium'
              }`}
            >
              <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-slate-400'} />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Role Card in Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-slate-200 truncate">{currentUser?.name || 'User'}</p>
              <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mt-1 ${getRoleBadgeStyle(role)}`}>
                {getRoleDisplay(role)}
              </span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
