import {
  AuthenticationError,
  DecodoClient,
  DecodoError,
  RateLimitError,
  TimeoutError,
  ValidationError,
} from '@decodo/sdk-ts';
import type { ZObject } from 'zapier-platform-core';
import { INTEGRATION_NAME, RETRY_AFTER_SECONDS } from './constants.js';

export const createDecodoClient = (apiKey: string): DecodoClient =>
  new DecodoClient({
    webScrapingApi: {
      apiKey: apiKey.trim(),
      integrationHeader: INTEGRATION_NAME,
    },
  });

export const withZapierErrors = async <T>(
  z: ZObject,
  run: () => Promise<T>,
): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw new z.errors.ExpiredAuthError(
        'Decodo rejected this API key. Check that the key is correct and your Decodo account is active, then reconnect this account.',
      );
    }

    if (error instanceof RateLimitError) {
      throw new z.errors.ThrottledError(
        error.message ||
          'Decodo is rate limiting this account. Zapier will retry shortly.',
        RETRY_AFTER_SECONDS,
      );
    }

    if (error instanceof ValidationError) {
      throw new z.errors.Error(
        error.message || 'Decodo rejected these options.',
        'DecodoValidationError',
        400,
      );
    }

    if (error instanceof TimeoutError) {
      throw new z.errors.Error(
        'Decodo took too long to respond. Try again, or scrape without a browser to speed it up.',
        'DecodoTimeout',
        504,
      );
    }

    if (error instanceof DecodoError) {
      const status = error.statusCode ?? 500;

      throw new z.errors.Error(
        error.message ||
          (status >= 500
            ? 'Decodo had a problem handling this request. Try again.'
            : 'Decodo rejected this request.'),
        status >= 500 ? 'DecodoServerError' : 'DecodoRequestError',
        status,
      );
    }

    throw error;
  }
};
