// Shared types and constants for Master-Kids
export interface User {
  id: string;
  email: string;
  role: 'parent' | 'child' | 'tutor';
  name: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}