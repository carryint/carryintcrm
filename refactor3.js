const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// 1. imports
if (!code.includes("import { supabase }")) {
  code = code.replace(
    "import AdjustmentsManagement from './components/AdjustmentsManagement';",
    "import AdjustmentsManagement from './components/AdjustmentsManagement';\nimport { MigrationTool } from './components/MigrationTool';\nimport { supabase } from './supabase';"
  );
}

// 2. migration tool in settings
code = code.replace(
  "case 'settings':\n        return (\n          <Settings",
  "case 'settings':\n        return (\n          <>\n            <MigrationTool />\n            <Settings"
);
code = code.replace(
  "currentUser={currentUser}\n          />\n        );",
  "currentUser={currentUser}\n          />\n          </>\n        );"
);

// 3. useEffect
const useEffectRegex = /useEffect\(\(\) => \{[\s\S]*?setIsAppLoading\(false\);\n  \}, \[\]\);/;
const newUseEffect = `useEffect(() => {
    const loadData = async () => {
      try {
        const [
          { data: savedUsers, error: usersErr },
          { data: savedCompanyInfo },
          { data: savedCustomers },
          { data: savedVendors },
          { data: savedInvoices },
          { data: savedExpenses },
          { data: savedAdjustments }
        ] = await Promise.all([
          supabase.from('users').select('*'),
          supabase.from('company_info').select('*'),
          supabase.from('customers').select('*'),
          supabase.from('vendors').select('*'),
          supabase.from('invoices').select('*'),
          supabase.from('expenses').select('*'),
          supabase.from('adjustment_notes').select('*')
        ]);

        if (savedCompanyInfo && savedCompanyInfo.length > 0) {
          setCompanyInfo(savedCompanyInfo[0] as any);
        } else {
          const initial = { ...DEFAULT_COMPANY_INFO, trn: '100456209800003' };
          setCompanyInfo(initial as any);
        }

        const defaultAdmin: User = {
          id: 'admin-1',
          name: 'Super Admin',
          email: 'info@carryint.com',
          password: 'intCC3#0',
          role: 'ADMIN'
        };

        if (savedUsers && savedUsers.length > 0) {
          setUsers(savedUsers);
        } else {
          setUsers([defaultAdmin]);
          try {
            await supabase.from('users').upsert([defaultAdmin]);
          } catch (e) {
            console.error('Error seeding default admin:', e);
          }
        }

        if (savedCustomers) setCustomers(savedCustomers);
        if (savedVendors) setVendors(savedVendors);
        if (savedInvoices) setInvoices(savedInvoices);
        if (savedExpenses) setExpenses(savedExpenses);
        if (savedAdjustments) setAdjustmentNotes(savedAdjustments);

        const sessionUser = localStorage.getItem('carryint_current_user');
        if (sessionUser) {
          setCurrentUser(JSON.parse(sessionUser));
        }
      } catch (error) {
        console.error("Error loading data from Supabase:", error);
      } finally {
        setIsAppLoading(false);
      }
    };
    loadData();
  }, []);`;

code = code.replace(useEffectRegex, newUseEffect);

