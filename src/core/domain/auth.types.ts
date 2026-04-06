export interface AuthResponse {
  token: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  email: string;
  householdMode: 'CREATE_NEW' | 'JOIN_EXISTING';
  householdName?: string;
  inviteToken?: string;
  allergenIds: string[];
  applianceTypes?: string[];
}
