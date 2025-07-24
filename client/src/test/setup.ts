import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';

// Basic test setup
const mockServer = {
  listen: () => {},
  resetHandlers: () => {},
  close: () => {},
};

export const server = mockServer;

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());