import '@testing-library/jest-dom/vitest';
import { server } from './mocks/server';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
  vi.unstubAllGlobals();
});

afterAll(() => {
  server.close();
});

// Mock scrollIntoView for jsdom
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock ResizeObserver for jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};


