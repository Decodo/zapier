import { Target } from '@decodo/sdk-ts';
import type { ResultEntry, ScrapeRequest } from '@decodo/sdk-ts';
import { defineCreate } from 'zapier-platform-core';
import type { ZObject, Bundle, PlainInputField } from 'zapier-platform-core';
import {
  apiMessage,
  createDecodoClient,
  withIsoTimestamps,
  withZapierErrors,
} from '../client.js';
import { REQUEST_TIMEOUT_MS } from '../constants.js';
import {
  ECOMMERCE_DOMAIN_FIELD,
  ECOMMERCE_QUERY_FIELD,
  GEO_FIELD,
  SERP_LOCALE_FIELD,
  SERP_QUERY_FIELD,
  PARSE_FIELD,
  SEARCH_HEADLESS_FIELD,
  SEARCH_HEADLESS_RENDER_ONLY_FIELD,
  isOn,
  SEARCH_MARKDOWN_FIELD,
  SEARCH_TARGET_FIELD,
} from '../input-fields.js';

type InputData = {
  target?: string;
  query?: string;
  parse?: boolean;
  markdown?: boolean;
  headless?: string;
  geo?: string;
  locale?: string;
  domain?: string;
};

const searchRequest = (inputData: InputData): ScrapeRequest => {
  const {
    target: selectedTarget,
    query,
    parse,
    markdown,
    headless,
    geo,
    locale,
    domain,
  } = inputData;

  const target = selectedTarget || Target.GoogleSearch;

  const parsed = isOn(parse, true);
  const asMarkdown = !parsed && isOn(markdown, false);

  const renderMode =
    headless === 'png' && (parsed || asMarkdown) ? 'html' : headless;

  return {
    target,
    query,
    ...(parsed ? { parse: true } : {}),
    ...(asMarkdown ? { markdown: true } : {}),
    ...(renderMode ? { headless: renderMode } : {}),
    ...(geo ? { geo } : {}),
    ...(target === Target.GoogleSearch && locale ? { locale } : {}),
    ...(target === Target.AmazonSearch && domain ? { domain } : {}),
  } as ScrapeRequest;
};

const perform = async (
  z: ZObject,
  bundle: Bundle<InputData>,
): Promise<ResultEntry> => {
  const request = searchRequest(bundle.inputData);

  const client = createDecodoClient(
    bundle.authData?.apiKey ?? '',
    REQUEST_TIMEOUT_MS,
  );

  const response = await withZapierErrors(z, () =>
    client.webScrapingApi.scrape(request),
  );

  const result = response.results?.[0];

  if (!result) {
    throw new z.errors.Error(
      apiMessage(response) ??
        'Decodo returned no results for this search. Try a different query, or run it without parsing to see the raw page.',
      'EmptyResult',
      200,
    );
  }

  return withIsoTimestamps(result);
};

export default defineCreate({
  key: 'run_search',
  noun: 'Search',

  display: {
    label: 'Run Search',
    description:
      'Runs a SERP or e-commerce search and returns the results as structured data, markdown, or HTML.',
  },

  operation: {
    perform,

    inputFields: [
      SEARCH_TARGET_FIELD,
      (_z: ZObject, bundle: Bundle<InputData>): PlainInputField[] => {
        const isEcommerce = bundle.inputData.target === Target.AmazonSearch;

        const parsed = isOn(bundle.inputData.parse, true);
        const asMarkdown = !parsed && isOn(bundle.inputData.markdown, false);

        return [
          isEcommerce ? ECOMMERCE_QUERY_FIELD : SERP_QUERY_FIELD,
          PARSE_FIELD,
          ...(parsed ? [] : [SEARCH_MARKDOWN_FIELD]),
          parsed || asMarkdown
            ? SEARCH_HEADLESS_RENDER_ONLY_FIELD
            : SEARCH_HEADLESS_FIELD,
          GEO_FIELD,
          isEcommerce ? ECOMMERCE_DOMAIN_FIELD : SERP_LOCALE_FIELD,
        ];
      },
    ],

    sample: {
      task_id: '7238940912345678901',
      url: 'https://example.com/search?q=coffee+shops',
      status_code: 200,
      content: {
        results: {
          page: 1,
          last_visible_page: 9,
          parse_status_code: 12000,
          url: 'https://example.com/search?q=coffee+shops',
          results: {
            organic: [
              {
                pos: 1,
                pos_overall: 1,
                title: 'Example Domain',
                url: 'https://example.com',
                url_shown: 'https://example.com',
                desc: 'This domain is for use in documentation examples.',
              },
            ],
            search_information: {
              query: 'coffee shops',
              showing_results_for: 'coffee shops',
              total_results_count: 0,
            },
            total_results_count: 0,
          },
        },
      },
      created_at: '2026-09-17T12:00:00Z',
      updated_at: '2026-09-17T12:00:04Z',
    },

    outputFields: [
      { key: 'url', label: 'URL' },
      { key: 'status_code', label: 'Status Code', type: 'integer' },
      { key: 'task_id', label: 'Task ID' },
      { key: 'created_at', label: 'Created At' },
      { key: 'updated_at', label: 'Updated At' },
    ],
  },
});
