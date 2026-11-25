#!/bin/sh
# Bundles the sim entry points (game code + browser shims) for Node.
set -e
cd "$(dirname "$0")/.."
for f in run consequences dump; do
  npx esbuild "sim/$f.ts" --bundle --platform=node --format=esm --inject:sim/shim.js '--alias:$lib=./src/lib' --outfile="sim/dist/$f.mjs" --log-level=warning
done
