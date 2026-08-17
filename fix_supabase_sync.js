const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');

// 1. handleAddUser
code = code.replace(
`  const handleAddUser = async (user: User) => {
    if (currentUser?.role !== 'ADMIN') return;
    const updated = [...users, user];
    setUsers(updated);
    localStorage.setItem('carryint_users', JSON.stringify(updated));
  };`,
`  const handleAddUser = async (user: User) => {
    if (currentUser?.role !== 'ADMIN') return;
    const updated = [...users, user];
    setUsers(updated);
    localStorage.setItem('carryint_users', JSON.stringify(updated));
    await supabase.from('users').upsert([user]);
  };`
);

// 2. handleDeleteUser
code = code.replace(
`  const handleDeleteUser = async (id: string) => {
    if (currentUser?.role !== 'ADMIN') return;
    if (users.find(u => u.id === id)?.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length === 1) {
      alert("Cannot delete the last administrator.");
      return;
    }
    if (confirm('Are you sure you want to remove this user?')) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      localStorage.setItem('carryint_users', JSON.stringify(updated));
    }
  };`,
`  const handleDeleteUser = async (id: string) => {
    if (currentUser?.role !== 'ADMIN') return;
    if (users.find(u => u.id === id)?.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length === 1) {
      alert("Cannot delete the last administrator.");
      return;
    }
    if (confirm('Are you sure you want to remove this user?')) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      localStorage.setItem('carryint_users', JSON.stringify(updated));
      await supabase.from('users').delete().eq('id', id);
    }
  };`
);

// 3. handleUpdateUser
code = code.replace(
`  const handleUpdateUser = async (updatedUser: User) => {
    if (currentUser?.role !== 'ADMIN') return;
    const updated = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updated);
    localStorage.setItem('carryint_users', JSON.stringify(updated));
  };`,
`  const handleUpdateUser = async (updatedUser: User) => {
    if (currentUser?.role !== 'ADMIN') return;
    const updated = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updated);
    localStorage.setItem('carryint_users', JSON.stringify(updated));
    await supabase.from('users').upsert([updatedUser]);
  };`
);

// 4. handleUpdateInvoiceStatus
code = code.replace(
`  const handleUpdateInvoiceStatus = async (invoiceId: string, status: 'PAID' | 'UNPAID', transactionReference?: string) => {
    const updated = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status,
          paymentDate: status === 'PAID' ? (inv.paymentDate || new Date().toISOString().split('T')[0]) : undefined,
          paymentMethod: status === 'PAID' ? (inv.paymentMethod || 'Bank Transfer') : undefined,
          transactionReference: status === 'PAID' ? (transactionReference || inv.transactionReference) : undefined
        };
      }
      return inv;
    });
    setInvoices(updated);
    localStorage.setItem('carryint_invoices', JSON.stringify(updated));
  };`,
`  const handleUpdateInvoiceStatus = async (invoiceId: string, status: 'PAID' | 'UNPAID', transactionReference?: string) => {
    const updated = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          status,
          paymentDate: status === 'PAID' ? (inv.paymentDate || new Date().toISOString().split('T')[0]) : undefined,
          paymentMethod: status === 'PAID' ? (inv.paymentMethod || 'Bank Transfer') : undefined,
          transactionReference: status === 'PAID' ? (transactionReference || inv.transactionReference) : undefined
        };
      }
      return inv;
    });
    setInvoices(updated);
    localStorage.setItem('carryint_invoices', JSON.stringify(updated));
    const target = updated.find(i => i.id === invoiceId);
    if (target) await supabase.from('invoices').upsert([target]);
  };`
);

// 5. handleUpdateVendorStatus
code = code.replace(
`  const handleUpdateVendorStatus = async (invoiceId: string, vendorStatus: 'PAID' | 'UNPAID', vendorPaymentDate?: string, vendorTransactionReference?: string) => {
    const updated = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          vendorStatus,
          vendorPaymentDate: vendorStatus === 'PAID' ? (vendorPaymentDate || inv.vendorPaymentDate || new Date().toISOString().split('T')[0]) : undefined,
          vendorTransactionReference: vendorStatus === 'PAID' ? (vendorTransactionReference !== undefined ? vendorTransactionReference : inv.vendorTransactionReference) : undefined
        };
      }
      return inv;
    });
    setInvoices(updated);
    localStorage.setItem('carryint_invoices', JSON.stringify(updated));
  };`,
`  const handleUpdateVendorStatus = async (invoiceId: string, vendorStatus: 'PAID' | 'UNPAID', vendorPaymentDate?: string, vendorTransactionReference?: string) => {
    const updated = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          vendorStatus,
          vendorPaymentDate: vendorStatus === 'PAID' ? (vendorPaymentDate || inv.vendorPaymentDate || new Date().toISOString().split('T')[0]) : undefined,
          vendorTransactionReference: vendorStatus === 'PAID' ? (vendorTransactionReference !== undefined ? vendorTransactionReference : inv.vendorTransactionReference) : undefined
        };
      }
      return inv;
    });
    setInvoices(updated);
    localStorage.setItem('carryint_invoices', JSON.stringify(updated));
    const target = updated.find(i => i.id === invoiceId);
    if (target) await supabase.from('invoices').upsert([target]);
  };`
);

