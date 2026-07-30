import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const iconUrl = new URL('../src/app/icon.svg', import.meta.url);
const metadataSource = readFileSync(
    new URL('../src/app/layout.tsx', import.meta.url),
    'utf8',
);
const iconSource = readFileSync(iconUrl, 'utf8');

assert.equal(existsSync(iconUrl), true, 'SmartPark App Router icon must exist');
assert.match(iconSource, /<title id="title">SmartPark<\/title>/);
assert.match(iconSource, /viewBox="0 0 64 64"/);
assert.doesNotMatch(iconSource, /vercel|next\.js|triangle/i);
assert.match(
    metadataSource,
    /icon:\s*\[\{ url: '\/icon\.svg', type: 'image\/svg\+xml' \}\]/,
    'metadata should reference the SmartPark SVG icon',
);
assert.equal(
    existsSync(new URL('../src/app/favicon.ico', import.meta.url)),
    false,
    'the old Vercel favicon should be removed',
);
assert.equal(
    existsSync(new URL('../public/vercel.svg', import.meta.url)),
    false,
    'unused Vercel branding should be removed',
);
assert.equal(
    existsSync(new URL('../public/next.svg', import.meta.url)),
    false,
    'unused Next.js branding should be removed',
);

console.log('SmartPark branding checks passed');
