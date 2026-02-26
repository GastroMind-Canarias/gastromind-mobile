export interface AuthResponse {
  token: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  email: string;
  role: 'ROLE_MEMBER' | 'ROLE_ADMIN' | 'ROLE_OWNER' | 'ROLE_PREMIUM_MEMBER';
}