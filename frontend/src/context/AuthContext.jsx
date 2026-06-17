import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Sync token to API requests automatically
  const apiFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    const activeToken = token || localStorage.getItem('token');
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }
    
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: 'Server communication error' }));
      throw new Error(errData.detail || 'Request failed');
    }
    return res.json();
  };

  // On mount, verify existing JWT token
  useEffect(() => {
    const checkUserSession = async () => {
      const activeToken = localStorage.getItem('token');
      if (activeToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${activeToken}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setToken(activeToken);
          } else {
            // Local token is expired or invalid
            logout();
          }
        } catch (e) {
          console.error("Session verification failed:", e);
          logout();
        }
      }
      setLoading(false);
    };
    checkUserSession();
  }, []);

  const login = async (email, password) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (fullName, email, password) => {
    return apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name: fullName, email, password }),
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const handleGoogleCallback = async (idToken) => {
    const data = await apiFetch('/api/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
    });
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const verifyOtp = async (email, otpCode) => {
    const data = await apiFetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp_code: otpCode }),
    });
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const resendOtp = async (email) => {
    return apiFetch('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  };

  const sendForgotPassword = async (email) => {
    return apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  };

  const resetPassword = async (resetToken, newPassword) => {
    return apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: resetToken, new_password: newPassword }),
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      handleGoogleCallback,
      sendForgotPassword,
      resetPassword,
      verifyOtp,
      resendOtp,
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
