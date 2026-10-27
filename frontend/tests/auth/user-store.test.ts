import { describe, it, expect, beforeEach } from 'vitest';
import { useUserStore } from '@/features/auth/user.store';
import { makeUser } from '../mocks/factories';

describe('userStore', () => {
  beforeEach(() => {
    useUserStore.getState().clearUser();
    localStorage.clear();
  });

  it('initial state is null user', () => {
    const { user } = useUserStore.getState();
    expect(user).toBeNull();
  });

  it('setUser updates the user', () => {
    const mockUser = makeUser();
    useUserStore.getState().setUser(mockUser);
    expect(useUserStore.getState().user).toEqual(mockUser);
  });

  it('clearUser resets user to null', () => {
    const mockUser = makeUser();
    useUserStore.getState().setUser(mockUser);
    expect(useUserStore.getState().user).toEqual(mockUser);

    useUserStore.getState().clearUser();
    expect(useUserStore.getState().user).toBeNull();
  });

  it('persists to localStorage under schedly-user-storage', () => {
    const mockUser = makeUser({ name: 'Persistent User' });
    useUserStore.getState().setUser(mockUser);

    const stored = localStorage.getItem('schedly-user-storage');
    expect(stored).toBeDefined();
    expect(stored).toContain('Persistent User');
  });
});
