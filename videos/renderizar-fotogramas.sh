#!/bin/sh
# Saca fotogramas de cada escena (inicio, mitad y final) para la revision.
# Uso: sh renderizar-fotogramas.sh [guias]   (con "guias" dibuja la zona segura en magenta)
cd "$(dirname "$0")"
EDGE="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
FRAMES="0,6,33,65,66,72,108,149,150,156,192,233,234,240,288,341,342,348,390,431,432,438,474,515,516,522,570,629"
OUT="out/fotogramas/limpio"
PROPS='{"guias":false}'
if [ "$1" = "guias" ]; then OUT="out/fotogramas/guias"; PROPS='{"guias":true}'; fi
MSYS_NO_PATHCONV=1 npx remotion render src/index.ts TikTok01Libreta "$OUT" --sequence --frames="$FRAMES" --image-format=png --props="$PROPS" --browser-executable="$EDGE"
