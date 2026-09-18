import {
  AuthenticationError,
  DecodoError,
  RateLimitError,
  Target,
  TimeoutError,
} from '@decodo/sdk-ts';
import type { ResultEntry, ScrapeRequest } from '@decodo/sdk-ts';
import { defineCreate } from 'zapier-platform-core';
import type { ZObject, Bundle } from 'zapier-platform-core';
import { apiMessage, createDecodoClient, withZapierErrors } from '../client.js';
import {
  MAX_OUTPUT_BYTES,
  MAX_URLS_BATCH,
  REQUEST_TIMEOUT_MS,
  URL_CONCURRENCY,
} from '../constants.js';
import {
  DEVICE_TYPE_FIELD,
  GEO_FIELD,
  HEADLESS_FIELD,
  SCRAPE_MARKDOWN_FIELD,
  URLS_FIELD,
} from '../input-fields.js';

type InputData = {
  urls?: string[] | string;
  markdown?: boolean;
  headless?: string;
  geo?: string;
  device_type?: string;
};

type FailedUrl = {
  url: string;
  message: string;
};

type Output = {
  requested: number;
  scraped: number;
  failed: number;
  results: ResultEntry[];
  errors: FailedUrl[];
};

const URL_SEPARATOR = /\s+|,(?=https?:\/\/)/;

const normalizeUrls = (urls: string[] | string | undefined): string[] =>
  (Array.isArray(urls) ? urls : [urls ?? ''])
    .flatMap((entry) => String(entry).split(URL_SEPARATOR))
    .map((url) => url.replace(/^,+|,+$/g, ''))
    .filter((url) => url.length > 0);

const requestFor = (url: string, inputData: InputData): ScrapeRequest => {
  const { markdown, headless, geo, device_type } = inputData;

  return {
    target: Target.Universal,
    url,
    ...(markdown ? { markdown: true } : {}),
    ...(headless ? { headless } : {}),
    ...(geo ? { geo } : {}),
    ...(device_type ? { device_type } : {}),
  } as ScrapeRequest;
};

const abortWith = (z: ZObject, error: unknown): Promise<never> =>
  withZapierErrors(z, async () => {
    throw error;
  });

const failureMessage = (error: unknown): string => {
  if (error instanceof TimeoutError) {
    return `Decodo did not respond within ${REQUEST_TIMEOUT_MS / 1000} seconds.`;
  }

  if (error instanceof DecodoError) {
    return error.message;
  }

  const detail = error instanceof Error ? error.message : String(error);

  return `Could not reach Decodo for this URL (${detail}).`;
};

const mapWithLimit = async <T, R>(
  items: T[],
  limit: number,
  run: (item: T) => Promise<R>,
): Promise<R[]> => {
  const results: R[] = [];
  let next = 0;

  const worker = async (): Promise<void> => {
    for (let index = next++; index < items.length; index = next++) {
      const item = items[index];

      if (item !== undefined) {
        results[index] = await run(item);
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );

  return results;
};

const perform = async (
  z: ZObject,
  bundle: Bundle<InputData>,
): Promise<Output> => {
  const urls = normalizeUrls(bundle.inputData.urls);

  if (urls.length === 0) {
    throw new z.errors.Error('Add at least one URL to scrape.', 'NoUrls', 400);
  }

  if (urls.length > MAX_URLS_BATCH) {
    throw new z.errors.Error(
      `This action scrapes at most ${MAX_URLS_BATCH} URLs per run, and this list has ${urls.length} urls. Split the list across several runs.`,
      'TooManyUrls',
      400,
    );
  }

  const client = createDecodoClient(
    bundle.authData?.apiKey ?? '',
    REQUEST_TIMEOUT_MS,
  );

  const outcomes = await mapWithLimit(urls, URL_CONCURRENCY, async (url) => {
    try {
      return {
        url,
        response: await client.webScrapingApi.scrape(
          requestFor(url, bundle.inputData),
        ),
      };
    } catch (error) {
      return { url, error };
    }
  });

  const results: ResultEntry[] = [];
  const errors: FailedUrl[] = [];
  let fatal: unknown;
  let firstError: unknown;
  let bytes = 0;

  for (const outcome of outcomes) {
    if ('error' in outcome) {
      if (
        outcome.error instanceof AuthenticationError ||
        outcome.error instanceof RateLimitError
      ) {
        fatal ??= outcome.error;
      }

      firstError ??= outcome.error;

      errors.push({ url: outcome.url, message: failureMessage(outcome.error) });
      continue;
    }

    const result = outcome.response.results?.[0];

    if (!result) {
      errors.push({
        url: outcome.url,
        message:
          apiMessage(outcome.response) ??
          'Decodo returned no content for this URL.',
      });
      continue;
    }

    bytes += JSON.stringify(result).length;

    if (bytes > MAX_OUTPUT_BYTES) {
      errors.push({
        url: outcome.url,
        message:
          'Scraped, but left out: this run already holds as much content as Zapier can pass to the next step. Scrape fewer URLs per run.',
      });
      continue;
    }

    results.push(result);
  }

  if (results.length === 0) {
    const cause = fatal ?? firstError;

    if (cause !== undefined) {
      return abortWith(z, cause);
    }

    throw new z.errors.Error(
      'Decodo returned no content for any of these URLs.',
      'EmptyResult',
      200,
    );
  }

  return {
    requested: urls.length,
    scraped: results.length,
    failed: errors.length,
    results,
    errors,
  };
};

export default defineCreate({
  key: 'scrape_url_list',
  noun: 'Page List',

  display: {
    label: 'Scrape URL List',
    description:
      'Scrapes a list of URLs at the same time and returns the content of each.',
  },

  operation: {
    perform,

    inputFields: [
      URLS_FIELD,
      SCRAPE_MARKDOWN_FIELD,
      HEADLESS_FIELD,
      GEO_FIELD,
      DEVICE_TYPE_FIELD,
    ],

    sample: {
      requested: 2,
      scraped: 2,
      failed: 0,
      results: [
        {
          task_id: '7238940912345678901',
          url: 'https://example.com',
          status_code: 200,
          content: '# Example Domain',
          created_at: '2026-09-17 12:00:00',
          updated_at: '2026-09-17 12:00:04',
        },
        {
          task_id: '7238940912345678902',
          url: 'https://example.org',
          status_code: 200,
          content: '# Example Org',
          created_at: '2026-09-17 12:00:00',
          updated_at: '2026-09-17 12:00:05',
        },
      ],
      errors: [],
    },

    outputFields: [
      { key: 'requested', label: 'URLs Requested', type: 'integer' },
      { key: 'scraped', label: 'URLs Scraped', type: 'integer' },
      { key: 'failed', label: 'URLs Failed', type: 'integer' },
      { key: 'results[]content', label: 'Content' },
      { key: 'results[]url', label: 'URL' },
      { key: 'results[]status_code', label: 'Status Code', type: 'integer' },
      { key: 'results[]task_id', label: 'Task ID' },
      { key: 'errors[]url', label: 'Failed URL' },
      { key: 'errors[]message', label: 'Failure Reason' },
    ],
  },
});
