import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://healydbigtttfbrorbwy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYWx5ZGJpZ3R0dGZicm9yYnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjI2MTcsImV4cCI6MjA3Njk5ODYxN30.TVkB7mlMeuPldljh2uHkJQ2RVrrO2eT_pzDfH2NC_GU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  // In some sandboxed environments, explicitly passing the global fetch can resolve network errors.
  global: {
    fetch: window.fetch.bind(window),
  },
});
