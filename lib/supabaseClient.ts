import { createClient } from '@supabase/supabase-js';

// Her henter vi dine adgangskoder fra .env filen. 
// Det er vigtigt for sikkerheden, at de ikke står direkte i koden! 🔒
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Vi opretter forbindelsen (klienten)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);