// 4. Replacements for sync handlers to async Supabase calls
const replacements = [
  // handleLogin (make async)
  [ "const handleLogin = (email: string, pass: string) => {", "const handleLogin = async (email: string, pass: string) => {" ],
  [ "setUsers(updated);\n      localStorage.setItem('carryint_users', JSON.stringify(updated));", "setUsers(updated);\n      await supabase.from('users').upsert([user]);" ],
  
  // handleAddUser
  [ "const handleAddUser = (user: User) => {", "const handleAddUser = async (user: User) => {" ],
  [ "setUsers(updated);\n    localStorage.setItem('carryint_users', JSON.stringify(updated));", "setUsers(updated);\n    await supabase.from('users').upsert([user]);" ],
  
  // handleDeleteUser
  [ "const handleDeleteUser = (id: string) => {", "const handleDeleteUser = async (id: string) => {" ],
  [ "setUsers(updated);\n      localStorage.setItem('carryint_users', JSON.stringify(updated));", "setUsers(updated);\n      await supabase.from('users').delete().eq('id', id);" ],
  
  // handleUpdateUser
  [ "const handleUpdateUser = (updatedUser: User) => {", "const handleUpdateUser = async (updatedUser: User) => {" ],
  [ "setUsers(updated);\n    localStorage.setItem('carryint_users', JSON.stringify(updated));", "setUsers(updated);\n    await supabase.from('users').upsert([updatedUser]);" ],
  
  // handleUpdateInvoiceStatus
  [ "const handleUpdateInvoiceStatus = (invoiceId: string, status: 'PAID' | 'UNPAID', transactionReference?: string) => {", "const handleUpdateInvoiceStatus = async (invoiceId: string, status: 'PAID' | 'UNPAID', transactionReference?: string) => {" ],
  [ "setInvoices(updated);\n    localStorage.setItem('carryint_invoices', JSON.stringify(updated));", "setInvoices(updated);\n    await supabase.from('invoices').upsert([updated.find(i => i.id === invoiceId)]);" ],
  
  // handleUpdateVendorStatus
  [ "const handleUpdateVendorStatus = (invoiceId: string, vendorStatus: 'PAID' | 'UNPAID', vendorPaymentDate?: string, vendorTransactionReference?: string) => {", "const handleUpdateVendorStatus = async (invoiceId: string, vendorStatus: 'PAID' | 'UNPAID', vendorPaymentDate?: string, vendorTransactionReference?: string) => {" ],
  [ "setInvoices(updated);\n    localStorage.setItem('carryint_invoices', JSON.stringify(updated));", "setInvoices(updated);\n    await supabase.from('invoices').upsert([updated.find(i => i.id === invoiceId)]);" ],

  // handleAddExpense
  [ "const handleAddExpense = (expense: Expense) => {", "const handleAddExpense = async (expense: Expense) => {" ],
  [ "setExpenses(updated);\n    localStorage.setItem('carryint_expenses', JSON.stringify(updated));", "setExpenses(updated);\n    await supabase.from('expenses').upsert([expense]);" ],
  
  // handleUpdateExpense
  [ "const handleUpdateExpense = (updatedExpense: Expense) => {", "const handleUpdateExpense = async (updatedExpense: Expense) => {" ],
  [ "setExpenses(updated);\n    localStorage.setItem('carryint_expenses', JSON.stringify(updated));", "setExpenses(updated);\n    await supabase.from('expenses').upsert([updatedExpense]);" ],
  
  // handleDeleteExpense
  [ "const handleDeleteExpense = (id: string) => {", "const handleDeleteExpense = async (id: string) => {" ],
  [ "setExpenses(updated);\n    localStorage.setItem('carryint_expenses', JSON.stringify(updated));", "setExpenses(updated);\n    await supabase.from('expenses').delete().eq('id', id);" ],
  
  // handleAddAdjustmentNote
  [ "const handleAddAdjustmentNote = (note: AdjustmentNote) => {", "const handleAddAdjustmentNote = async (note: AdjustmentNote) => {" ],
  [ "setAdjustmentNotes(updated);\n    localStorage.setItem('carryint_adjustment_notes', JSON.stringify(updated));", "setAdjustmentNotes(updated);\n    await supabase.from('adjustment_notes').upsert([note]);" ],
  
  // handleDeleteAdjustmentNote
  [ "const handleDeleteAdjustmentNote = (id: string) => {", "const handleDeleteAdjustmentNote = async (id: string) => {" ],
  [ "setInvoices(updatedInvoices);\n        localStorage.setItem('carryint_invoices', JSON.stringify(updatedInvoices));", "setInvoices(updatedInvoices);\n        await supabase.from('invoices').upsert([updatedInvoices.find(i => i.id === note.originalInvoiceId)]);" ],
  [ "setAdjustmentNotes(updated);\n    localStorage.setItem('carryint_adjustment_notes', JSON.stringify(updated));", "setAdjustmentNotes(updated);\n    await supabase.from('adjustment_notes').delete().eq('id', id);" ],
  
  // handleSaveInvoice
  [ "const handleSaveInvoice = (invoice: Invoice) => {", "const handleSaveInvoice = async (invoice: Invoice) => {" ],
  [ "setInvoices(updatedInvoices);\n    localStorage.setItem('carryint_invoices', JSON.stringify(updatedInvoices));", "setInvoices(updatedInvoices);\n    await supabase.from('invoices').upsert([invoice]);" ],
  
  // handleDeleteInvoice
  [ "const handleDeleteInvoice = (id: string) => {", "const handleDeleteInvoice = async (id: string) => {" ],
  [ "setInvoices(updated);\n    localStorage.setItem('carryint_invoices', JSON.stringify(updated));", "setInvoices(updated);\n    await supabase.from('invoices').delete().eq('id', id);" ],
  
  // handleAddCustomer
  [ "const handleAddCustomer = (customer: Customer) => {", "const handleAddCustomer = async (customer: Customer) => {" ],
  [ "setCustomers(updated);\n    localStorage.setItem('carryint_customers', JSON.stringify(updated));", "setCustomers(updated);\n    await supabase.from('customers').upsert([customer]);" ],
  
  // handleEditCustomer
  [ "const handleEditCustomer = (updatedCustomer: Customer) => {", "const handleEditCustomer = async (updatedCustomer: Customer) => {" ],
  [ "setCustomers(updated);\n    localStorage.setItem('carryint_customers', JSON.stringify(updated));", "setCustomers(updated);\n    await supabase.from('customers').upsert([updatedCustomer]);" ],
  
  // handleDeleteCustomer
  [ "const handleDeleteCustomer = (id: string) => {", "const handleDeleteCustomer = async (id: string) => {" ],
  [ "setCustomers(updated);\n      localStorage.setItem('carryint_customers', JSON.stringify(updated));", "setCustomers(updated);\n      await supabase.from('customers').delete().eq('id', id);" ],
  
  // handleUpdateCompanyInfo
  [ "const handleUpdateCompanyInfo = (info: CompanyInfo) => {", "const handleUpdateCompanyInfo = async (info: CompanyInfo) => {" ],
  [ "setCompanyInfo(info);\n    localStorage.setItem('carryint_company_info', JSON.stringify(info));", "setCompanyInfo(info);\n    await supabase.from('company_info').upsert([{ id: '1', ...info }]);" ],
  
  // handleAddVendorSubmit (in Vendor modal)
  [ "const handleAddVendorSubmit = (e: React.FormEvent) => {", "const handleAddVendorSubmit = async (e: React.FormEvent) => {" ],
  [ "setVendors(updatedVendors);\n        localStorage.setItem('carryint_vendors', JSON.stringify(updatedVendors));", "setVendors(updatedVendors);\n        await supabase.from('vendors').upsert([{ ...editingVendor, ...newVendor }]);" ],
  [ "setVendors(updated);\n        localStorage.setItem('carryint_vendors', JSON.stringify(updated));", "setVendors(updated);\n        await supabase.from('vendors').upsert([vendorToAdd]);" ],
  
  // handleDeleteVendor
  [ "const handleDeleteVendor = (id: string, e: React.MouseEvent) => {", "const handleDeleteVendor = async (id: string, e: React.MouseEvent) => {" ],
  [ "setVendors(updated);\n      localStorage.setItem('carryint_vendors', JSON.stringify(updated));", "setVendors(updated);\n      await supabase.from('vendors').delete().eq('id', id);" ]
];

replacements.forEach(([oldStr, newStr]) => {
  code = code.replace(oldStr, newStr);
});

fs.writeFileSync('App.tsx', code);
console.log('Done refactoring with refactor3!');
