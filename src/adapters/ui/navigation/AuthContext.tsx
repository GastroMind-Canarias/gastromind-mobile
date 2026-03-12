import { createContext } from 'react';

interface AuthContextType {
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  login: () => {},
  logout: () => {},
});