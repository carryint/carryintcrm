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
  UserCheck,
  Lock
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
        { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
        { id: 'staff-dashboard', label: 'My Sales Workspace', icon: UserCheck },
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
        { id: 'monthly-closing', label: 'Sales Closing Dashboard', icon: Lock },
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
        { id: 'monthly-closing', label: 'Sales Closing Dashboard', icon: Lock },
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
      { id: 'monthly-closing', label: 'Sales Closing Dashboard', icon: Lock },
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
        return 'bg-purple-950/80 text-purple-300 border-purple-500/40';
      case 'MANAGER':
        return 'bg-blue-950/80 text-blue-300 border-blue-500/40';
      case 'ACCOUNTANT':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
      case 'STAFF':
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
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
      {/* Mobile Backdrop with Blur */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden no-print backdrop-blur-md transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Glassy Sidebar with 3D Depth & Crawling Glow */}
      <div className={`
        w-64 glass-ultra h-screen fixed left-0 top-0 text-white flex flex-col z-50 no-print transition-transform duration-300 shadow-[15px_0_50px_rgba(0,0,0,0.9)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Scrawling edge beam */}
        <div className="scrawl-beam-wrapper">
          <div className="scrawl-beam"></div>
        </div>

        {/* Brand Header */}
        <div className="p-5 border-b border-orange-500/20 flex items-center justify-between bg-black/40 relative">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-200 rounded-xl flex items-center justify-center font-black text-xl text-black shadow-lg shadow-orange-500/40 card-3d">
              C
            </div>
            <div>
              <span className="font-black text-base tracking-tight block leading-tight text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]">
                Carryint CRM
              </span>
              <span className="text-[10px] text-orange-400 font-extrabold tracking-wider uppercase">
                Invoicing & Logistics
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="lg:hidden text-zinc-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 card-3d active:scale-95 group text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-200 text-black font-black shadow-lg shadow-orange-500/35 border border-white/20'
                    : 'text-zinc-300 hover:bg-white/10 hover:text-white hover:border-orange-500/30 border border-transparent font-medium'
                }`}
              >
                <item.icon 
                  size={18} 
                  className={`transition-colors shrink-0 ${
                    isActive ? 'text-black' : 'text-zinc-400 group-hover:text-orange-400'
                  }`} 
                />
                <span className="text-xs sm:text-sm truncate">{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-black shadow-sm"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Role Card in Footer */}
        <div className="p-4 border-t border-orange-500/20 bg-black/60 relative">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-white truncate">{currentUser?.name || 'User'}</p>
              <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mt-1 ${getRoleBadgeStyle(role)}`}>
                {getRoleDisplay(role)}
              </span>
            </div>
            {/* Pulsing online status indicator */}
            <div className="flex items-center gap-1.5" title="System Online">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
