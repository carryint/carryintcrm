const fs = require('fs');

let lines = fs.readFileSync('App.tsx', 'utf8').split('\n');

// Find the line with "loadData();"
const loadDataIndex = lines.findIndex(l => l.includes('loadData();'));
console.log('loadDataIndex:', loadDataIndex);

const vendorStatusIndex = lines.findIndex(l => l.includes('const handleUpdateVendorStatus ='));
console.log('vendorStatusIndex:', vendorStatusIndex);

const authBlock = `  }, []);

  const handleLogin = async (email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = pass.trim();

    // Check live database directly to guarantee newest user accounts can log in immediately
    let userList = users;
    try {
      const { data: dbUsers } = await supabase.from('users').select('*');
      if (dbUsers && dbUsers.length > 0) {
        userList = dbUsers;
        setUsers(dbUsers);
        localStorage.setItem('carryint_users', JSON.stringify(dbUsers));
      }
    } catch (e) {
      console.warn("Could not query live users on login, using local state", e);
    }

    // Primary check: Search in users list
    let user = userList.find(u =>
      (u.email?.toLowerCase().trim() === trimmedEmail) &&
      (u.password?.trim() === trimmedPass)
    );

    // Bulletproof Fallback: Hardcoded check for default admin
    if (!user && trimmedEmail === 'info@carryint.com' && trimmedPass === 'intCC3#0') {
      user = {
        id: 'admin-1',
        name: 'Super Admin',
        email: 'info@carryint.com',
        password: 'intCC3#0',
        role: 'ADMIN'
      };
      const updated = userList.some(u => u.id === 'admin-1')
        ? userList.map(u => u.id === 'admin-1' ? user! : u)
        : [...userList, user];

      setUsers(updated);
      localStorage.setItem('carryint_users', JSON.stringify(updated));
      await supabase.from('users').upsert([user]);
    }

    if (user) {
      setCurrentUser(user);
      localStorage.setItem('carryint_current_user', JSON.stringify(user));
      setAuthError('');
    } else {
      setAuthError('Invalid credentials. Access Denied.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('carryint_current_user');
  };

  const handleAddUser = async (user: User) => {
    if (currentUser?.role !== 'ADMIN') return;
    const cleanUser: User = {
      ...user,
      email: user.email.trim().toLowerCase(),
      password: user.password?.trim() || ''
    };
    const updated = [...users.filter(u => u.id !== user.id), cleanUser];
    setUsers(updated);
    localStorage.setItem('carryint_users', JSON.stringify(updated));
    const { error } = await supabase.from('users').upsert([cleanUser]);
    if (error) {
      console.error("Error saving user to Supabase:", error);
      alert("Failed to sync user to cloud: " + error.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (currentUser?.role !== 'ADMIN') return;
    if (users.find(u => u.id === id)?.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length === 1) {
      alert("Cannot delete the last administrator.");
      return;
    }
    if (confirm('Are you sure you want to remove this user?')) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      localStorage.setItem('carryint_users', JSON.stringify(updated));
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) {
        console.error("Error deleting user from Supabase:", error);
      }
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    if (currentUser?.role !== 'ADMIN') return;
    const cleanUser: User = {
      ...updatedUser,
      email: updatedUser.email.trim().toLowerCase(),
      password: updatedUser.password?.trim() || ''
    };
    const updated = users.map(u => u.id === cleanUser.id ? cleanUser : u);
    setUsers(updated);
    localStorage.setItem('carryint_users', JSON.stringify(updated));
    const { error } = await supabase.from('users').upsert([cleanUser]);
    if (error) {
      console.error("Error updating user in Supabase:", error);
      alert("Failed to sync user update to cloud: " + error.message);
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, status: 'PAID' | 'UNPAID', transactionReference?: string) => {
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
  };`;

// Replace lines between loadDataIndex+1 and vendorStatusIndex
const newLines = [
  ...lines.slice(0, loadDataIndex + 1),
  authBlock,
  ...lines.slice(vendorStatusIndex)
];

fs.writeFileSync('App.tsx', newLines.join('\n'));
console.log('App.tsx successfully updated with authBlock!');
