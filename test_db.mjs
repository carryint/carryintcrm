import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://beqyvmcizjlcmkpqdkio.supabase.co';
const supabaseAnonKey = 'sb_publishable_Oco4p6m_Ap_trLAcNev_gQ_XfEW1-ys';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data: invoices, error: invErr } = await supabase.from('invoices').select('id, invoiceNumber');
  console.log('Invoices count:', invoices?.length, 'Error:', invErr);

  const { data: customers, error: custErr } = await supabase.from('customers').select('id, name');
  console.log('Customers count:', customers?.length, 'Error:', custErr);

  const { data: expenses, error: expErr } = await supabase.from('expenses').select('id');
  console.log('Expenses count:', expenses?.length, 'Error:', expErr);

  const { data: vendors, error: venErr } = await supabase.from('vendors').select('id');
  console.log('Vendors count:', vendors?.length, 'Error:', venErr);

  const { data: users, error: userErr } = await supabase.from('users').select('id, email');
  console.log('Users count:', users?.length, 'Error:', userErr);
}

test();
