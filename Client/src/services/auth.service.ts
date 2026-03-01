import { apiPost, apiGet } from '../utils/api.utils';
import { AUTH_ENDPOINTS } from '../config/api.config';
import { logout as clearAuthTokens, getRefreshToken } from '../utils/auth.utils';
import type { ApiResponse } from '../config/api.config';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendVerificationRequest,
  CheckEmailResponse,
  CheckUsernameResponse,
  User,
} from '../types/auth.types';

// ----------------------------------------------------------------------
// Authentication
// ----------------------------------------------------------------------

/**
 * Login with email and password
 */
export const login = async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  console.log('[AuthService] Logging in user:', credentials.email);
  return await apiPost<LoginResponse>(
    AUTH_ENDPOINTS.LOGIN,
    credentials,
    { skipAuth: true }
  );
};

/**
 * Register a new user (player or organizer)
 */
export const register = async (userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> => {
  console.log('[AuthService] Registering user:', userData.email);
  return await apiPost<RegisterResponse>(
    AUTH_ENDPOINTS.REGISTER,
    userData,
    { skipAuth: true }
  );
};

/**
 * Verify email with OTP
 */
export const verifyEmail = async (data: VerifyEmailRequest): Promise<ApiResponse<VerifyEmailResponse>> => {
  console.log('[AuthService] Verifying email:', data.email);
  return await apiPost<VerifyEmailResponse>(
    AUTH_ENDPOINTS.VERIFY_EMAIL,
    data,
    { skipAuth: true }
  );
};

/**
 * Resend email verification OTP
 */
export const resendVerification = async (data: ResendVerificationRequest): Promise<ApiResponse<any>> => {
  console.log('[AuthService] Resending verification OTP to:', data.email);
  return await apiPost(
    AUTH_ENDPOINTS.RESEND_VERIFICATION,
    data,
    { skipAuth: true }
  );
};

/**
 * Logout current user
 * - Calls the logout endpoint to invalidate refresh token on server
 * - Clears local tokens regardless of server response
 */
export const logout = async (): Promise<ApiResponse<any>> => {
  console.log('[AuthService] Logging out user');

  const refreshToken = getRefreshToken(); // imported from auth.utils

  try {
    // Attempt to call logout endpoint
    const response = await fetch(AUTH_ENDPOINTS.LOGOUT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    try {
      const data = await response.json();
      console.log('[AuthService] Logout API response:', data);
    } catch {
      console.warn('[AuthService] Could not parse logout response (not critical)');
    }
  } catch (error) {
    console.warn('[AuthService] Logout API call failed (not critical):', error);
  }

  // Always clear local auth
  clearAuthTokens();

  return {
    success: true,
    data: {},
    message: 'Logged out successfully',
  };
};

/**
 * Get current authenticated user's profile
 */
export const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  console.log('[AuthService] Fetching current user');
  return await apiGet<User>(AUTH_ENDPOINTS.ME);
};

// ----------------------------------------------------------------------
// Helpers for registration forms
// ----------------------------------------------------------------------

/**
 * Check if email is available for registration
 */
export const checkEmailAvailability = async (email: string): Promise<ApiResponse<CheckEmailResponse>> => {
  console.log('[AuthService] Checking email availability:', email);
  const url = `${AUTH_ENDPOINTS.CHECK_EMAIL}?email=${encodeURIComponent(email)}`;
  return await apiGet<CheckEmailResponse>(url, { skipAuth: true });
};

/**
 * Check if username is available for registration
 */
export const checkUsernameAvailability = async (username: string): Promise<ApiResponse<CheckUsernameResponse>> => {
  console.log('[AuthService] Checking username availability:', username);
  const url = `${AUTH_ENDPOINTS.CHECK_USERNAME}?username=${encodeURIComponent(username)}`;
  return await apiGet<CheckUsernameResponse>(url, { skipAuth: true });
};

// ----------------------------------------------------------------------
// Password management
// ----------------------------------------------------------------------

/**
 * Request password reset (send OTP)
 */
export const requestPasswordReset = async (email: string): Promise<ApiResponse<any>> => {
  console.log('[AuthService] Requesting password reset for:', email);
  return await apiPost(
    AUTH_ENDPOINTS.PASSWORD_RESET,
    { email },
    { skipAuth: true }
  );
};

/**
 * Confirm password reset with OTP and new password
 */
export const confirmPasswordReset = async (email: string, otp: string, newPassword: string): Promise<ApiResponse<any>> => {
  console.log('[AuthService] Confirming password reset');
  return await apiPost(
    AUTH_ENDPOINTS.PASSWORD_RESET_CONFIRM,
    { email, otp, newPassword },
    { skipAuth: true }
  );
};

/**
 * Change password (requires authentication)
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<ApiResponse<any>> => {
  console.log('[AuthService] Changing password');
  return await apiPost(
    AUTH_ENDPOINTS.PASSWORD_CHANGE,
    { currentPassword, newPassword }
  );
};