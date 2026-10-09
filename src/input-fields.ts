import { Target } from '@decodo/sdk-ts';
import type { PlainInputField } from 'zapier-platform-core';
import { MAX_URLS_BATCH } from './constants.js';

export const isOn = (value: unknown, whenUnset: boolean): boolean =>
  value === undefined || value === null || value === ''
    ? whenUnset
    : value !== false && value !== 'no' && value !== 'false';

const MARKDOWN_FIELD: PlainInputField = {
  key: 'markdown',
  label: 'Return markdown',
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
  default: 'html',
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
  label: 'Device type',
  type: 'string',
  required: false,
  choices: { desktop: 'Desktop', mobile: 'Mobile' },
  helpText: 'Which device the request should look like it came from.',
};

export const SCRAPE_MARKDOWN_FIELD: PlainInputField = {
  ...MARKDOWN_FIELD,
  default: 'yes',
  altersDynamicFields: true,
};

export const URLS_FIELD: PlainInputField = {
  key: 'urls',
  label: 'URLs',
  type: 'string',
  required: true,
  list: true,
  helpText: `The pages to fetch, up to ${MAX_URLS_BATCH} per run. Add one full URL per row, or map a comma-separated list of full URLs from an earlier step.`,
};

export const URL_FIELD: PlainInputField = {
  key: 'url',
  label: 'URL',
  type: 'string',
  required: true,
  helpText: 'The full address of the page to fetch.',
};

const TARGET_CHOICES = {
  [Target.GoogleSearch]: 'Search SERP',
  [Target.AmazonSearch]: 'Search E-Commerce',
};

export const SEARCH_TARGET_FIELD: PlainInputField = {
  key: 'target',
  label: 'Search Type',
  type: 'string',
  required: true,
  default: Target.GoogleSearch,
  choices: TARGET_CHOICES,
  altersDynamicFields: true,
  helpText: 'The kind of search to run.',
};

export const SERP_QUERY_FIELD: PlainInputField = {
  key: 'query',
  label: 'Search query',
  type: 'string',
  required: true,
  helpText: 'What to search for.',
};

export const ECOMMERCE_QUERY_FIELD: PlainInputField = {
  ...SERP_QUERY_FIELD,
  helpText: 'What to search for, for example `running shoes`.',
};

export const PARSE_FIELD: PlainInputField = {
  key: 'parse',
  label: 'Return parsed results',
  type: 'boolean',
  required: false,
  default: 'yes',
  altersDynamicFields: true,
  helpText:
    'Return the results parsed into fields instead of raw page content. Best for mapping individual results into later steps.',
};

export const SEARCH_MARKDOWN_FIELD: PlainInputField = {
  ...MARKDOWN_FIELD,
  default: 'no',
  altersDynamicFields: true,
};

export const SEARCH_HEADLESS_FIELD: PlainInputField = {
  ...HEADLESS_FIELD,
  default: undefined,
};

export const HEADLESS_RENDER_ONLY_FIELD: PlainInputField = {
  ...HEADLESS_FIELD,
  choices: { html: 'HTML' },
  helpText:
    "Load the page in a real browser first, which runs the page's JavaScript before reading it. Leave empty to fetch without a browser, which is faster. Turn markdown and parsed results off to capture a screenshot instead.",
};

export const ECOMMERCE_DOMAIN_FIELD: PlainInputField = {
  key: 'domain',
  label: 'Domain',
  type: 'string',
  required: false,
  helpText:
    'Which regional site to search, for example `co.uk`. Defaults to `com`.',
};

export const SERP_LOCALE_FIELD: PlainInputField = {
  key: 'locale',
  label: 'Locale',
  type: 'string',
  required: false,
  helpText: 'Interface language for the search, for example `en-GB`.',
};

export const SEARCH_HEADLESS_RENDER_ONLY_FIELD: PlainInputField = {
  ...HEADLESS_RENDER_ONLY_FIELD,
  default: undefined,
};
