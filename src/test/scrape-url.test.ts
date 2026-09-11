import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import zapier from 'zapier-platform-core';
import App from '../index.js';

const appTester = zapier.createAppTester(App);

const mockFetch = vi.fn();
const originalFetch = globalThis.fetch;

const authData = { token: 'dGVzdDp0ZXN0' };

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const perform = (inputData: Record<string, unknown>) =>
  appTester(App.creates.scrape_url.operation.perform, { authData, inputData });

beforeEach(() => {
  mockFetch.mockReset();
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('scrape_url', () => {
  it('sends the scrape request and returns the result entry', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        results: [
          { content: '# Example Domain', status_code: 200, task_id: '123' },
        ],
      }),
    );

    const result = await perform({
      url: 'https://example.com',
      markdown: true,
    });

    expect(result.content).toBe('# Example Domain');
    expect(result.task_id).toBe('123');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];

    expect(url).toBe('https://scraper-api.decodo.com/v2/scrape');
    expect(init.headers).toMatchObject({
      Authorization: `Basic ${authData.token}`,
      'x-integration': 'zapier',
    });
    expect(JSON.parse(init.body as string)).toEqual({
      target: 'universal',
      url: 'https://example.com',
      markdown: true,
    });
  });

  it('asks the user to reconnect when the token is rejected', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ message: 'Unauthorized' }, 401));

    await expect(perform({ url: 'https://example.com' })).rejects.toThrow(
      /rejected these credentials/,
    );
  });
});
