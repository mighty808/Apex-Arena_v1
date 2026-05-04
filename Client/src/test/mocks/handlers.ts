import { http, HttpResponse } from 'msw';
import { AUTH_ENDPOINTS } from '../../config/api.config';

// ── Shared test fixtures ──────────────────────────────────────────────────────

// Shape matches what mapUser() in auth.service.ts can read (snake_case preferred)
export const TEST_USER = {
  user_id: 'user-123',
  email: 'player@test.com',
  username: 'testplayer',
  role: 'player' as const,
  is_email_verified: true,
};

export const TEST_TOKENS = {
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
};

export const TEST_ORGANIZER = {
  ...TEST_USER,
  user_id: 'organizer-456',
  email: 'organizer@test.com',
  username: 'testorganizer',
  role: 'organizer' as const,
};

// ── Default handlers (happy path) ────────────────────────────────────────────

export const handlers = [
  // GET /auth/me — valid token returns current user
  http.get(AUTH_ENDPOINTS.ME, () => {
    return HttpResponse.json({
      success: true,
      data: { user: TEST_USER },
    });
  }),

  // POST /auth/token/refresh — flat tokens (auth.service reads data.access_token)
  http.post(AUTH_ENDPOINTS.TOKEN_REFRESH, () => {
    return HttpResponse.json({
      success: true,
      data: {
        access_token: 'refreshed-access-token',
        refresh_token: 'refreshed-refresh-token',
        user: TEST_USER,
      },
    });
  }),

  // POST /auth/token/validate — alias used by auth-context bootstrap
  http.post(AUTH_ENDPOINTS.TOKEN_VALIDATE, () => {
    return HttpResponse.json({
      success: true,
      data: { user: TEST_USER },
    });
  }),

  // POST /auth/login — tokens must be flat (auth.service reads data.access_token)
  http.post(AUTH_ENDPOINTS.LOGIN, () => {
    return HttpResponse.json({
      success: true,
      data: {
        access_token: TEST_TOKENS.accessToken,
        refresh_token: TEST_TOKENS.refreshToken,
        user: TEST_USER,
      },
    });
  }),

  // POST /auth/logout
  http.post(AUTH_ENDPOINTS.LOGOUT, () => {
    return HttpResponse.json({ success: true });
  }),
];
