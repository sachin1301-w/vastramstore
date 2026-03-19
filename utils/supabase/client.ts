import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Singleton Supabase client - created once on first access
let supabaseInstance: SupabaseClient | null = null;

// Initialize and return the singleton instance
function initSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    console.log('[Supabase] Creating new client instance');
    supabaseInstance = createClient(
      `https://${projectId}.supabase.co`,
      publicAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'sb-juwtfhevkbfywawzzexn-auth-token'
        }
      }
    );
  }
  return supabaseInstance;
}

// Export a getter that always returns the same instance
export const getSupabase = () => initSupabase();

// For convenience, also export as supabase
export const supabase = getSupabase();
