/**
 * Environment configuration
 */

// Simple test environment detection
export const isTestEnvironment = (): boolean => {
  try {
    return typeof process !== 'undefined' && process?.env?.NODE_ENV === 'test';
  } catch {
    return false;
  }
};

// API base URL configuration
export const API_BASE_URL = 'http://localhost:3001/api';
