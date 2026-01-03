/**
 * Jest setup file for test environment configuration
 */

// Add global polyfills for Node.js environment
import { TextEncoder, TextDecoder } from 'util';

// Make TextEncoder/TextDecoder available globally
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock localStorage for Node.js environment
const localStorageMock = {
  getItem: jest.fn((key: string) => {
    return localStorageMock.store[key] || null;
  }),
  setItem: jest.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: jest.fn(() => {
    localStorageMock.store = {};
  }),
  store: {} as Record<string, string>,
};

global.localStorage = localStorageMock as any;

// Mock fetch for tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: [] }),
  })
) as jest.Mock;
