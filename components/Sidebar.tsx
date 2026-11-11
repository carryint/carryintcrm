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
  Lock,
  LogOut
} from 'lucide-react';
import { User, UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  isMobileOrShort?: boolean;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  onClose, 
  currentUser,
  isMobileOrShort = false,
  onLogout
}) => {
  const role: UserRole = currentUser?.role || 'STAFF';

  // Prevent background scrolling on mobile & short-screen drawer when open and allow closing with ESC key
  React.useEffect(() => {
    if (isOpen && isMobileOrShort) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isMobileOrShort, onClose]);

  interface MenuItem {
    id: string;
    label: string;
    icon: any;
    section?: string;
  }

  // Build menu items dynamically per role with grouped sections
  const getMenuItems = (): MenuItem[] => {
    if (role === 'STAFF') {
      return [
        { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard, section: 'Workspace' },
        { id: 'staff-dashboard', label: 'My Sales Workspace', icon: UserCheck, section: 'Workspace' },
        { id: 'invoices', label: 'Invoices', icon: Receipt, section: 'Sales & Logistics' },
        { id: 'tracking', label: 'Shipment Tracking', icon: Truck, section: 'Sales & Logistics' },
        { id: 'create-invoice', label: 'Create Invoice', icon: PlusCircle, section: 'Sales & Logistics' },
        { id: 'quotations', label: 'Quotations', icon: FileCheck, section: 'Sales & Logistics' },
        { id: 'customers', label: 'Customers', icon: Users, section: 'Clients' },
      ];
    }

    if (role === 'ACCOUNTANT') {
      return [
        { id: 'accounting-suite', label: 'Accountant Suite', icon: BookOpen, section: 'Financial Suite' },
        { id: 'dashboard', label: 'Operations Dashboard', icon: LayoutDashboard, section: 'Financial Suite' },
        { id: 'monthly-closing', label: 'Sales Closing Dashboard', icon: Lock, section: 'Financial Suite' },
        { id: 'invoices', label: 'Invoices', icon: Receipt, section: 'Invoicing & AR' },
        { id: 'tracking', label: 'Shipment Tracking', icon: Truck, section: 'Invoicing & AR' },
        { id: 'customers', label: 'Customers & AR', icon: Users, section: 'Invoicing & AR' },
        { id: 'vendors', label: 'Vendors & AP', icon: Truck, section: 'Payables & Expenses' },
        { id: 'adjustments', label: 'Credit/Debit Notes', icon: FileText, section: 'Payables & Expenses' },
        { id: 'expenses', label: 'Company Expenses', icon: Wallet, section: 'Payables & Expenses' },
        { id: 'reports', label: 'Financial Reports', icon: PieChart, section: 'Analytics' },
        { id: 'settings', label: 'Settings & TRN', icon: Settings, section: 'Analytics' },
      ];
    }

    if (role === 'MANAGER') {
      return [
        { id: 'dashboard', label: 'Business Dashboard', icon: LayoutDashboard, section: 'Workspace' },
        { id: 'monthly-closing', label: 'Sales Closing Dashboard', icon: Lock, section: 'Workspace' },
        { id: 'invoices', label: 'Invoices (Edit & Manage)', icon: Receipt, section: 'Sales & Operations' },
        { id: 'tracking', label: 'Shipment Tracking & WP', icon: Truck, section: 'Sales & Operations' },
        { id: 'quotations', label: 'Quotations', icon: FileCheck, section: 'Sales & Operations' },
        { id: 'create-invoice', label: 'Create Invoice', icon: PlusCircle, section: 'Sales & Operations' },
        { id: 'customers', label: 'Customers', icon: Users, section: 'Clients & Payables' },
        { id: 'vendors', label: 'Vendors & Payables', icon: Truck, section: 'Clients & Payables' },
        { id: 'adjustments', label: 'Credit/Debit Notes', icon: FileText, section: 'Financial Management' },
        { id: 'expenses', label: 'Company Expenses', icon: Wallet, section: 'Financial Management' },
        { id: 'accounting-suite', label: 'Accounting Overview', icon: BookOpen, section: 'Financial Management' },
        { id: 'reports', label: 'Analytics & Reports', icon: PieChart, section: 'System' },
        { id: 'settings', label: 'Settings', icon: Settings, section: 'System' },
      ];
    }

    // Default: ADMIN (System Administrator)
    return [
      { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, section: 'Core Workspace' },
      { id: 'monthly-closing', label: 'Sales Closing Dashboard', icon: Lock, section: 'Core Workspace' },
      { id: 'user-analytics', label: 'Users & Work Reports', icon: UserCheck, section: 'Core Workspace' },
      { id: 'invoices', label: 'Invoices', icon: Receipt, section: 'Sales & Logistics' },
      { id: 'tracking', label: 'Shipment Tracking & WP', icon: Truck, section: 'Sales & Logistics' },
      { id: 'quotations', label: 'Quotations', icon: FileCheck, section: 'Sales & Logistics' },
      { id: 'create-invoice', label: 'Create Invoice', icon: PlusCircle, section: 'Sales & Logistics' },
      { id: 'customers', label: 'Customers', icon: Users, section: 'Clients & Partners' },
      { id: 'vendors', label: 'Vendors', icon: Truck, section: 'Clients & Partners' },
      { id: 'adjustments', label: 'Credit/Debit Notes', icon: FileText, section: 'Finance & Accounts' },
      { id: 'expenses', label: 'Company Expenses', icon: Wallet, section: 'Finance & Accounts' },
      { id: 'accounting-suite', label: 'Accounting Suite', icon: BookOpen, section: 'Finance & Accounts' },
      { id: 'reports', label: 'Financial Reports', icon: PieChart, section: 'Finance & Accounts' },
      { id: 'settings', label: 'Admin Settings & Users', icon: Settings, section: 'Administration' },
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
      {/* Mobile, Tablet & Short-Screen Backdrop with Blur */}
      {isOpen && isMobileOrShort && (
        <div
          className="fixed inset-0 bg-black/80 z-40 no-print backdrop-blur-md transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Glassy Sidebar with 3D Depth, Responsive Drawer for Mobile & Short Screens */}
      <aside 
        aria-label="Sidebar Navigation"
        className={`
          w-[290px] sm:w-68 max-w-[85vw] glass-ultra fixed left-0 top-0 bottom-0 inset-y-0 text-white flex flex-col z-50 no-print transition-transform duration-300 ease-out shadow-[20px_0_60px_rgba(0,0,0,0.75)] border-r border-white/10 select-none overflow-hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Scrawling edge beam */}
        <div className="scrawl-beam-wrapper">
          <div className="scrawl-beam"></div>
        </div>

        {/* Brand Header with Safe Area Top Padding */}
        <div className="pt-[max(0.75rem,env(safe-area-inset-top))] px-3.5 pb-2.5 sm:px-4 sm:py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.03] relative shrink-0 short-screen-header">
          <div className="flex items-center space-x-2.5 sm:space-x-3 truncate">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-400 rounded-xl flex items-center justify-center font-black text-base sm:text-lg text-black shadow-lg shadow-orange-500/40 card-3d shrink-0">
              C
            </div>
            <div className="truncate">
              <span className="font-black text-sm sm:text-base tracking-tight block leading-tight text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)] truncate">
                Carryint CRM
              </span>
              <span className="text-[9px] sm:text-[10px] text-orange-400 font-extrabold tracking-wider uppercase block truncate">
                Invoicing & Logistics
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close menu"
            title="Close menu"
            className="text-zinc-400 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors active:scale-90 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Profile Card at Top of Drawer - ALWAYS 100% VISIBLE & NEVER CUT OFF */}
        <div className="mx-2.5 my-2 p-2.5 rounded-2xl bg-gradient-to-r from-white/[0.07] to-white/[0.02] border border-white/10 shadow-lg shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 flex items-center justify-center shrink-0">
                <UserCheck size={18} className="text-orange-400" />
              </div>
              <div className="min-w-0 truncate">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-black text-white truncate leading-tight">
                    {currentUser?.name || 'User'}
                  </p>
                  <span className="relative flex h-2 w-2 shrink-0" title="System Online">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </div>
                <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mt-0.5 ${getRoleBadgeStyle(role)}`}>
                  {getRoleDisplay(role)}
                </span>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/30 active:scale-95 shrink-0"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Menu Navigation with flex-1 min-h-0 for smooth scrolling on short screens & mobile */}
        <nav className="flex-1 min-h-0 px-2 sm:px-2.5 py-1 space-y-0.5 overflow-y-auto overscroll-contain sidebar-scrollbar">
          {menuItems.map((item, index) => {
            const isActive = activeTab === item.id;
            const prevItem = index > 0 ? menuItems[index - 1] : null;
            const isNewSection = item.section && (!prevItem || prevItem.section !== item.section);

            return (
              <React.Fragment key={item.id}>
                {isNewSection && (
                  <div className="pt-2.5 pb-1 px-3 text-[9px] font-black uppercase tracking-wider text-orange-400/80 flex items-center gap-1.5 select-none">
                    <span className="w-1 h-1 rounded-full bg-orange-500"></span>
                    {item.section}
                  </div>
                )}
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (isMobileOrShort) {
                      onClose();
                    }
                  }}
                  className={`w-full flex items-center space-x-2.5 sm:space-x-3 px-3 py-2 sm:py-2 rounded-xl transition-all duration-150 active:scale-95 group text-left touch-manipulation min-h-[36px] sm:min-h-[40px] short-screen-compact ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-200 text-black font-black shadow-lg shadow-orange-500/35 border border-white/20'
                      : 'text-zinc-300 hover:bg-white/10 hover:text-white hover:border-orange-500/30 border border-transparent font-medium'
                  }`}
                >
                  <item.icon 
                    size={17} 
                    className={`transition-colors shrink-0 ${
                      isActive ? 'text-black' : 'text-zinc-400 group-hover:text-orange-400'
                    }`} 
                  />
                  <span className="text-xs sm:text-[13px] truncate">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-black shadow-sm shrink-0"></span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Compact Safe Area Footer */}
        <div className="px-3.5 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[10px] text-zinc-400 shrink-0 short-screen-footer">
          <span className="font-semibold text-zinc-400">Carryint CRM v1.2.2</span>
          <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider">Fast • Secure</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
