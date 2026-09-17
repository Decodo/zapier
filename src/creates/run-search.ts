import { Target } from '@decodo/sdk-ts';
import type { ResultEntry, ScrapeRequest } from '@decodo/sdk-ts';
import { defineCreate } from 'zapier-platform-core';
import type { ZObject, Bundle, PlainInputField } from 'zapier-platform-core';
import { createDecodoClient, withZapierErrors } from '../client.js';
import {
  AMAZON_DOMAIN_FIELD,
  AMAZON_QUERY_FIELD,
  GEO_FIELD,
  GOOGLE_LOCALE_FIELD,
  GOOGLE_QUERY_FIELD,
  PARSE_FIELD,
  REDDIT_SORT_FIELD,
  SEARCH_MARKDOWN_FIELD,
  SEARCH_TARGET_FIELD,
  SUBREDDIT_FIELD,
} from '../input-fields.js';

type InputData = {
  target?: string;
  query?: string;
  subreddit?: string;
  reddit_sort?: string;
  parse?: boolean;
  markdown?: boolean;
  geo?: string;
  locale?: string;
  domain?: string;
};

const subredditUrl = (subreddit: string, sort?: string): string => {
  const base = `https://www.reddit.com/r/${subreddit.trim().replace(/^r\//, '')}`;

  return sort ? `${base}/${sort}` : base;
};

const searchRequest = (inputData: InputData): ScrapeRequest => {
  const {
    target = Target.GoogleSearch,
    query,
    subreddit,
    reddit_sort,
    parse,
    markdown,
    geo,
    locale,
    domain,
  } = inputData;

  if (target === Target.RedditSubreddit) {
    return {
      target,
      url: subredditUrl(subreddit ?? '', reddit_sort),
      ...(geo ? { geo } : {}),
      ...(locale ? { locale } : {}),
    } as ScrapeRequest;
  }

  return {
    target,
    query,
    ...(parse ? { parse: true } : {}),
    ...(markdown ? { markdown: true } : {}),
    ...(geo ? { geo } : {}),
    ...(target === Target.GoogleSearch && locale ? { locale } : {}),
    ...(target === Target.AmazonSearch && domain ? { domain } : {}),
  } as ScrapeRequest;
};

const perform = async (
  z: ZObject,
  bundle: Bundle<InputData>,
): Promise<ResultEntry> => {
  const client = createDecodoClient(bundle.authData?.apiKey ?? '');

  const response = await withZapierErrors(z, () =>
    client.webScrapingApi.scrape(searchRequest(bundle.inputData)),
  );

  const result = response.results?.[0];

  if (!result) {
    throw new z.errors.Error(
      'Decodo returned no results for this search. Try a different query, or run it without parsing to see the raw page.',
      'EmptyResult',
      200,
    );
  }

  return result;
};

export default defineCreate({
  key: 'run_search',
  noun: 'Search',

  display: {
    label: 'Run Search',
    description:
      'Searches Google, Amazon, or a subreddit and returns the results as structured data, markdown, or HTML.',
  },

  operation: {
    perform,

    inputFields: [
      SEARCH_TARGET_FIELD,
      (_z: ZObject, bundle: Bundle<InputData>): PlainInputField[] => {
        if (bundle.inputData.target === Target.RedditSubreddit) {
          return [SUBREDDIT_FIELD, REDDIT_SORT_FIELD, GEO_FIELD];
        }

        const isAmazon = bundle.inputData.target === Target.AmazonSearch;

        return [
          isAmazon ? AMAZON_QUERY_FIELD : GOOGLE_QUERY_FIELD,
          PARSE_FIELD,
          SEARCH_MARKDOWN_FIELD,
          GEO_FIELD,
          isAmazon ? AMAZON_DOMAIN_FIELD : GOOGLE_LOCALE_FIELD,
        ];
      },
    ],

    sample: {
      task_id: '7238940912345678901',
      url: 'https://www.google.com/search?q=web+scraping',
      status_code: 200,
      content: '# Web Scraping\n\n1. https://example.com - Example Domain',
      created_at: '2026-09-17 12:00:00',
      updated_at: '2026-09-17 12:00:04',
    },

    outputFields: [
      { key: 'content', label: 'Content' },
      { key: 'url', label: 'URL' },
      { key: 'status_code', label: 'Status Code', type: 'integer' },
      { key: 'task_id', label: 'Task ID' },
      { key: 'created_at', label: 'Created At' },
      { key: 'updated_at', label: 'Updated At' },
    ],
  },
});
