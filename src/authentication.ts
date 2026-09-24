import {
  AuthenticationError,
  DecodoError,
  RateLimitError,
  Target,
  TimeoutError,
} from '@decodo/sdk-ts';
import type { ScrapeRequest } from '@decodo/sdk-ts';
import type { ZObject, Bundle, Authentication } from 'zapier-platform-core';

import { createDecodoClient, withZapierErrors } from './client.js';
import { AUTH_PROBE_URL } from './constants.js';

const test = async (z: ZObject, bundle: Bundle): Promise<object> => {
  const apiKey = (bundle.authData?.apiKey ?? '').trim();
  const client = createDecodoClient(apiKey);

  await withZapierErrors(z, async () => {
    try {
      await client.webScrapingApi.scrape({
        target: Target.Universal,
        url: AUTH_PROBE_URL,
      } as ScrapeRequest);
    } catch (error) {
      if (
        error instanceof AuthenticationError ||
        error instanceof RateLimitError ||
        error instanceof TimeoutError ||
        !(error instanceof DecodoError)
      ) {
        throw error;
      }

      // The probe URL cannot be scraped, so any other API error still proves
      // Decodo accepted the key.
    }
  });

  return {};
};

export default {
  type: 'custom',
  fields: [
    {
      key: 'apiKey',
      label: 'API Key',
      type: 'password',
      required: true,
      helpText:
        'Find this in your [Decodo dashboard](https://dashboard.decodo.com) under your Web Scraping API subscription.',
    },
  ],
  test,
} satisfies Authentication;
