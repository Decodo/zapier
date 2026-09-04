import type {
  BeforeRequestMiddleware,
  AfterResponseMiddleware,
  HttpResponse,
} from 'zapier-platform-core';
import { INTEGRATION_NAME } from './constants.js';
import type { ErrorResponse } from './types.js';

const DEFAULT_RETRY_AFTER_SECONDS = 1;

const includeAuthHeader: BeforeRequestMiddleware = (request, _z, bundle) => {
  const token = bundle.authData?.token;

  if (!token) {
    return request;
  }

  request.headers = {
    ...request.headers,
    Authorization: `Bearer ${token}`,
    'x-integration': INTEGRATION_NAME,
  };

  return request;
};

const handleAuthErrors: AfterResponseMiddleware = (response, z, _bundle) => {
  if (response.status === 401 || response.status === 403) {
    throw new z.errors.ExpiredAuthError(
      'Decodo rejected these credentials. Check your API token in the Decodo ' +
        'dashboard, then reconnect this account.',
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
  return Number.isFinite(header) && header > 0
    ? header
    : DEFAULT_RETRY_AFTER_SECONDS;
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
