/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { API_URL } from './apiURL';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  login: (nome: string, senha: string) => Promise<boolean>;
  logout: () => void;
  register: (nome: string, senha: string) => Promise<boolean>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se o usuário está autenticado ao carregar a página
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (nome: string, senha: string): Promise<boolean> => {
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/login`, { nome, senha });

      if (response.status === 200) {
        // Simulando um token já que sua API não retorna um
        localStorage.setItem('authToken', 'dummy-token');
        localStorage.setItem('userName', nome);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Erro ao fazer login';
      setError(errorMessage);
      return false;
    }
  };

  const register = async (nome: string, senha: string): Promise<boolean> => {
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/register`, { nome, senha });

      if (response.status === 201) {
        return true;
      }
      return false;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Erro ao registrar usuário';
      setError(errorMessage);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    loading,
    login,
    logout,
    register,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};