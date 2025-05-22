// client/src/types/auth.ts

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

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<User>;
}
