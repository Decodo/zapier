import {
  AuthenticationError,
  DecodoError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from '@decodo/sdk-ts';
import { describe, expect, it } from 'vitest';
import zapier from 'zapier-platform-core';
import { withZapierErrors } from '../client.js';

const z = { errors: zapier.errors } as never;

const throwing = (error: unknown) => () =>
  withZapierErrors(z, () => Promise.reject(error));

describe('withZapierErrors', () => {
  it('passes a successful result straight through', async () => {
    await expect(withZapierErrors(z, async () => 'ok')).resolves.toBe('ok');
  });

  it('maps an auth failure to ExpiredAuthError so Zapier prompts a reconnect', async () => {
    await expect(throwing(new AuthenticationError('nope'))()).rejects.toThrow(
      /rejected these credentials/,
    );

    await expect(
      throwing(new AuthenticationError('nope'))(),
    ).rejects.toBeInstanceOf(zapier.errors.ExpiredAuthError);
  });

  it('maps a rate limit to ThrottledError so Zapier schedules a retry', async () => {
    await expect(
      throwing(new RateLimitError('slow down'))(),
    ).rejects.toBeInstanceOf(zapier.errors.ThrottledError);
  });

  it('maps a validation failure to a 400', async () => {
    await expect(
      throwing(new ValidationError('bad geo', []))(),
    ).rejects.toThrow(/bad geo/);
  });

  it('maps a timeout to a readable message', async () => {
    await expect(throwing(new TimeoutError('timed out'))()).rejects.toThrow(
      /took too long to respond/,
    );
  });

  it('keeps the upstream message on a server error', async () => {
    await expect(
      throwing(new DecodoError('upstream exploded', 503))(),
    ).rejects.toThrow(/upstream exploded/);
  });

  it('keeps the upstream message on a client error', async () => {
    await expect(
      throwing(new DecodoError('unknown target', 400))(),
    ).rejects.toThrow(/unknown target/);
  });

  it('rethrows anything that is not an SDK error untouched', async () => {
    const boom = new Error('boom');

    await expect(throwing(boom)()).rejects.toBe(boom);
  });
});
