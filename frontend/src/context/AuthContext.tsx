// src/context/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AuthState, User, UserRole } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false };
    case 'LOGOUT':
      return { ...initialState, isLoading: false, token: null };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set auth token header on every request
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Verify existing token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'LOGOUT' });
        return;
      }
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await axios.get('/auth/verify');
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: res.data.data.user, token },
        });
      } catch {
        localStorage.removeItem('token');
        dispatch({ type: 'LOGOUT' });
      }
    };
    verifyToken();
  }, []);

  const login = useCallback(async (email: string, password: string, role: UserRole) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      // In demo mode, simulate login
      const demoUsers: Record<string, User> = {
        'student@fcrit.ac.in': {
          id: 'stu_001', name: 'Arjun Sharma', email: 'student@fcrit.ac.in',
          role: 'student', rollNumber: 'TE-CE-042', department: 'Computer Engineering',
        },
        'faculty@fcrit.ac.in': {
          id: 'fac_001', name: 'Prof. Meera Nair', email: 'faculty@fcrit.ac.in',
          role: 'faculty', department: 'Computer Engineering',
        },
        'lab@fcrit.ac.in': {
          id: 'lab_001', name: 'Lab Assistant Kumar', email: 'lab@fcrit.ac.in',
          role: 'lab_assistant', department: 'Computer Engineering',
        },
      };

      // Try real API first, fallback to demo
      let user: User;
      let token: string;

      try {
        const res = await axios.post('/auth/login', { email, password, role });
        user = res.data.data.user;
        token = res.data.data.token;
      } catch {
        // Demo mode fallback
        const demoUser = demoUsers[email];
        if (!demoUser || demoUser.role !== role) {
          throw new Error('Invalid credentials');
        }
        user = demoUser;
        token = `demo_token_${Date.now()}`;
      }

      localStorage.setItem('token', token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
    } catch (err: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw new Error(err.message || 'Login failed');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
