import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged
} from '../firebase';
import { updateProfile } from 'firebase/auth';

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

  // Sync Firebase user state with local database
  const syncUserSession = async (firebaseUser) => {
    if (!firebaseUser) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const idToken = await firebaseUser.getIdToken(true);
      setToken(idToken);
      
      // Fetch user profile from backend to ensure syncing with Supabase DB
      const res = await fetch(`${apiBase}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        console.error("Backend user sync failed");
        setUser(null);
      }
    } catch (e) {
      console.error("Error syncing user session:", e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Listen to Firebase Auth state change on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If email is not verified, we do not log them in
        if (!firebaseUser.emailVerified) {
          setUser(null);
          setToken(null);
          setLoading(false);
        } else {
          await syncUserSession(firebaseUser);
        }
      } else {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      if (!firebaseUser.emailVerified) {
        // Automatically send a verification email if they haven't verified yet
        await sendEmailVerification(firebaseUser);
        await signOut(auth);
        throw new Error('Please verify your email address. We have sent a verification link to your inbox.');
      }
      
      await syncUserSession(firebaseUser);
      return firebaseUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (fullName, email, password) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Set display name in Firebase Auth
      await updateProfile(firebaseUser, {
        displayName: fullName
      });

      // Get ID token and sync with backend immediately to create the local DB entry
      const idToken = await firebaseUser.getIdToken(true);
      await fetch(`${apiBase}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      
      // Send verification email
      await sendEmailVerification(firebaseUser);
      
      // Sign out immediately so they must verify and log in
      await signOut(auth);
      setLoading(false);
      return firebaseUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Google sign-ins are verified by default in Firebase
      await syncUserSession(firebaseUser);
      return firebaseUser;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
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
      await sendPasswordResetEmail(auth, email);
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
