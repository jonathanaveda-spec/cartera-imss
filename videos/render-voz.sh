#!/bin/sh
# Renderiza videos con voz a videos/entregas/. Uso: sh render-voz.sh <Composición> <NombreDeArchivo>
#   sh render-voz.sh TikTok02ExcelVoz TikTok02_excel_con_voz
# (H.264 + AAC, yuv420p, con Microsoft Edge como navegador; la salida no lleva música)
cd "$(dirname "$0")"
# Edge 154 ya no abre con el modo de Remotion: se usa chrome-headless-shell de la caché de puppeteer si está (si no, Edge).
HS=$(ls "$HOME"/.cache/puppeteer/chrome-headless-shell/*/chrome-headless-shell-win64/chrome-headless-shell.exe 2>/dev/null | head -1)
HS=$( [ -n "$HS" ] && cygpath -m "$HS" )
EDGE="${HS:-C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe}"
MSYS_NO_PATHCONV=1 npx remotion render src/index.ts "$1" "entregas/$2.mp4" --codec=h264 --pixel-format=yuv420p --audio-codec=aac --browser-executable="$EDGE"
