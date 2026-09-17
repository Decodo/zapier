import { Target } from '@decodo/sdk-ts';
import type { ResultEntry, ScrapeRequest } from '@decodo/sdk-ts';
import { defineCreate } from 'zapier-platform-core';
import type { ZObject, Bundle, PlainInputField } from 'zapier-platform-core';
import { createDecodoClient, withZapierErrors } from '../client.js';

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

const TARGET_CHOICES = {
  [Target.GoogleSearch]: 'Google',
  [Target.AmazonSearch]: 'Amazon',
  [Target.RedditSubreddit]: 'Reddit',
};

const REDDIT_SORT_CHOICES = {
  best: 'Best',
  hot: 'Hot',
  new: 'New',
  rising: 'Rising',
  top: 'Top',
};

const subredditUrl = (subreddit: string, sort?: string): string => {
  const base = `https://www.reddit.com/r/${subreddit.trim().replace(/^r\//, '')}`;

  return sort ? `${base}/${sort}` : base;
};

const AMAZON_DOMAIN_FIELD: PlainInputField = {
  key: 'domain',
  label: 'Amazon Domain',
  type: 'string',
  required: false,
  helpText:
    'Which Amazon site to search, for example `co.uk` for amazon.co.uk. Defaults to `com`.',
};

const GOOGLE_LOCALE_FIELD: PlainInputField = {
  key: 'locale',
  label: 'Locale',
  type: 'string',
  required: false,
  helpText: 'Interface language for the search, for example `en-GB`.',
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
      {
        key: 'target',
        label: 'Search On',
        type: 'string',
        required: true,
        default: Target.GoogleSearch,
        choices: TARGET_CHOICES,
        altersDynamicFields: true,
        helpText: 'Which site to search.',
      },
      (_z: ZObject, bundle: Bundle<InputData>): PlainInputField[] => {
        if (bundle.inputData.target === Target.RedditSubreddit) {
          return [
            {
              key: 'subreddit',
              label: 'Subreddit',
              type: 'string',
              required: true,
              helpText: 'The subreddit name, for example `nba`.',
            },
            {
              key: 'reddit_sort',
              label: 'Sort',
              type: 'string',
              required: false,
              choices: REDDIT_SORT_CHOICES,
              helpText:
                'How to sort the subreddit posts. Leave empty for the default order.',
            },
            {
              key: 'geo',
              label: 'Location',
              type: 'string',
              required: false,
              helpText:
                'Search from a specific country or city, for example `United States`. Leave empty to let Decodo choose.',
            },
          ];
        }

        const isAmazon = bundle.inputData.target === Target.AmazonSearch;

        return [
          {
            key: 'query',
            label: 'Search Query',
            type: 'string',
            required: true,
            helpText: isAmazon
              ? 'What to search Amazon for, for example `running shoes`.'
              : 'What to search Google for.',
          },
          {
            key: 'parse',
            label: 'Return Structured Results',
            type: 'boolean',
            required: false,
            default: 'yes',
            helpText:
              'Return the results parsed into fields instead of raw page content. Best for mapping individual results into later steps.',
          },
          {
            key: 'markdown',
            label: 'Return Markdown',
            type: 'boolean',
            required: false,
            helpText:
              'Return clean markdown instead of raw HTML. Only applies when structured results are off.',
          },
          {
            key: 'geo',
            label: 'Location',
            type: 'string',
            required: false,
            helpText:
              'Search from a specific country or city, for example `United States`. Leave empty to let Decodo choose.',
          },
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
