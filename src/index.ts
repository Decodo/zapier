import zapier, { defineApp } from 'zapier-platform-core';
import packageJson from '../package.json' with { type: 'json' };
import authentication from './authentication.js';
import { befores, afters } from './middleware.js';
import scrapeUrl from './creates/scrape-url.js';
import runSearch from './creates/run-search.js';
import scrapeUrlList from './creates/scrape-url-list.js';

export default defineApp({
  // This is just shorthand to reference the installed dependencies you have.
  // Zapier will need to know these before we can upload.
  version: packageJson.version,
  platformVersion: zapier.version,

  authentication,

  beforeRequest: [...befores],

  afterResponse: [...afters],

  // If you want your trigger to show up, you better include it here!
  triggers: {},

  // If you want your searches to show up, you better include it here!
  searches: {},

  // If you want your creates to show up, you better include it here!
  creates: {
    [scrapeUrl.key]: scrapeUrl,
    [runSearch.key]: runSearch,
    [scrapeUrlList.key]: scrapeUrlList,
  },

  resources: {},
});
