import type { ZObject } from 'zapier-platform-core';
import { BASE_URL } from './constants.js';

type RequestOptions = {
  path: string;
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
};

export const apiRequest = async <T>(
  z: ZObject,
  { path, method = 'POST', body }: RequestOptions,
): Promise<T> => {
  const response = await z.request({
    url: `${BASE_URL}${path}`,
    method,
    body,
  });

  return response.data as T;
};
