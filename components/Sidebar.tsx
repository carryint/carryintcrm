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

  // Prevent background scrolling on mobile when sidebar is open and allow closing with ESC key
  React.useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, onClose]);

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
      {/* Mobile & Tablet Backdrop with Blur */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 xl:hidden no-print backdrop-blur-md transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Glassy Sidebar with 3D Depth, Mobile & Tab View Responsive Layout */}
      <aside className={`
        w-[280px] sm:w-64 max-w-[85vw] glass-ultra h-screen h-[100dvh] max-h-[100dvh] fixed left-0 top-0 text-white flex flex-col z-50 no-print transition-transform duration-300 ease-out shadow-[15px_0_50px_rgba(0,0,0,0.6)] border-r border-white/10 select-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full xl:translate-x-0'}
      `}>
        {/* Scrawling edge beam */}
        <div className="scrawl-beam-wrapper">
          <div className="scrawl-beam"></div>
        </div>

        {/* Brand Header with Safe Area Top Padding & Compact Short-Screen Height */}
        <div className="pt-[max(0.75rem,env(safe-area-inset-top))] px-3.5 pb-3 sm:px-4 sm:py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.03] relative shrink-0">
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
            className="xl:hidden text-zinc-400 hover:text-white p-2 hover:bg-white/10 rounded-xl transition-colors active:scale-90 shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Navigation with flex-1 min-h-0 for smooth scrolling on short screens & mobile */}
        <nav className="flex-1 min-h-0 px-2 sm:px-2.5 py-2 space-y-0.5 sm:space-y-1 overflow-y-auto overscroll-contain sidebar-scrollbar">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center space-x-2.5 sm:space-x-3 px-3 py-2 sm:py-2.5 rounded-xl transition-all duration-150 active:scale-95 group text-left touch-manipulation min-h-[38px] sm:min-h-[42px] ${
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
            );
          })}
        </nav>

        {/* User Role Card in Footer with Safe Area Bottom Padding */}
        <div className="p-3 sm:p-3.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/10 bg-white/[0.03] relative shrink-0">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-white truncate">{currentUser?.name || 'User'}</p>
              <span className={`inline-block text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border mt-0.5 sm:mt-1 ${getRoleBadgeStyle(role)}`}>
                {getRoleDisplay(role)}
              </span>
            </div>
            {/* Pulsing online status indicator */}
            <div className="flex items-center gap-1.5 shrink-0" title="System Online">
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500"></span>
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