// 6. handleAddExpense
code = code.replace(
`  const handleAddExpense = async (expense: Expense) => {
    const updated = [...expenses, expense];
    setExpenses(updated);
    localStorage.setItem('carryint_expenses', JSON.stringify(updated));
  };`,
`  const handleAddExpense = async (expense: Expense) => {
    const updated = [...expenses, expense];
    setExpenses(updated);
    localStorage.setItem('carryint_expenses', JSON.stringify(updated));
    await supabase.from('expenses').upsert([expense]);
  };`
);

// 7. handleUpdateExpense
code = code.replace(
`  const handleUpdateExpense = async (updatedExpense: Expense) => {
    const updated = expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e);
    setExpenses(updated);
    localStorage.setItem('carryint_expenses', JSON.stringify(updated));
  };`,
`  const handleUpdateExpense = async (updatedExpense: Expense) => {
    const updated = expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e);
    setExpenses(updated);
    localStorage.setItem('carryint_expenses', JSON.stringify(updated));
    await supabase.from('expenses').upsert([updatedExpense]);
  };`
);

// 8. handleDeleteExpense
code = code.replace(
`  const handleDeleteExpense = async (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    localStorage.setItem('carryint_expenses', JSON.stringify(updated));
  };`,
`  const handleDeleteExpense = async (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    localStorage.setItem('carryint_expenses', JSON.stringify(updated));
    await supabase.from('expenses').delete().eq('id', id);
  };`
);

// 9. handleAddAdjustmentNote
code = code.replace(
`  const handleAddAdjustmentNote = async (note: AdjustmentNote) => {
    const updated = [...adjustmentNotes, note];
    setAdjustmentNotes(updated);
    localStorage.setItem('carryint_adjustment_notes', JSON.stringify(updated));`,
`  const handleAddAdjustmentNote = async (note: AdjustmentNote) => {
    const updated = [...adjustmentNotes, note];
    setAdjustmentNotes(updated);
    localStorage.setItem('carryint_adjustment_notes', JSON.stringify(updated));
    await supabase.from('adjustment_notes').upsert([note]);`
);

// 10. handleDeleteAdjustmentNote
code = code.replace(
`  const handleDeleteAdjustmentNote = async (id: string) => {
    const noteToDelete = adjustmentNotes.find(n => n.id === id);
    if (!noteToDelete) return;

    const updated = adjustmentNotes.filter(n => n.id !== id);
    setAdjustmentNotes(updated);
    localStorage.setItem('carryint_adjustment_notes', JSON.stringify(updated));`,
`  const handleDeleteAdjustmentNote = async (id: string) => {
    const noteToDelete = adjustmentNotes.find(n => n.id === id);
    if (!noteToDelete) return;

    const updated = adjustmentNotes.filter(n => n.id !== id);
    setAdjustmentNotes(updated);
    localStorage.setItem('carryint_adjustment_notes', JSON.stringify(updated));
    await supabase.from('adjustment_notes').delete().eq('id', id);`
);

// 11. handleSaveInvoice
code = code.replace(
`  const handleSaveInvoice = async (invoice: Invoice) => {
    const exists = invoices.find(inv => inv.id === invoice.id);
    let updatedInvoices;
    if (exists) {
      updatedInvoices = invoices.map(inv => inv.id === invoice.id ? invoice : inv);
    } else {
      updatedInvoices = [...invoices, invoice];
    }
    setInvoices(updatedInvoices);
    localStorage.setItem('carryint_invoices', JSON.stringify(updatedInvoices));
    setSelectedInvoice(invoice);
    setActiveTab('view-invoice');
  };`,
`  const handleSaveInvoice = async (invoice: Invoice) => {
    const exists = invoices.find(inv => inv.id === invoice.id);
    let updatedInvoices;
    if (exists) {
      updatedInvoices = invoices.map(inv => inv.id === invoice.id ? invoice : inv);
    } else {
      updatedInvoices = [...invoices, invoice];
    }
    setInvoices(updatedInvoices);
    localStorage.setItem('carryint_invoices', JSON.stringify(updatedInvoices));
    await supabase.from('invoices').upsert([invoice]);
    setSelectedInvoice(invoice);
    setActiveTab('view-invoice');
  };`
);

// 12. handleDeleteInvoice
code = code.replace(
`  const handleDeleteInvoice = async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      const updated = invoices.filter(inv => inv.id !== id);
      setInvoices(updated);
      localStorage.setItem('carryint_invoices', JSON.stringify(updated));
    }
  };`,
`  const handleDeleteInvoice = async (id: string) => {
    if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      const updated = invoices.filter(inv => inv.id !== id);
      setInvoices(updated);
      localStorage.setItem('carryint_invoices', JSON.stringify(updated));
      await supabase.from('invoices').delete().eq('id', id);
    }
  };`
);

