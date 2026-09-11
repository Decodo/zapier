import { DecodoClient, Target } from '@decodo/sdk-ts';
import type { ResultEntry, ScrapeRequest } from '@decodo/sdk-ts';
import { defineCreate } from 'zapier-platform-core';
import type { ZObject, Bundle } from 'zapier-platform-core';
import { withZapierErrors } from '../client.js';
import { INTEGRATION_NAME } from '../constants.js';

type InputData = {
  url: string;
  markdown?: boolean;
  headless?: string;
  geo?: string;
  device_type?: string;
};

const perform = async (
  z: ZObject,
  bundle: Bundle<InputData>,
): Promise<ResultEntry> => {
  const { url, markdown, headless, geo, device_type } = bundle.inputData;

  const params = {
    target: Target.Universal,
    url,
    ...(markdown ? { markdown: true } : {}),
    ...(headless ? { headless } : {}),
    ...(geo ? { geo } : {}),
    ...(device_type ? { device_type } : {}),
  } as ScrapeRequest;

  const client = new DecodoClient({
    webScrapingApi: {
      token: bundle.authData?.token ?? '',
      integrationHeader: INTEGRATION_NAME,
    },
  });

  const response = await withZapierErrors(z, () =>
    client.webScrapingApi.scrape(params),
  );

  const result = response.results?.[0];

  if (!result) {
    throw new z.errors.Error(
      'Decodo returned no content for this URL. The page may be empty or the request may have been blocked.',
      'EmptyResult',
      200,
    );
  }

  return result;
};

export default defineCreate({
  key: 'scrape_url',
  noun: 'Page',

  display: {
    label: 'Scrape URL',
    description:
      'Scrapes a web page and returns its content as markdown, HTML, or parsed data.',
  },

  operation: {
    perform,

    inputFields: [
      {
        key: 'url',
        label: 'URL',
        type: 'string',
        required: true,
        helpText: 'The full address of the page to scrape.',
      },
      {
        key: 'markdown',
        label: 'Return Markdown',
        type: 'boolean',
        required: false,
        default: 'yes',
        helpText:
          'Return clean markdown instead of raw HTML. Best for feeding the result to an AI step.',
      },
      {
        key: 'headless',
        label: 'Headless',
        type: 'string',
        required: false,
        choices: { html: 'HTML', png: 'Screenshot (PNG)' },
        helpText:
          "Load the page in a real browser first. `HTML` runs the page's JavaScript and returns the rendered markup. `Screenshot` returns a PNG image instead. Leave empty to fetch without a browser, which is faster.",
      },
      {
        key: 'geo',
        label: 'Location',
        type: 'string',
        required: false,
        helpText:
          'Scrape from a specific country or city, for example `United States`. Leave empty to let Decodo choose.',
      },
      {
        key: 'device_type',
        label: 'Device Type',
        type: 'string',
        required: false,
        choices: { desktop: 'Desktop', mobile: 'Mobile' },
        helpText: 'Which device the page should be requested as.',
      },
    ],

    sample: {
      task_id: '7238940912345678901',
      url: 'https://example.com',
      status_code: 200,
      content: '# Example Domain\n\nThis domain is for use in examples.',
      created_at: '2026-09-04 12:00:00',
      updated_at: '2026-09-04 12:00:04',
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
