/**
 * Authentication related TypeScript types
 *
 * Field names use camelCase in the frontend. The auth service maps
 * from the backend's snake_case responses when needed.
 */

// User roles – player and organizer are the primary frontend roles (admin omitted)
export type UserRole = 'player' | 'organizer';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;      // ISO date string
  updatedAt?: string;      // ISO date string
}

/** Helper to get a display name from a User */
export const getDisplayName = (user: User): string => {
  const full = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return full || user.username;
};

// ----------------------------------------------------------------------
// Login
// ----------------------------------------------------------------------
export interface LoginRequest {
  email: string;  // backend only supports email-based login
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ----------------------------------------------------------------------
// Registration
// ----------------------------------------------------------------------
export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  role: 'player' | 'organizer';   // frontend cannot register as admin
}

export interface RegisterResponse {
  user: User;
  message: string;
}

// ----------------------------------------------------------------------
// Email verification
// ----------------------------------------------------------------------
export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

// ----------------------------------------------------------------------
// Resend verification OTP
// ----------------------------------------------------------------------
export interface ResendVerificationRequest {
  email: string;
}

// ----------------------------------------------------------------------
// OTP types (if you ever use the generic OTP endpoints)
// ----------------------------------------------------------------------
export enum OTPType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  TWO_FACTOR = 'two_factor',
}

// ----------------------------------------------------------------------
// Availability checks (used during registration)
// ----------------------------------------------------------------------
export interface CheckEmailRequest {
  email: string;
}

export interface CheckEmailResponse {
  available: boolean;
  message?: string;
}

export interface CheckUsernameRequest {
  username: string;
}

export interface CheckUsernameResponse {
  available: boolean;
  message?: string;
}

// ----------------------------------------------------------------------
// Password management (optional – if you need them)
// ----------------------------------------------------------------------
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
