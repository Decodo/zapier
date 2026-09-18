import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import zapier from 'zapier-platform-core';
import App from '../index.js';
import { AUTH_PROBE_URL } from '../constants.js';

const appTester = zapier.createAppTester(App);

const mockFetch = vi.fn();
const originalFetch = globalThis.fetch;

const authData = {
  apiKey: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const test = (apiKey: string = authData.apiKey) =>
  appTester(App.authentication.test, { authData: { apiKey } });

beforeEach(() => {
  mockFetch.mockReset();
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('custom auth', () => {
  it('probes the api with the key', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ results: [] }));

    await expect(test()).resolves.toEqual({ key_hint: 'cdef' });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];

    expect(init.headers).toMatchObject({
      Authorization: `Bearer ${authData.apiKey}`,
      'x-integration': 'zapier',
    });
    expect(JSON.parse(init.body as string).url).toBe(AUTH_PROBE_URL);
  });

  it('accepts the key even though the probe url cannot be scraped', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ message: 'Could not resolve host' }, 500),
    );

    await expect(test()).resolves.toEqual({ key_hint: 'cdef' });
  });

  it('trims a pasted key', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ results: [] }));

    await expect(test(`  ${authData.apiKey}  `)).resolves.toEqual({
      key_hint: 'cdef',
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];

    expect(init.headers).toMatchObject({
      Authorization: `Bearer ${authData.apiKey}`,
    });
  });

  it('labels the connection with the last four characters only', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ results: [] }));

    const { key_hint } = (await test()) as { key_hint: string };

    expect(key_hint).toHaveLength(4);
    expect(authData.apiKey.endsWith(key_hint)).toBe(true);
    expect(App.authentication.connectionLabel).toBe(
      'API key \u2026{{bundle.inputData.key_hint}}',
    );
  });

  it('asks the user to reconnect when the key is rejected', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ message: 'Unauthorized' }, 401));

    await expect(test()).rejects.toThrow(/rejected this API key/);
  });
});
