import { Target } from '@decodo/sdk-ts';
import type { PlainInputField } from 'zapier-platform-core';
import { MAX_URLS_BATCH } from './constants.js';

const MARKDOWN_FIELD: PlainInputField = {
  key: 'markdown',
  label: 'Return Markdown',
  type: 'boolean',
  required: false,
  helpText:
    'Return clean markdown instead of raw HTML. Best for feeding the result to an AI step.',
};

export const HEADLESS_FIELD: PlainInputField = {
  key: 'headless',
  label: 'Headless',
  type: 'string',
  required: false,
  choices: { html: 'HTML', png: 'Screenshot (PNG)' },
  helpText:
    "Load the page in a real browser first. `HTML` runs the page's JavaScript and returns the rendered markup. `Screenshot` returns a PNG image instead. Leave empty to fetch without a browser, which is faster.",
};

export const GEO_FIELD: PlainInputField = {
  key: 'geo',
  label: 'Location',
  type: 'string',
  required: false,
  helpText:
    'Request from a specific country or city, for example `United States`. Leave empty to let Decodo choose.',
};

export const DEVICE_TYPE_FIELD: PlainInputField = {
  key: 'device_type',
  label: 'Device Type',
  type: 'string',
  required: false,
  choices: { desktop: 'Desktop', mobile: 'Mobile' },
  helpText: 'Which device the request should look like it came from.',
};

export const SCRAPE_MARKDOWN_FIELD: PlainInputField = {
  ...MARKDOWN_FIELD,
  default: 'yes',
};

export const URLS_FIELD: PlainInputField = {
  key: 'urls',
  label: 'URLs',
  type: 'string',
  required: true,
  list: true,
  helpText: `The pages to scrape, up to ${MAX_URLS_BATCH} per run.`,
};

export const URL_FIELD: PlainInputField = {
  key: 'url',
  label: 'URL',
  type: 'string',
  required: true,
  helpText: 'The full address of the page to scrape.',
};

const TARGET_CHOICES = {
  [Target.GoogleSearch]: 'Google',
  [Target.AmazonSearch]: 'Amazon',
  [Target.RedditSubreddit]: 'Reddit',
};

const REDDIT_SORT_CHOICES = {
  hot: 'Hot',
  new: 'New',
  rising: 'Rising',
  top: 'Top',
};

export const SEARCH_TARGET_FIELD: PlainInputField = {
  key: 'target',
  label: 'Search On',
  type: 'string',
  required: true,
  default: Target.GoogleSearch,
  choices: TARGET_CHOICES,
  altersDynamicFields: true,
  helpText: 'Which site to search.',
};

export const GOOGLE_QUERY_FIELD: PlainInputField = {
  key: 'query',
  label: 'Search Query',
  type: 'string',
  required: true,
  helpText: 'What to search Google for.',
};

export const AMAZON_QUERY_FIELD: PlainInputField = {
  ...GOOGLE_QUERY_FIELD,
  helpText: 'What to search Amazon for, for example `running shoes`.',
};

export const PARSE_FIELD: PlainInputField = {
  key: 'parse',
  label: 'Return Structured Results',
  type: 'boolean',
  required: false,
  default: 'yes',
  helpText:
    'Return the results parsed into fields instead of raw page content. Best for mapping individual results into later steps.',
};

export const SEARCH_MARKDOWN_FIELD: PlainInputField = {
  ...MARKDOWN_FIELD,
  helpText: `${MARKDOWN_FIELD.helpText} Only applies when structured results are off.`,
};

export const SUBREDDIT_FIELD: PlainInputField = {
  key: 'subreddit',
  label: 'Subreddit',
  type: 'string',
  required: true,
  helpText: 'The subreddit name, for example `nba`.',
};

export const REDDIT_SORT_FIELD: PlainInputField = {
  key: 'reddit_sort',
  label: 'Sort',
  type: 'string',
  required: false,
  choices: REDDIT_SORT_CHOICES,
  helpText:
    'How to sort the subreddit posts. Leave empty for the default order.',
};

export const AMAZON_DOMAIN_FIELD: PlainInputField = {
  key: 'domain',
  label: 'Amazon Domain',
  type: 'string',
  required: false,
  helpText:
    'Which Amazon site to search, for example `co.uk` for amazon.co.uk. Defaults to `com`.',
};

export const GOOGLE_LOCALE_FIELD: PlainInputField = {
  key: 'locale',
  label: 'Locale',
  type: 'string',
  required: false,
  helpText: 'Interface language for the search, for example `en-GB`.',
};