// 13. handleAddCustomer
code = code.replace(
`  const handleAddCustomer = async (customer: Customer) => {
    const updated = [...customers, customer];
    setCustomers(updated);
    localStorage.setItem('carryint_customers', JSON.stringify(updated));
  };`,
`  const handleAddCustomer = async (customer: Customer) => {
    const updated = [...customers, customer];
    setCustomers(updated);
    localStorage.setItem('carryint_customers', JSON.stringify(updated));
    await supabase.from('customers').upsert([customer]);
  };`
);

// 14. handleEditCustomer
code = code.replace(
`  const handleEditCustomer = async (updatedCustomer: Customer) => {
    const updated = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    setCustomers(updated);
    localStorage.setItem('carryint_customers', JSON.stringify(updated));
  };`,
`  const handleEditCustomer = async (updatedCustomer: Customer) => {
    const updated = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    setCustomers(updated);
    localStorage.setItem('carryint_customers', JSON.stringify(updated));
    await supabase.from('customers').upsert([updatedCustomer]);
  };`
);

// 15. handleDeleteCustomer
code = code.replace(
`  const handleDeleteCustomer = async (id: string) => {
    if (confirm('Are you sure you want to remove this client? This will affect existing invoices linked to this client.')) {
      const updated = customers.filter(c => c.id !== id);
      setCustomers(updated);
      localStorage.setItem('carryint_customers', JSON.stringify(updated));
    }
  };`,
`  const handleDeleteCustomer = async (id: string) => {
    if (confirm('Are you sure you want to remove this client? This will affect existing invoices linked to this client.')) {
      const updated = customers.filter(c => c.id !== id);
      setCustomers(updated);
      localStorage.setItem('carryint_customers', JSON.stringify(updated));
      await supabase.from('customers').delete().eq('id', id);
    }
  };`
);

// 16. handleUpdateCompanyInfo
code = code.replace(
`  const handleUpdateCompanyInfo = async (info: CompanyInfo) => {
    setCompanyInfo(info);
    localStorage.setItem('carryint_company_info', JSON.stringify(info));
  };`,
`  const handleUpdateCompanyInfo = async (info: CompanyInfo) => {
    setCompanyInfo(info);
    localStorage.setItem('carryint_company_info', JSON.stringify(info));
    await supabase.from('company_info').upsert([{ id: '1', ...info }]);
  };`
);

// 17. handleAddVendorSubmit
code = code.replace(
`  const handleAddVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newVendor.name && newVendor.contact && newVendor.address) {
      if (editingVendor) {
        const updatedVendors = vendors.map(v => v.id === editingVendor.id ? { ...editingVendor, ...newVendor } as Vendor : v);
        setVendors(updatedVendors);
        localStorage.setItem('carryint_vendors', JSON.stringify(updatedVendors));
        setEditingVendor(null);
      } else {
        const vendorToAdd: Vendor = {
          ...(newVendor as Vendor),
          id: generateId(),
        };
        const updated = [...vendors, vendorToAdd];
        setVendors(updated);
        localStorage.setItem('carryint_vendors', JSON.stringify(updated));
      }
      setIsAddingVendor(false);
      setNewVendor({});
    }
  };`,
`  const handleAddVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newVendor.name && newVendor.contact && newVendor.address) {
      if (editingVendor) {
        const updatedVendors = vendors.map(v => v.id === editingVendor.id ? { ...editingVendor, ...newVendor } as Vendor : v);
        setVendors(updatedVendors);
        localStorage.setItem('carryint_vendors', JSON.stringify(updatedVendors));
        await supabase.from('vendors').upsert([{ ...editingVendor, ...newVendor }]);
        setEditingVendor(null);
      } else {
        const vendorToAdd: Vendor = {
          ...(newVendor as Vendor),
          id: generateId(),
        };
        const updated = [...vendors, vendorToAdd];
        setVendors(updated);
        localStorage.setItem('carryint_vendors', JSON.stringify(updated));
        await supabase.from('vendors').upsert([vendorToAdd]);
      }
      setIsAddingVendor(false);
      setNewVendor({});
    }
  };`
);

// 18. handleDeleteVendor
code = code.replace(
`  const handleDeleteVendor = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this vendor?')) {
      const updated = vendors.filter(v => v.id !== id);
      setVendors(updated);
      localStorage.setItem('carryint_vendors', JSON.stringify(updated));
    }
  };`,
`  const handleDeleteVendor = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this vendor?')) {
      const updated = vendors.filter(v => v.id !== id);
      setVendors(updated);
      localStorage.setItem('carryint_vendors', JSON.stringify(updated));
      await supabase.from('vendors').delete().eq('id', id);
    }
  };`
);

fs.writeFileSync('App.tsx', code);
console.log('App.tsx all handlers updated successfully!');
