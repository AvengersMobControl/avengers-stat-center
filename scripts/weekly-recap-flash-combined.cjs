#!/usr/bin/env node
'use strict';
/**
 * Combined-day Flash Set PBs for the weekly recap, using the exact same
 * analyze() the Flash PNG and the site's Flash history view run
 * (piggy-flash-history.js) -- not a reimplementation.
 *
 * The site's static piggy-flash*-data.js files are stale (last covers
 * ~2026-10-13/14), so this re-derives the event list analyze() needs
 * straight from the approved ledger (reports/approved-summary-release.json),
 * which is kept current by the normal import pipeline.
 *
 * Usage: node scripts/weekly-recap-flash-combined.cjs <setId> [release.json]
 * Prints {dailyComparisons, combinedDayPBs, coverage} as JSON to stdout.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const { analyze } = require(path.join(ROOT, 'piggy-flash-history.js'));

function main() {
  const setId = process.argv[2];
  if (!setId) throw new Error('Usage: weekly-recap-flash-combined.cjs <setId> [release.json]');
  const releasePath = process.argv[3] || path.join(ROOT, 'reports', 'approved-summary-release.json');
  const release = JSON.parse(fs.readFileSync(releasePath, 'utf8'));

  const flashEvents = release.projection.events.filter(e => e.kind === 'flash');
  const events = flashEvents.map(e => ({
    id: e.id,
    flash: Number(e.metadata && e.metadata.flash),
    setId: (e.metadata && e.metadata.setId) || (String(e.date) + '-A'),
    date: e.date,
    clan: 'AVENGERS',
    potStars: null,
    complete: !!(e.metadata && e.metadata.complete),
    entries: (e.rows || []).map(r => ({
      name: r.player,
      clan: r.clan,
      lines: r.score,
      stars: r.stars,
      sparks: r.sparks,
      rank: r.metadata && r.metadata.rank,
      lobbyId: (r.metadata && r.metadata.lobby) || 'main',
    })),
  }));

  const h = analyze(events);
  const day = h.dailyComparisons.filter(x => x.setId === setId);

  function priorPbDate(player, beforeSetId, peak) {
    const earlier = h.days.filter(d => d.player === player && d.setId < beforeSetId && d.lines === peak);
    if (!earlier.length) return null;
    earlier.sort((a, b) => b.setId.localeCompare(a.setId));
    return earlier[0].date;
  }

  const pbs = day.filter(x => x.combinedDayPB).map(x => ({
    name: x.player,
    prior: x.priorPB,
    current: x.lines,
    priorDate: priorPbDate(x.player, setId, x.priorPB),
    pct: x.priorPB ? ((x.lines - x.priorPB) / x.priorPB) * 100 : null,
    flashCount: x.flashCount,
    complete: x.complete,
  }));

  process.stdout.write(JSON.stringify({ dailyComparisons: day, combinedDayPBs: pbs, coverage: h.coverage }, null, 2));
}

main();
