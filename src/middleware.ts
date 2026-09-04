import type {
  BeforeRequestMiddleware,
  AfterResponseMiddleware,
} from 'zapier-platform-core';

import { INTEGRATION_NAME } from './constants.js';

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

export const befores = [includeAuthHeader];

export const afters = [handleAuthErrors];
