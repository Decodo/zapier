# Decodo Zapier Integration

This repository provides a [Zapier](https://zapier.com/) integration for **Decodo's Web Scraping
API**, which extracts data from any target URL while handling proxy rotation, JavaScript rendering,
and bot protection. Use it to pull web pages and search results into Zaps without writing code.

## Actions

| Action             | What it does                                                                            |
| ------------------ | --------------------------------------------------------------------------------------- |
| **Fetch URL**      | Scrapes one page and returns it as markdown, raw HTML, or a screenshot.                 |
| **Fetch URL List** | Scrapes up to 25 URLs in one run and returns the content of each, plus any that failed. |
| **Run Search**     | Searches Google, Amazon, or a subreddit and returns structured results or page content. |

Shared options are markdown output, headless browser rendering (rendered HTML or a PNG screenshot),
location, and device type. Which ones apply depends on the action and, for searches, on the target.

## Authentication

The integration authenticates with a Web Scraping API key. Find it in your
[Decodo dashboard](https://dashboard.decodo.com/) under your Web Scraping API subscription, where you
can also try targets and parameters in the playground before building a Zap. Don't have an account
yet? [Start a free trial](https://dashboard.decodo.com/).

## Good to know

- Zapier stops an action after 30 seconds, so a scrape that takes longer fails rather than hanging.
- **Fetch URL List** takes at most 25 URLs per run and scrapes 10 at a time. A run returns as much
  content as Zapier can pass to the next step; anything beyond that is reported in the failure list
  rather than silently dropped.
- A run that scrapes some URLs and fails others still counts as a success, so check the failure count
  and list.
- Structured results and headless rendering are available for Google and Amazon searches, not for
  subreddits. Markdown only applies when structured results are off.
- A screenshot returns a PNG in place of the page content.

## Resources

- [Web Scraping API documentation](https://help.decodo.com/docs/web-scraping-api-introduction)
- [Decodo dashboard](https://dashboard.decodo.com/)
- [Decodo CLI](https://github.com/Decodo/cli) and [MCP server](https://github.com/Decodo/mcp-server)
  for scraping outside Zapier
