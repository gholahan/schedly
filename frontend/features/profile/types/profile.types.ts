export interface ProfileResponse {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateRequest {
  name?: string;
  email?: string;
  avatar_url?: string | null;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface DeleteAccountRequest {
  password: string;
}
