import type {
  BeforeRequestMiddleware,
  AfterResponseMiddleware,
  HttpResponse,
} from 'zapier-platform-core';
import { INTEGRATION_NAME, RETRY_AFTER_SECONDS } from './constants.js';
import type { ErrorResponse } from './types.js';

const includeAuthHeader: BeforeRequestMiddleware = (request, _z, bundle) => {
  const apiKey = bundle.authData?.apiKey?.trim();

  if (!apiKey) {
    return request;
  }

  request.headers = {
    ...request.headers,
    Authorization: `Bearer ${apiKey}`,
    'x-integration': INTEGRATION_NAME,
  };

  return request;
};

const handleAuthErrors: AfterResponseMiddleware = (response, z, _bundle) => {
  if (response.status === 401 || response.status === 403) {
    throw new z.errors.ExpiredAuthError(
      'Decodo rejected this API key. Check that the key is correct, then reconnect.',
    );
  }

  return response;
};

const apiMessage = (response: HttpResponse): string | undefined => {
  const body = response.data as ErrorResponse | undefined;
  return typeof body?.message === 'string' && body.message.length > 0
    ? body.message
    : undefined;
};

const retryAfterSeconds = (response: HttpResponse): number => {
  const header = Number(response.getHeader('retry-after'));
  return Number.isFinite(header) && header > 0 ? header : RETRY_AFTER_SECONDS;
};

const handleApiErrors: AfterResponseMiddleware = (response, z, _bundle) => {
  if (response.status < 400) {
    return response;
  }

  const message = apiMessage(response);

  if (response.status === 429) {
    throw new z.errors.ThrottledError(
      message ??
        'Decodo is rate limiting this account. Zapier will retry shortly.',
      retryAfterSeconds(response),
    );
  }

  if (response.status >= 500) {
    throw new z.errors.Error(
      message ?? 'Decodo had a problem handling this request. Try again.',
      'DecodoServerError',
      response.status,
    );
  }

  throw new z.errors.Error(
    message ?? 'Decodo rejected this request.',
    'DecodoRequestError',
    response.status,
  );
};

export const befores = [includeAuthHeader];

export const afters = [handleAuthErrors, handleApiErrors];
