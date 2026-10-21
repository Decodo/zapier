import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const changelogEntry = (version) => {
  const lines = readFileSync('CHANGELOG.md', 'utf8').split(/\r?\n/);
  const escaped = version.replaceAll('.', '\\.');
  const start = lines.findIndex((line) =>
    new RegExp(`^#{1,4} v?${escaped}\\b`).test(line),
  );

  if (start === -1) {
    return undefined;
  }

  const level = lines[start].match(/^#+/)[0].length;
  const end = lines.findIndex(
    (line, index) => index > start && new RegExp(`^#{1,${level}} `).test(line),
  );

  return lines
    .slice(start + 1, end === -1 ? undefined : end)
    .join('\n')
    .trim();
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const entry = changelogEntry(process.argv[2]);

  if (!entry) {
    console.error(`No CHANGELOG.md entry for ${process.argv[2]}.`);
    process.exit(1);
  }

  console.log(entry);
}
