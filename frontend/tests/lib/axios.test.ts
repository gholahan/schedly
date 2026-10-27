import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { apiClient } from '@/lib/axios';
import { useUserStore } from '@/features/auth/user.store';
import { makeUser } from '../mocks/factories';

describe('apiClient interceptors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.getState().clearUser();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refreshes token on 401 and retries original request', async () => {
    let attempts = 0;
    let refreshCalled = false;

    server.use(
      http.get('http://localhost:8000/protected-resource', () => {
        attempts++;
        if (attempts === 1) {
          return new HttpResponse(null, { status: 401 });
        }
        return HttpResponse.json({ data: 'success' });
      }),
      http.post('http://localhost:8000/auth/refresh', () => {
        refreshCalled = true;
        return HttpResponse.json({ success: true });
      })
    );

    const response = await apiClient.get('/protected-resource');
    expect(response.data).toEqual({ data: 'success' });
    expect(refreshCalled).toBe(true);
    expect(attempts).toBe(2);
  });

  it('clears store and redirects to /login if refresh fails', async () => {
    useUserStore.getState().setUser(makeUser());

    vi.stubGlobal('location', { href: '', assign: vi.fn(), replace: vi.fn() });

    server.use(
      http.get('http://localhost:8000/protected-fail', () => {
        return new HttpResponse(null, { status: 401 });
      }),
      http.post('http://localhost:8000/auth/refresh', () => {
        return new HttpResponse(null, { status: 403 });
      })
    );

    await expect(apiClient.get('/protected-fail')).rejects.toThrow();
    expect(useUserStore.getState().user).toBeNull();
    expect(window.location.href).toBe('/login');
  });
});
