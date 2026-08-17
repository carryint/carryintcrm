/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://beqyvmcizjlcmkpqdkio.supabase.co';
const supabaseAnonKey = 'sb_publishable_Oco4p6m_Ap_trLAcNev_gQ_XfEW1-ys';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
