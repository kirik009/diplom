import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

export type User = {
  id: number;
  username: string;
  role: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  groupId?: number;
  departmentId?: number;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {
    throw new Error('Not implemented');
  },
  logout: async () => {
    throw new Error('Not implemented');
  },
});

// Mock users for demo purposes
const MOCK_USERS = {
  student: {
    id: 1,
    username: 'student',
    role: 'student',
    firstName: 'Иван',
    lastName: 'Студентов',
    groupId: 1
  },
  teacher: {
    id: 2,
    username: 'teacher',
    role: 'teacher',
    firstName: 'Петр',
    lastName: 'Преподавателев',
    departmentId: 1
  },
  admin: {
    id: 3,
    username: 'admin',
    role: 'admin',
    firstName: 'Админ',
    lastName: 'Администраторов'
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [_, setLocation] = useLocation();

  // Check if user is already logged in from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    setIsLoading(true);
    
    try {
      // For the demo, directly use mock users based on username
      // In a real app, this would make an API call
      console.log('Attempting login with credentials:', { username, password });
      
      // Simple authentication for demo purposes
      if (username === 'student' || username === 'student1') {
        const userData = MOCK_USERS.student;
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setLocation('/student');
        return userData;
      } else if (username === 'teacher') {
        const userData = MOCK_USERS.teacher;
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setLocation('/teacher');
        return userData;
      } else if (username === 'admin') {
        const userData = MOCK_USERS.admin;
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setLocation('/admin');
        return userData;
      }
      
      throw new Error('Неверное имя пользователя или пароль');
    } catch (error) {
      console.error('Full login error:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    localStorage.removeItem('currentUser');
    setLocation('/login');
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
