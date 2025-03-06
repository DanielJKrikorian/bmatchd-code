import { createClient, User, SupabaseClient, AuthResponse } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rtzrhxxdqmnpydskixso.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_ANON_KEY:', supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars:', { supabaseUrl, supabaseAnonKey });
  throw new Error("Missing Supabase environment variables");
}

// Create Supabase client with anon key for public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token'
  }
});

// Temporarily expose supabase to window for debugging JWT
(window as { supabase?: typeof supabase }).supabase = supabase;

// Function to sign up a user (couple or vendor) with explicit role in metadata
export const signUp = async (
  email: string, 
  password: string, 
  role: 'couple' | 'vendor'
): Promise<{ data: AuthResponse['data'] | null; error: string | null }> => {
  try {
    console.log('Signing up user with role:', role);
    const { data: existingUser } = await supabase
      .from('users')
      .select('role')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      throw new Error('An account with this email already exists');
    }

    const redirectTo = import.meta.env.DEV 
      ? 'http://localhost:5173/dashboard' 
      : 'https://bmatchd.com/dashboard';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
        emailRedirectTo: redirectTo
      }
    });

    if (error) throw error;
    if (!data?.user) throw new Error('No user returned from signup');

    console.log('Signup response:', { 
      user: data.user, 
      metadata: data.user.user_metadata,
      rawAppMetaData: data.user.app_metadata
    });

    if (!data.user.user_metadata?.role) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role }
      });
      if (updateError) console.warn('Failed to update user metadata:', updateError);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Signup Error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to create account' 
    };
  }
};

// Function to check authentication status
export const checkAuth = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Function to get user role
export const getUserRole = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return user.user_metadata?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

// Function for service role (if needed for RLS policy creation)
export const getSupabaseServiceClient = (): SupabaseClient => {
  const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
  if (!supabaseServiceKey) {
    console.error('Missing Supabase service key');
    throw new Error("Missing Supabase service environment variable");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
};