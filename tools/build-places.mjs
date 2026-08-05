import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.dirname(here);
const places = JSON.parse(fs.readFileSync(path.join(here, 'places-source.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(site, 'assets/data/history/manifest.json'), 'utf8'));
const records = manifest.chunks.flatMap(chunk => JSON.parse(fs.readFileSync(path.join(site, chunk.url), 'utf8')));
const norm = value => String(value || '').toLowerCase().replace(/\s+/g, '');
const haystack = record => norm([
  record.title, record.event, record.primaryCategory,
  ...(record.tags || [])
].join(' '));

const output = places.map(place => {
  const terms = place.matchTerms.map(norm);
  const related = records
    .filter(record => terms.some(term => haystack(record).includes(term)))
    .sort((a, b) => String(b.startDate || b.year).localeCompare(String(a.startDate || a.year)))
    .map(record => ({
      id: record.id,
      date: record.startDate || String(record.year || ''),
      title: record.title,
      category: record.primaryCategory
    }));
  const { matchTerms, ...publicPlace } = place;
  return { ...publicPlace, eventIds: related.map(event => event.id), relatedEvents: related };
});

const reverse = {};
for (const place of output) {
  for (const eventId of place.eventIds) {
    if (!reverse[eventId]) reverse[eventId] = [];
    reverse[eventId].push({ id: place.id, name: place.name });
  }
}

fs.writeFileSync(
  path.join(site, 'assets/data/places-data.js'),
  `window.TOUCHENG_PLACES = ${JSON.stringify(output)};\n`,
  'utf8'
);
fs.writeFileSync(
  path.join(site, 'assets/data/place-event-index.js'),
  `window.TOUCHENG_EVENT_PLACES = ${JSON.stringify(reverse)};\n`,
  'utf8'
);

console.log(JSON.stringify({ places: output.length, linkedEvents: Object.keys(reverse).length, links: Object.values(reverse).reduce((sum, value) => sum + value.length, 0) }));
