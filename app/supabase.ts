import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://shmkckiwndwratacinqc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobWtja2l3bmR3cmF0YWNpbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTA4NjIsImV4cCI6MjA5MTUyNjg2Mn0.f0enfg39n94YZgKrpc6qNk0JT_NVnyvOnQYX4Rkk-Hw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false, // 🔥 ОТКЛЮЧАЕМ АВТООБНОВЛЕНИЕ
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});