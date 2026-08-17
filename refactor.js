const fs = require('fs');

let code = fs.readFileSync('App.tsx', 'utf8');

// 1. Add import for supabase
if (!code.includes("import { supabase } from './supabase';")) {
  code = code.replace(
    "import { generateId } from './utils';",
    "import { generateId } from './utils';\nimport { supabase } from './supabase';"
  );
}

// 2. Replace useEffect loading
const useEffectRegex = /useEffect\(\(\) => \{[\s\S]*?setIsAppLoading\(false\);\n  \}, \[\]\);/;
const newUseEffect = `useEffect(() => {
    const loadData = async () => {
      try {
        const [
          { data: savedUsers },
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
        }

        if (savedUsers && savedUsers.length > 0) {
          setUsers(savedUsers);
        } else {
          // Fallback if DB is empty
          const defaultAdmin: User = { id: 'admin-1', name: 'Super Admin', email: 'info@carryint.com', password: 'intCC3#0', role: 'ADMIN' };
          setUsers([defaultAdmin]);
          await supabase.from('users').upsert([defaultAdmin]);
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

// Helper to replace sync functions with async and add await
function makeAsync(fnName) {
  code = code.replace(new RegExp(`const ${fnName} = \\((.*?)\\) => \\{`), `const ${fnName} = async ($1) => {`);
}

function replaceStorage(fnName, oldStr, newStr) {
  // First make async
  makeAsync(fnName);
  // Then replace the specific storage call
  code = code.replace(oldStr, newStr);
}

// 3. Replace all localStorage calls inside handlers

// Users
replaceStorage('handleAddUser', 
  "localStorage.setItem('carryint_users', JSON.stringify(updated));",
  "await supabase.from('users').upsert([user]);"
);
replaceStorage('handleDeleteUser',
  "localStorage.setItem('carryint_users', JSON.stringify(updated));",
  "await supabase.from('users').delete().eq('id', id);"
);
replaceStorage('handleUpdateUser',
  "localStorage.setItem('carryint_users', JSON.stringify(updated));",
  "await supabase.from('users').upsert([updatedUser]);"
);

// Invoices
replaceStorage('handleUpdateInvoiceStatus',
  "localStorage.setItem('carryint_invoices', JSON.stringify(updated));",
  "await supabase.from('invoices').upsert([updated.find(i => i.id === invoiceId)]);"
);
replaceStorage('handleUpdateVendorStatus',
  "localStorage.setItem('carryint_invoices', JSON.stringify(updated));",
  "await supabase.from('invoices').upsert([updated.find(i => i.id === invoiceId)]);"
);
replaceStorage('handleSaveInvoice',
  "localStorage.setItem('carryint_invoices', JSON.stringify(updatedInvoices));",
  "await supabase.from('invoices').upsert([invoice]);"
);
replaceStorage('handleDeleteInvoice',
  "localStorage.setItem('carryint_invoices', JSON.stringify(updated));",
  "await supabase.from('invoices').delete().eq('id', id);"
);
// In handleDeleteAdjustmentNote, there's an invoice update
code = code.replace(
  /setInvoices\(updatedInvoices\);\n\s*localStorage\.setItem\('carryint_invoices', JSON\.stringify\(updatedInvoices\)\);/g,
  "setInvoices(updatedInvoices);\n    await supabase.from('invoices').upsert([updatedInvoices.find(i => i.id === note.originalInvoiceId)]);"
);

// Expenses
replaceStorage('handleAddExpense',
  "localStorage.setItem('carryint_expenses', JSON.stringify(updated));",
  "await supabase.from('expenses').upsert([expense]);"
);
replaceStorage('handleUpdateExpense',
  "localStorage.setItem('carryint_expenses', JSON.stringify(updated));",
  "await supabase.from('expenses').upsert([updatedExpense]);"
);
replaceStorage('handleDeleteExpense',
  "localStorage.setItem('carryint_expenses', JSON.stringify(updated));",
  "await supabase.from('expenses').delete().eq('id', id);"
);

// Adjustment Notes
replaceStorage('handleAddAdjustmentNote',
  "localStorage.setItem('carryint_adjustment_notes', JSON.stringify(updated));",
  "await supabase.from('adjustment_notes').upsert([note]);"
);
replaceStorage('handleDeleteAdjustmentNote',
  "localStorage.setItem('carryint_adjustment_notes', JSON.stringify(updated));",
  "await supabase.from('adjustment_notes').delete().eq('id', id);"
);

// Customers
replaceStorage('handleAddCustomer',
  "localStorage.setItem('carryint_customers', JSON.stringify(updated));",
  "await supabase.from('customers').upsert([customer]);"
);
replaceStorage('handleEditCustomer',
  "localStorage.setItem('carryint_customers', JSON.stringify(updated));",
  "await supabase.from('customers').upsert([updatedCustomer]);"
);
replaceStorage('handleDeleteCustomer',
  "localStorage.setItem('carryint_customers', JSON.stringify(updated));",
  "await supabase.from('customers').delete().eq('id', id);"
);

// Company Info
replaceStorage('handleUpdateCompanyInfo',
  "localStorage.setItem('carryint_company_info', JSON.stringify(info));",
  "await supabase.from('company_info').upsert([{ id: '1', ...info }]);"
);

// Vendors
replaceStorage('handleAddVendorSubmit',
  "localStorage.setItem('carryint_vendors', JSON.stringify(updatedVendors));",
  "await supabase.from('vendors').upsert([newVendor]);"
);
replaceStorage('handleEditVendor',
  "localStorage.setItem('carryint_vendors', JSON.stringify(updated));",
  "await supabase.from('vendors').upsert([v]);"
);
replaceStorage('handleDeleteVendor',
  "localStorage.setItem('carryint_vendors', JSON.stringify(updated));",
  "await supabase.from('vendors').delete().eq('id', id);"
);


fs.writeFileSync('App.tsx', code);
console.log('Refactored App.tsx');
