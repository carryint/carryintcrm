import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://beqyvmcizjlcmkpqdkio.supabase.co';
const supabaseAnonKey = 'sb_publishable_Oco4p6m_Ap_trLAcNev_gQ_XfEW1-ys';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: inv, error: invErr } = await supabase.from('invoices').select('*');
  console.log('Invoices count:', inv?.length, invErr);

  const { data: cust, error: custErr } = await supabase.from('customers').select('*');
  console.log('Customers count:', cust?.length, custErr);

  const { data: users, error: userErr } = await supabase.from('users').select('*');
  console.log('Users count:', users?.length, userErr);
}

check();
