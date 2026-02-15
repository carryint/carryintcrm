
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils';
import { Invoice } from '../types';

interface DashboardProps {
  invoices: Invoice[];
}

const Dashboard: React.FC<DashboardProps> = ({ invoices }) => {
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalProfit = invoices.reduce((sum, inv) => sum + inv.profit, 0);
  const outstandingReceivables = invoices
    .filter(inv => inv.status !== 'PAID')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const outstandingPayables = invoices
    .filter(inv => inv.vendorStatus !== 'PAID')
    .reduce((sum, inv) => sum + inv.vendorCost, 0);

  // Sample data for charts
  const chartData = [
    { name: 'Jan', revenue: 45000, profit: 12000 },
    { name: 'Feb', revenue: 52000, profit: 15000 },
    { name: 'Mar', revenue: 48000, profit: 11000 },
    { name: 'Apr', revenue: 61000, profit: 18000 },
    { name: 'May', revenue: 55000, profit: 16000 },
    { name: 'Jun', revenue: 67000, profit: 21000 },
  ];

  const recentShipments = invoices.slice(-5).reverse();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(totalRevenue)} 
          icon={<DollarSign className="text-blue-600" />} 
          trend="+12.5%" 
          bgColor="bg-blue-50"
        />
        <StatCard 
          title="Total Profit" 
          value={formatCurrency(totalProfit)} 
          icon={<TrendingUp className="text-green-600" />} 
          trend="+8.2%" 
          bgColor="bg-green-50"
        />
        <StatCard 
          title="Outstanding Receivables" 
          value={formatCurrency(outstandingReceivables)} 
          icon={<Clock className="text-orange-600" />} 
          trend="High Alert" 
          bgColor="bg-orange-50"
        />
        <StatCard 
          title="Outstanding Payables" 
          value={formatCurrency(outstandingPayables)} 
          icon={<AlertCircle className="text-red-600" />} 
          trend="Due Soon" 
          bgColor="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Revenue vs Profit Analysis</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `AED ${val/1000}k`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                <Area type="monotone" dataKey="profit" stroke="#22c55e" fillOpacity={1} fill="none" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-6">Recent Shipments & Profits</h3>
          <div className="space-y-4">
            {recentShipments.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No shipments found.</p>
            ) : (
              recentShipments.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900">{inv.customerName}</p>
                    <p className="text-xs text-gray-500">{inv.invoiceNumber} • {inv.destinationCountry}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">{formatCurrency(inv.totalAmount)}</p>
                    <p className="text-xs font-medium text-green-600">Profit: {formatCurrency(inv.profit)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, bgColor }: any) => (
  <div className={`p-6 rounded-xl shadow-sm border border-gray-100 bg-white`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${bgColor}`}>
        {icon}
      </div>
      <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.includes('+') ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'}`}>
        {trend}
      </span>
    </div>
    <p className="text-gray-500 text-sm font-medium">{title}</p>
    <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
  </div>
);

export default Dashboard;
