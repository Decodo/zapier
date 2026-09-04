import { describe, expect, it } from 'vitest';
import zapier from 'zapier-platform-core';
import App from '../index.js';

const appTester = zapier.createAppTester(App);
zapier.tools.env.inject();

const token = process.env.authData_token;
const describeIfToken = token ? describe : describe.skip;

describeIfToken('custom auth', () => {
  it('accepts a valid token and returns the account', async () => {
    const account = await appTester(App.authentication.test, {
      authData: { token },
    });

    expect(account.username).toBeTruthy();
    expect(account.active).not.toBe(false);
  });

  it('rejects an invalid token', async () => {
    await expect(
      appTester(App.authentication.test, {
        authData: { token: 'definitely-not-a-valid-token' },
      }),
    ).rejects.toThrow(/rejected these credentials/);
  });
});
