import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://beqyvmcizjlcmkpqdkio.supabase.co';
const supabaseAnonKey = 'sb_publishable_Oco4p6m_Ap_trLAcNev_gQ_XfEW1-ys';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedAdmin() {
  const defaultAdmin = {
    id: 'admin-1',
    name: 'Super Admin',
    email: 'info@carryint.com',
    password: 'intCC3#0',
    role: 'ADMIN'
  };

  const { data, error } = await supabase.from('users').upsert([defaultAdmin]).select();
  console.log('Seeded admin:', data, error);
}

seedAdmin();
