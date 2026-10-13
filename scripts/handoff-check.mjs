// Compatibility entry: no longer treats seven headings as proof of completion.
process.argv[2]='check';
await import('./handoff.mjs');
