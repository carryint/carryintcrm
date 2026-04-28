
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, DollarSign, Clock, AlertCircle, CheckCircle, CreditCard, Wallet, X, FileText, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../utils';
import { Invoice, Expense } from '../types';

interface DashboardProps {
  invoices: Invoice[];
  expenses: Expense[];
  onInvoiceClick: (invoice: Invoice) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ invoices, expenses, onInvoiceClick }) => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const grossProfit = invoices.reduce((sum, inv) => sum + inv.profit, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  
  const receivedAmount = invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
    
  const outstandingReceivables = invoices
    .filter(inv => inv.status !== 'PAID')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const paidAmount = invoices
    .filter(inv => inv.vendorStatus === 'PAID')
    .reduce((sum, inv) => sum + (inv.vendorCost || 0), 0);

  const outstandingPayables = invoices
    .filter(inv => inv.vendorStatus !== 'PAID')
    .reduce((sum, inv) => sum + (inv.vendorCost || 0), 0);

  const paidAgentCommission = invoices
    .filter(inv => inv.agentStatus === 'PAID')
    .reduce((sum, inv) => sum + (inv.agentCommission || 0), 0);

  const unpaidAgentCommission = invoices
    .filter(inv => inv.agentStatus !== 'PAID')
    .reduce((sum, inv) => sum + (inv.agentCommission || 0), 0);

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

  const handleCardClick = (filter: string) => {
    setSelectedFilter(filter);
    setShowModal(true);
  };

  const getFilteredItems = () => {
    switch (selectedFilter) {
      case 'Total Revenue': return { type: 'invoice', items: invoices };
      case 'Received Amount': return { type: 'invoice', items: invoices.filter(inv => inv.status === 'PAID') };
      case 'Outstanding Receivables': return { type: 'invoice', items: invoices.filter(inv => inv.status !== 'PAID') };
      case 'Company Expenses': return { type: 'expense', items: expenses };
      case 'Paid Amount (Vendors)': return { type: 'invoice', items: invoices.filter(inv => inv.vendorId && inv.vendorStatus === 'PAID') };
      case 'Outstanding Payables': return { type: 'invoice', items: invoices.filter(inv => inv.vendorId && inv.vendorStatus !== 'PAID') };
      case 'Paid Broker Comm.': return { type: 'invoice', items: invoices.filter(inv => (inv.agentCommission || 0) > 0 && inv.agentStatus === 'PAID') };
      case 'Unpaid Broker Comm.': return { type: 'invoice', items: invoices.filter(inv => (inv.agentCommission || 0) > 0 && inv.agentStatus !== 'PAID') };
      default: return { type: 'invoice', items: [] };
    }
  };

  const filteredResults = getFilteredItems();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(totalRevenue)} 
          icon={<DollarSign className="text-blue-600" />} 
          trend="+12.5%" 
          bgColor="bg-blue-50"
          onClick={() => handleCardClick('Total Revenue')}
        />
        <StatCard 
          title="Received Amount" 
          value={formatCurrency(receivedAmount)} 
          icon={<CheckCircle className="text-emerald-600" />} 
          trend="Secured" 
          bgColor="bg-emerald-50"
          onClick={() => handleCardClick('Received Amount')}
        />
        <StatCard 
          title="Outstanding Receivables" 
          value={formatCurrency(outstandingReceivables)} 
          icon={<Clock className="text-orange-600" />} 
          trend="High Alert" 
          bgColor="bg-orange-50"
          onClick={() => handleCardClick('Outstanding Receivables')}
        />
        <StatCard 
          title="Gross Profit" 
          value={formatCurrency(grossProfit)} 
          icon={<TrendingUp className="text-green-600" />} 
          trend="Invoices" 
          bgColor="bg-green-50"
        />
        <StatCard 
          title="Company Expenses" 
          value={formatCurrency(totalExpenses)} 
          icon={<Wallet className="text-red-600" />} 
          trend="Outflow" 
          bgColor="bg-red-50"
          onClick={() => handleCardClick('Company Expenses')}
        />
        <StatCard 
          title="Net Profit" 
          value={formatCurrency(netProfit)} 
          icon={<TrendingUp className="text-orange-600" />} 
          trend="Final" 
          bgColor="bg-orange-50"
        />
        <StatCard 
          title="Paid Amount (Vendors)" 
          value={formatCurrency(paidAmount)} 
          icon={<CreditCard className="text-purple-600" />} 
          trend="Settled" 
          bgColor="bg-purple-50"
          onClick={() => handleCardClick('Paid Amount (Vendors)')}
        />
        <StatCard 
          title="Outstanding Payables" 
          value={formatCurrency(outstandingPayables)} 
          icon={<AlertCircle className="text-red-600" />} 
          trend="Due Soon" 
          bgColor="bg-red-50"
          onClick={() => handleCardClick('Outstanding Payables')}
        />
        <StatCard 
          title="Paid Broker Comm." 
          value={formatCurrency(paidAgentCommission)} 
          icon={<CreditCard className="text-teal-600" />} 
          trend="Settled" 
          bgColor="bg-teal-50"
          onClick={() => handleCardClick('Paid Broker Comm.')}
        />
        <StatCard 
          title="Unpaid Broker Comm." 
          value={formatCurrency(unpaidAgentCommission)} 
          icon={<Clock className="text-pink-600" />} 
          trend="Pending" 
          bgColor="bg-pink-50"
          onClick={() => handleCardClick('Unpaid Broker Comm.')}
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
                <div 
                  key={inv.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-orange-200"
                  onClick={() => onInvoiceClick(inv)}
                >
                  <div>
                    <p className="font-semibold text-gray-900">{inv.customerName}</p>
                    <p className="text-xs text-gray-500">{inv.invoiceNumber} • {inv.items[0]?.coo || 'N/A'} to {inv.destinationCountry}</p>
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

      {/* Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedFilter}</h3>
                <p className="text-sm text-gray-500">
                  Showing {filteredResults.items.length} {filteredResults.type === 'invoice' ? 'invoices' : 'expenses'}
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {filteredResults.items.length === 0 ? (
                <div className="text-center py-20">
                  <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-500 font-medium">No results found for this category.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-0">
                      <tr>
                        {filteredResults.type === 'invoice' ? (
                          <>
                            <th className="px-4 py-3 border-b">Inv No</th>
                            <th className="px-4 py-3 border-b">Date</th>
                            <th className="px-4 py-3 border-b">Customer</th>
                            <th className="px-4 py-3 border-b">From</th>
                            <th className="px-4 py-3 border-b">To</th>
                            <th className="px-4 py-3 border-b text-right">Total Amount</th>
                            <th className="px-4 py-3 border-b text-center">Status</th>
                            {selectedFilter === 'Gross Profit' || selectedFilter === 'Net Profit' ? (
                              <th className="px-4 py-3 border-b text-right">Profit</th>
                            ) : null}
                            {selectedFilter?.includes('Broker') && (
                              <th className="px-4 py-3 border-b text-right">Broker Comm.</th>
                            )}
                            {selectedFilter?.includes('Vendor') || selectedFilter?.includes('Payables') ? (
                              <th className="px-4 py-3 border-b text-right">Vendor Cost</th>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-3 border-b">Date</th>
                            <th className="px-4 py-3 border-b">Details</th>
                            <th className="px-4 py-3 border-b">Payee</th>
                            <th className="px-4 py-3 border-b text-right">Amount</th>
                            <th className="px-4 py-3 border-b text-center">Method</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredResults.items.map((item: any) => (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-gray-50 transition-colors ${filteredResults.type === 'invoice' ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (filteredResults.type === 'invoice') {
                              onInvoiceClick(item);
                              setShowModal(false);
                            }
                          }}
                        >
                          {filteredResults.type === 'invoice' ? (
                            <>
                              <td className="px-4 py-4 font-bold text-gray-900">{item.invoiceNumber}</td>
                              <td className="px-4 py-4 text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                              <td className="px-4 py-4 text-sm font-medium">{item.customerName}</td>
                              <td className="px-4 py-4">
                                <span className="text-[10px] font-black px-2 py-1 rounded bg-orange-50 text-orange-700 border border-orange-100 uppercase">
                                  {item.items[0]?.coo || 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-[10px] font-black px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                                  {item.destinationCountry}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right font-bold text-orange-600">{formatCurrency(item.totalAmount)}</td>
                              <td className="px-4 py-4 text-center">
                                <span className={`text-[10px] font-black px-2 py-1 rounded ${
                                  item.status === 'PAID' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              {selectedFilter === 'Gross Profit' || selectedFilter === 'Net Profit' ? (
                                <td className="px-4 py-4 text-right font-bold text-green-600">{formatCurrency(item.profit)}</td>
                              ) : null}
                              {selectedFilter?.includes('Broker') && (
                                <td className="px-4 py-4 text-right font-bold text-teal-600">{formatCurrency(item.agentCommission || 0)}</td>
                              )}
                              {selectedFilter?.includes('Vendor') || selectedFilter?.includes('Payables') ? (
                                <td className="px-4 py-4 text-right font-bold text-blue-600">{formatCurrency(item.vendorCost || 0)}</td>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-4 text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                              <td className="px-4 py-4 text-sm font-medium">{item.itemDetails}</td>
                              <td className="px-4 py-4 text-sm text-gray-500">{item.payeeName}</td>
                              <td className="px-4 py-4 text-right font-bold text-red-600">{formatCurrency(item.amount)}</td>
                              <td className="px-4 py-4 text-center text-xs text-gray-400 font-bold uppercase">{item.paymentMethod}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-all shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, bgColor, onClick }: any) => {
  const isClickable = !!onClick;
  const CardWrapper = isClickable ? 'button' : 'div';
  
  return (
    <CardWrapper 
      onClick={onClick}
      className={`p-6 rounded-xl shadow-sm border border-gray-100 bg-white text-left transition-all ${
        isClickable 
          ? 'hover:border-orange-200 hover:shadow-md active:scale-95 group cursor-pointer' 
          : ''
      } relative overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          {icon}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend.includes('+') || trend === 'Secured' || trend === 'Settled' || trend === 'Final' || trend === 'Invoices' ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'}`}>
          {trend}
        </span>
      </div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <div className="flex items-end justify-between">
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        {isClickable && <ExternalLink size={14} className="text-gray-300 group-hover:text-orange-500 transition-colors mb-1" />}
      </div>
    </CardWrapper>
  );
};

export default Dashboard;
