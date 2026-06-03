#!/usr/bin/env sh
cd "$(dirname "$0")" || exit 1
URL="http://localhost:8080/"
echo "OpenFluidSoundVisualizer - serveur local pour YouTube"
echo "Ouvre: $URL"
if command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL" >/dev/null 2>&1 & fi
if command -v open >/dev/null 2>&1; then open "$URL" >/dev/null 2>&1 & fi
python3 -m http.server 8080 || python -m http.server 8080
