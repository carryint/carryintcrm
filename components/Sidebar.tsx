
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  PieChart, 
  Settings,
  PlusCircle,
  Receipt
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'create-invoice', label: 'Create Invoice', icon: PlusCircle },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'vendors', label: 'Vendors', icon: Truck },
    { id: 'reports', label: 'Financial Reports', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 h-screen fixed left-0 top-0 text-white flex flex-col no-print">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-xl">C</div>
        <span className="font-bold text-lg tracking-tight">Carryint CRM</span>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === item.id 
                ? 'bg-orange-600 text-white' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 text-slate-500 text-xs font-bold uppercase tracking-widest">
          <span>v1.2.0 Stable</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
