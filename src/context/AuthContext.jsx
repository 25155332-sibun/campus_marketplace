import { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, fullName) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured. Add the local environment variables first.');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    
    if (error) throw error;

    // If Supabase returns a session directly, set it immediately
    if (data?.session) {
      setUser(data.session.user);
    }
    return data;
  };

  const signIn = (email, password) => {
    if (!isSupabaseConfigured) return Promise.reject(new Error('Supabase is not configured. Add the local environment variables first.'));

    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = () => {
    if (!isSupabaseConfigured) return Promise.resolve();

    return supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);