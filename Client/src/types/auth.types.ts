/**
 * Authentication related TypeScript types
 */

// User roles – player and organizer are the primary frontend roles (admin omitted)
export type UserRole = 'player' | 'organizer';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  profilePicture?: string;
  createdAt: string;      // ISO date string
  updatedAt: string;      // ISO date string
}

// ----------------------------------------------------------------------
// Login
// ----------------------------------------------------------------------
export interface LoginRequest {
  email: string;
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