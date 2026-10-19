export interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  credits: number;
  has_google_calendar: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  token_type: string;
}

export interface SignupResponse {
  user: User;
  access_token: string;
  token_type: string;
}

export interface RefreshResponse {
  access_token: string;
  token_type: string;
}

export interface LogoutResponse {
  message: string;
}
