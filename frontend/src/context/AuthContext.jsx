import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  // Sync token to API requests automatically
  const apiFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const targetUrl = url.startsWith('/') ? `${apiBase}${url}` : url;
    const res = await fetch(targetUrl, { ...options, headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: 'Server communication error' }));
      throw new Error(errData.detail || 'Request failed');
    }
    return res.json();
  };

  // Sync Supabase user state with local database
  const syncUserSession = async (session) => {
    console.log("syncUserSession called with session:", session?.user?.email);
    if (!session || !session.user) {
      console.log("No session or user, clearing state.");
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const jwt = session.access_token;
      setToken(jwt);
      console.log("Fetching /api/auth/me with JWT:", jwt.substring(0, 20) + "...");
      
      // Fetch user profile from backend to ensure syncing with local DB
      const res = await fetch(`${apiBase}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      
      console.log("Backend response status:", res.status);
      if (res.ok) {
        const userData = await res.json();
        console.log("Backend user data received:", userData.email);
        setUser(userData);
      } else {
        const errText = await res.text();
        console.error("Backend user sync failed! Status:", res.status, "Body:", errText);
        setUser(null);
      }
    } catch (e) {
      console.error("Error syncing user session (network error?):", e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // If email is not confirmed, don't log them in fully
        if (session.user.email_confirmed_at == null) {
          setUser(null);
          setToken(null);
          setLoading(false);
        } else {
          syncUserSession(session);
        }
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        if (session.user.email_confirmed_at == null) {
          setUser(null);
          setToken(null);
        } else {
          await syncUserSession(session);
        }
      } else {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user.email_confirmed_at) {
        // We do not auto-resend verification here to prevent spam, but you could
        await supabase.auth.signOut();
        throw new Error('Please verify your email address. We have sent a verification link to your inbox.');
      }
      
      await syncUserSession(data.session);
      return data.user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (fullName, email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Immediately sync with backend so user exists in DB before verification
      if (data.session) {
        const idToken = data.session.access_token;
        await fetch(`${apiBase}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
      }

      // Supabase sends the verification email automatically by default
      // We sign out just to ensure they have to click the link
      await supabase.auth.signOut();
      setLoading(false);
      return data.user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        throw new Error(error.message);
      }
      // Note: Supabase will redirect the user to Google. 
      // The session will be picked up by onAuthStateChange when they return.
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendForgotPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      loginWithGoogle,
      sendForgotPassword,
      apiFetch
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be executed within an AuthProvider');
  }
  return context;
};
