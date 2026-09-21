import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import zapier from 'zapier-platform-core';
import App from '../index.js';

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

    expect(url).toBe('https://data.decodo.com/v1/scrape');
    expect(init.headers).toMatchObject({
      Authorization: `Bearer ${authData.apiKey}`,
      'x-integration': 'zapier',
    });
    expect(JSON.parse(init.body as string)).toEqual({
      target: 'universal',
      url: 'https://example.com',
      markdown: true,
    });
  });

  it('passes on the reason when decodo could not scrape the page', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        status: 'failed',
        status_code: 613,
        message: 'We were not able to scrape the target.',
        task_id: '123',
      }),
    );

    await expect(perform({ url: 'https://example.com' })).rejects.toThrow(
      /We were not able to scrape the target/,
    );
  });

  it('asks the user to reconnect when the api key is rejected', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ message: 'Unauthorized' }, 401));

    await expect(perform({ url: 'https://example.com' })).rejects.toThrow(
      /rejected this API key/,
    );
  });
});
