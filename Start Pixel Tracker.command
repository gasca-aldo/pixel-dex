#!/bin/zsh
cd "${0:A:h}"
export PATH="/Users/gasca/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/Users/gasca/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH"
echo "Pixel Tracker — open http://localhost:3000 in your browser."
echo "Keep this window open. Press Control-C to stop."
pnpm dev --host 127.0.0.1 --port 3000 --strictPort
