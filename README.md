# Decodo Zapier integration

<p align="center">
  <a href="https://dashboard.decodo.com/scrapers/pricing?utm_source=github&utm_medium=social&utm_campaign=zapier"><img src="https://github.com/user-attachments/assets/13b08523-32b0-4c85-8e99-580d7c2a9055" alt="Decodo Web Scraping API" /></a>
</p>

Connect the Decodo [Web Scraping API](https://decodo.com/scraping/web) to
[Zapier](https://zapier.com/) to fetch web pages, scrape Google search results, and scrape
Amazon product data from search results. Pass page content or structured data to the next step
in your Zap, with no code required.

The integration provides three actions backed by the same API. Decodo handles proxy rotation,
JavaScript rendering, and bot protection so you can build web scraping automation around the
data you need. Retrieval still depends on the target page and the action's time limit.

Test your target and settings in the Decodo [Playground](https://dashboard.decodo.com/playground)
before building a Zap. The options exposed in Zapier are listed below.

## Actions

| Action | What it does |
| --- | --- |
| **Fetch URL** | Scrapes one page and returns Markdown, HTML, or a PNG screenshot. |
| **Fetch URL List** | Scrapes up to 25 URLs per run and returns each page's content, plus counts and failure details. |
| **Run Search** | Returns parsed Google or Amazon search results, page content, or posts from a specified subreddit. |

**Fetch URL** and **Fetch URL List** return Markdown by default. Both expose location, device
type, and headless rendering settings. Choose rendered HTML to read content that appears after
JavaScript runs, or turn Markdown off to capture a screenshot.

**Run Search** exposes different settings for each target:

| Target | Required input | Optional settings |
| --- | --- | --- |
| Google | Search query | Parsed results, Markdown, headless rendering, location, and locale |
| Amazon | Search query | Parsed results, Markdown, headless rendering, location, and regional domain |
| Reddit | Subreddit name | Post sorting and location |

The Reddit option fetches a subreddit rather than running a keyword search. It does not expose
parsing, Markdown, or headless rendering settings.

Google and Amazon return parsed results by default. Turn **Return parsed results** off to get
page content, then choose HTML, Markdown, or a screenshot.

## Example workflows

- **Search results in Google Sheets**. Use Run Search to collect Google or Amazon results, then
  map the returned fields into spreadsheet rows.
- **Web content for an AI step**. Fetch a page as Markdown and pass its content to a summarization
  or analysis step.
- **Data extraction from a URL list**. Map URLs from an earlier Zap step into Fetch URL List,
  then process the returned content and route failed URLs for review.
- **Rendered or location-dependent pages**. Enable headless rendering for JavaScript content
  or choose a location to retrieve a page from a specific country or city.

## Quick start

1. **Create an account** on the Decodo [dashboard](https://dashboard.decodo.com/).
2. **Copy your Web Scraping API key** from your Web Scraping API subscription. In the Decodo dashboard, this credential is labelled as the Basic authentication token.
3. **Add a Decodo action to your Zap** after your chosen trigger. Select **Fetch URL**,
   **Fetch URL List**, or **Run Search**, then connect your account using the API key.
4. **Configure the action** with a URL, a URL list, a Google or Amazon search query, or a
   subreddit name. Choose the output and any additional settings you need.
5. **Test the step and inspect the result**, then map the returned data into your next Zap step.
   For URL lists, check the failure count and reasons as well as the fetched content.

## Authentication

The integration uses a Web Scraping API key from your subscription on the Decodo
[dashboard](https://dashboard.decodo.com/). Enter it in the **API Key** field when connecting
your Decodo account in Zapier.

Zapier checks the key with Decodo when you connect. If the key is rejected, check it in the
dashboard and reconnect the account.

## Good to know

- **Timeouts**. Each API request has a 25-second timeout. The entire action must finish within
  Zapier's [30-second action limit](https://docs.zapier.com/platform/build/troubleshoot-action-timeouts),
  including a URL list run. If requests time out, try fewer URLs or turn off Headless.
- **Bulk limits**. Fetch URL List accepts at most 25 URLs per run and scrapes up to 10 at a time.
  The integration applies an output cap of roughly 5 MB. Results beyond that cap appear in the
  failure list with a reason, even if the page was fetched successfully.
- **Partial success**. A URL list run with at least one returned result counts as a success.
  Check `scraped`, `failed`, and `errors` before processing `results`. A run with no returned
  results fails.
- **Search output**. Google and Amazon support parsed results and headless rendering. Markdown
  applies only when parsed results are off. These settings are not exposed for subreddits.
- **Screenshots**. A screenshot returns a PNG in place of page content. Turn Markdown off for
  either URL action. For Google or Amazon, turn both parsed results and Markdown off, then
  select **Screenshot (PNG)** under **Headless**.
- **Actions only**. The integration provides actions, with no triggers. Choose a trigger from
  another app or use a Zapier schedule to start your workflow.

## Development

<details>
<summary>Install, build, and check the integration</summary>

From the repository root:

```sh
npm install
npm run build
npm test
npm run lint
npm run format:check
```

`npm test` builds the integration before running the tests. The current tests mock API requests
and do not require a Decodo API key. Use `npm run format` to apply formatting to the source files.

The actions live in `src/creates/`, their input fields in `src/input-fields.ts`, and request and
batch limits in `src/constants.ts`.

</details>

## Resources

- [Web Scraping API documentation](https://help.decodo.com/docs/web-scraping-api-introduction)
- [Decodo dashboard](https://dashboard.decodo.com/)
- [Decodo Discord](https://discord.gg/Ja8dqKgvbZ)
- [Decodo CLI](https://github.com/Decodo/cli) & [MCP server](https://github.com/Decodo/mcp-server)
  for scraping outside Zapier
