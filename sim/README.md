# Headless replayability sim

Runs the real game code (src/lib) in Node with seeded maps and bots, to measure
how predictable Plots is.

```sh
npx esbuild sim/run.ts --bundle --platform=node --format=esm --inject:sim/shim.js --alias:\$lib=./src/lib --outfile=sim/dist/run.mjs
node sim/dist/run.mjs 30 3            # maps, years (~1–2 min on 8 cores)
npx esbuild sim/consequences.ts --bundle --platform=node --format=esm --inject:sim/shim.js --alias:\$lib=./src/lib --outfile=sim/dist/consequences.mjs
node sim/dist/consequences.mjs 30     # idle + delayed-consequence tests (~20 s)
```

- `run.ts`: adaptive lookahead bot, memorised-script cross-play, five play styles, random baseline.
- `consequences.ts`: idle test (stop building for a year) and placement tests (smart / random / worst / early mistake / luck).
- `policies.ts`: the rule-following player; `harness.ts`: game setup, stepping, tile choice; `dump.ts`: prints building stats.
- Results land in `sim/dist/last-run.json` and `sim/dist/last-consequences.json`.
