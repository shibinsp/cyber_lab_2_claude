import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Use the current host with HTTPS for production, HTTP for localhost
// This function ensures evaluation happens in browser, not at build time
const getApiUrl = () => {
  // Runtime evaluation in browser - prioritize this over env variable
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    // Helper function to check if hostname is an IP address
    const isIPAddress = (host) => {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      return ipRegex.test(host);
    };
    
    // If localhost, use direct backend port or env variable
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return import.meta.env.VITE_API_URL || 'http://localhost:2026';
    }
    
    // If accessing via IP address, use direct backend on port 2026
    if (isIPAddress(hostname)) {
      return `${protocol}//${hostname}:2026`;
    }
    
    // For production domain (cyyberlabs.com), use same protocol and hostname
    // The host Nginx will proxy API routes to the backend
    // This prevents mixed content errors (HTTPS page -> HTTPS API)
    return `${protocol}//${hostname}`;
  }
  
  // Fallback for SSR or build time
  return import.meta.env.VITE_API_URL || 'http://localhost:2026';
};

export const API_URL = getApiUrl();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { username, password });
    const newToken = res.data.access_token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const register = async (userData) => {
    await axios.post(`${API_URL}/auth/register`, userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
