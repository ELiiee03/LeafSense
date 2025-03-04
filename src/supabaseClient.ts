// // supabaseClient.ts
// import { createClient } from '@supabase/supabase-js';

// // Read environment variables
// const supabaseUrl = 'https://ybgmtdzmmqkgllrxshst.supabase.co';
// const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZ210ZHptbXFrZ2xscnhzaHN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkwNTIwMTUsImV4cCI6MjA0NDYyODAxNX0.uo5qvPqQLfUX-3A5jXsyC0d8sNLusra8MWbQE-Dn0G4';

// export const supabase = createClient(supabaseUrl, supabaseKey);

// filepath: /c:/laragon/www/leafify/leafify/src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and Key must be provided.');
  }  

export const supabase = createClient(supabaseUrl, supabaseKey);
