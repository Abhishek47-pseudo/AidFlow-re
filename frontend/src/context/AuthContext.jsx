import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check expiration
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          logout();
        } else {
          const userRoles = decoded.roles || (decoded.role ? [
            decoded.role === 'volunteer' ? 'Volunteer' :
            decoded.role === 'admin' ? 'Super Admin' :
            decoded.role === 'branch manager' ? 'Branch Manager' :
            (decoded.role === 'refugee' || decoded.role === 'affected citizen') ? 'Victim' :
            decoded.role
          ] : []);

          if (userRoles.length === 0) {
            console.error('Invalid token format: Missing roles. Logging out.');
            logout();
            return;
          }

          setUser({
            _id: decoded.id,
            userClass: decoded.userClass || 'General User',
            roles: userRoles,
            username: decoded.username || ''
          });
          // Configure global axios header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (err) {
        console.error('Invalid token format:', err);
        logout();
      }
    } else {
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, [token]);

  const login = async (username, password) => {
    setError(null);
    try {
      const response = await axios.post('/api/login', { username, password });
      const { token: receivedToken, _id, userClass, roles } = response.data;
      
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser({ _id, userClass, roles, username });
      return { success: true, roles };
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Authentication failed. Please try again.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await axios.post('/api/register', userData);
      const { token: receivedToken, _id, userClass, roles } = response.data;
      
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser({ _id, userClass, roles, username: userData.username });
      return { success: true, roles };
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Registration failed.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
