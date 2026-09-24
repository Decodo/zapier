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
  DEVICE_TYPE_FIELD,
  GEO_FIELD,
  HEADLESS_FIELD,
  HEADLESS_RENDER_ONLY_FIELD,
  isOn,
  SCRAPE_MARKDOWN_FIELD,
  URL_FIELD,
} from '../input-fields.js';

type InputData = {
  url?: string;
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

  const asMarkdown = isOn(markdown, true);

  const renderMode = asMarkdown && headless === 'png' ? 'html' : headless;

  const params = {
    target: Target.Universal,
    url,
    ...(asMarkdown ? { markdown: true } : {}),
    ...(renderMode ? { headless: renderMode } : {}),
    ...(geo ? { geo } : {}),
    ...(device_type ? { device_type } : {}),
  } as ScrapeRequest;

  const client = createDecodoClient(
    bundle.authData?.apiKey ?? '',
    REQUEST_TIMEOUT_MS,
  );

  const response = await withZapierErrors(z, () =>
    client.webScrapingApi.scrape(params),
  );

  const result = response.results?.[0];

  if (!result) {
    throw new z.errors.Error(
      apiMessage(response) ??
        'Decodo returned no content for this URL. The page may be empty or the request may have been blocked.',
      'EmptyResult',
      200,
    );
  }

  return withIsoTimestamps(result);
};

export default defineCreate({
  key: 'scrape_url',
  noun: 'Page',

  display: {
    label: 'Fetch URL',
    description:
      'Fetches a web page and returns its content as markdown, HTML, or a screenshot.',
  },

  operation: {
    perform,

    inputFields: [
      URL_FIELD,
      SCRAPE_MARKDOWN_FIELD,
      (_z: ZObject, bundle: Bundle<InputData>): PlainInputField[] => [
        isOn(bundle.inputData.markdown, true)
          ? HEADLESS_RENDER_ONLY_FIELD
          : HEADLESS_FIELD,
        GEO_FIELD,
        DEVICE_TYPE_FIELD,
      ],
    ],

    sample: {
      task_id: '7238940912345678901',
      url: 'https://example.com',
      status_code: 200,
      content: '# Example Domain\n\nThis domain is for use in examples.',
      created_at: '2026-09-04T12:00:00Z',
      updated_at: '2026-09-04T12:00:04Z',
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
