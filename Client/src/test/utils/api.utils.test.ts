import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { apiGet, apiPost, clearApiCache } from '../../utils/api.utils';

const TEST_URL = 'https://api-apexarenas.onrender.com/api/v1/auth/token/refresh';
const MOCK_URL = 'https://api-apexarenas.onrender.com/api/v1/test-endpoint';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Mock localStorage for auth tokens
vi.mock('../../utils/auth.utils', () => ({
  getAccessToken: vi.fn(() => 'stored-access-token'),
  getRefreshToken: vi.fn(() => 'stored-refresh-token'),
  saveTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

beforeEach(() => {
  clearApiCache();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('apiFetch — success path', () => {
  it('returns parsed JSON on a successful response', async () => {
    server.use(
      http.get(MOCK_URL, () =>
        HttpResponse.json({ success: true, data: { value: 42 } }),
      ),
    );

    const result = await apiGet(MOCK_URL);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ value: 42 });
  });

  it('attaches Authorization header with stored access token', async () => {
    let capturedAuth: string | null = null;

    server.use(
      http.get(MOCK_URL, ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ success: true, data: {} });
      }),
    );

    await apiGet(MOCK_URL);

    expect(capturedAuth).toBe('Bearer stored-access-token');
  });

  it('skips Authorization header when skipAuth is true', async () => {
    let capturedAuth: string | null = null;

    server.use(
      http.get(MOCK_URL, ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ success: true, data: {} });
      }),
    );

    await apiGet(MOCK_URL, { skipAuth: true });

    expect(capturedAuth).toBeNull();
  });
});

describe('apiFetch — idempotency keys', () => {
  it('adds X-Idempotency-Key on POST', async () => {
    let capturedKey: string | null = null;

    server.use(
      http.post(MOCK_URL, ({ request }) => {
        capturedKey = request.headers.get('X-Idempotency-Key');
        return HttpResponse.json({ success: true, data: {} });
      }),
    );

    await apiPost(MOCK_URL, { foo: 'bar' });

    expect(capturedKey).toBeTruthy();
    expect(typeof capturedKey).toBe('string');
  });

  it('does NOT add X-Idempotency-Key when skipIdempotency is true', async () => {
    let capturedKey: string | null = null;

    server.use(
      http.post(MOCK_URL, ({ request }) => {
        capturedKey = request.headers.get('X-Idempotency-Key');
        return HttpResponse.json({ success: true, data: {} });
      }),
    );

    await apiPost(MOCK_URL, {}, { skipIdempotency: true });

    expect(capturedKey).toBeNull();
  });
});

describe('apiFetch — GET caching', () => {
  it('returns the same promise for duplicate GET calls within TTL', async () => {
    let callCount = 0;

    server.use(
      http.get(MOCK_URL, () => {
        callCount++;
        return HttpResponse.json({ success: true, data: { callCount } });
      }),
    );

    const [r1, r2] = await Promise.all([apiGet(MOCK_URL), apiGet(MOCK_URL)]);

    // Both should have the same data — only one network call was made
    expect(callCount).toBe(1);
    expect(r1).toEqual(r2);
  });

  it('bypasses cache when skipCache is true', async () => {
    let callCount = 0;

    server.use(
      http.get(MOCK_URL, () => {
        callCount++;
        return HttpResponse.json({ success: true, data: { callCount } });
      }),
    );

    await apiGet(MOCK_URL, { skipCache: true });
    await apiGet(MOCK_URL, { skipCache: true });

    expect(callCount).toBe(2);
  });
});

describe('apiFetch — 401 retry', () => {
  it('retries once with refreshed token on 401 and returns data', async () => {
    let callCount = 0;

    server.use(
      // Token refresh returns new token
      http.post(TEST_URL, () =>
        HttpResponse.json({
          success: true,
          data: { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' },
        }),
      ),
      http.get(MOCK_URL, () => {
        callCount++;
        // First call → 401, second call → success
        if (callCount === 1) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json({ success: true, data: { ok: true } });
      }),
    );

    const result = await apiGet(MOCK_URL);

    expect(callCount).toBe(2);
    expect(result.success).toBe(true);
  });

  it('returns AUTHENTICATION_FAILED when refresh also fails', async () => {
    server.use(
      http.post(TEST_URL, () => new HttpResponse(null, { status: 401 })),
      http.get(MOCK_URL, () => new HttpResponse(null, { status: 401 })),
    );

    const result = await apiGet(MOCK_URL);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('AUTHENTICATION_FAILED');
  });
});

describe('apiFetch — error handling', () => {
  it('returns INVALID_RESPONSE when server returns non-JSON', async () => {
    server.use(
      http.get(MOCK_URL, () =>
        new HttpResponse('<html>Error</html>', {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );

    const result = await apiGet(MOCK_URL);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('INVALID_RESPONSE');
  });

  it('normalises backend error_code / message to the standard error shape', async () => {
    server.use(
      http.get(MOCK_URL, () =>
        HttpResponse.json({
          success: false,
          error_code: 'TOURNAMENT_NOT_FOUND',
          message: 'Tournament does not exist',
        }),
      ),
    );

    const result = await apiGet(MOCK_URL);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('TOURNAMENT_NOT_FOUND');
      expect(result.error.message).toBe('Tournament does not exist');
    }
  });
});
