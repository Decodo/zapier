import { describe, expect, it } from 'vitest';
import zapier from 'zapier-platform-core';
import App from '../index.js';

const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

const token = process.env.authData_token;
const describeIfToken = token ? describe : describe.skip;

describeIfToken('scrape_url', () => {
  it('scrapes a page through the SDK and returns the entry', async () => {
    const result = await appTester(App.creates.scrape_url.operation.perform, {
      authData: { token },
      inputData: { url: 'https://example.com', markdown: true },
    });

    expect(result.status_code).toBe(200);
    expect(result.content).toContain('Example Domain');
    expect(result.task_id).toBeTruthy();
  }, 60_000);

  it('surfaces a reconnect prompt when the token is rejected', async () => {
    await expect(
      appTester(App.creates.scrape_url.operation.perform, {
        authData: { token: 'definitely-not-a-valid-token' },
        inputData: { url: 'https://example.com' },
      }),
    ).rejects.toThrow(/rejected these credentials/);
  }, 60_000);
});
