import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { changelogEntry } from './changelog-entry.js';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const parse = (version) => version.split('.').map(Number);

const isGreater = (a, b) => {
  const [x, y] = [parse(a), parse(b)];
  const i = x.findIndex((part, index) => part !== y[index]);

  return i !== -1 && x[i] > y[i];
};

const base = git('merge-base', process.argv[2] ?? 'HEAD^1', 'HEAD');
const changed = git('diff', '--name-only', base, 'HEAD').split('\n');

const before = JSON.parse(git('show', `${base}:package.json`));
const after = JSON.parse(readFileSync('package.json', 'utf8'));

const changedFiles = changed.filter(
  (file) =>
    (file.startsWith('src/') && !file.startsWith('src/test/')) ||
    file === 'tsconfig.json',
);
const dependenciesChanged =
  JSON.stringify(before.dependencies) !== JSON.stringify(after.dependencies);

const codeChanged = changedFiles.length > 0 || dependenciesChanged;
const versionChanged = after.version !== before.version;

if (!codeChanged && !versionChanged) {
  console.log('No integration code changed, version bump not required.');
  process.exit(0);
}

if (!isGreater(after.version, before.version)) {
  console.error(
    `package.json version ${after.version} is not above ${before.version}. ` +
      'Bump it and push that version to Zapier.',
  );
  [
    ...changedFiles,
    ...(dependenciesChanged ? ['package.json dependencies'] : []),
  ].forEach((file) => console.error(`  ${file}`));
  process.exit(1);
}

if (!/^(?!#)\S/m.test(changelogEntry(after.version) ?? '')) {
  console.error(
    `CHANGELOG.md has no entry for ${after.version}, or the entry has no text. ` +
      'zapier-platform promote needs one, and Zapier shows it to users.',
  );
  process.exit(1);
}

console.log(`Version bumped ${before.version} → ${after.version}.`);
