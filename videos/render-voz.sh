#!/bin/sh
# Renderiza videos con voz a videos/entregas/. Uso: sh render-voz.sh <Composición> <NombreDeArchivo>
#   sh render-voz.sh TikTok02ExcelVoz TikTok02_excel_con_voz
# (H.264 + AAC, yuv420p, con Microsoft Edge como navegador; la salida no lleva música)
cd "$(dirname "$0")"
EDGE="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
MSYS_NO_PATHCONV=1 npx remotion render src/index.ts "$1" "entregas/$2.mp4" --codec=h264 --pixel-format=yuv420p --audio-codec=aac --browser-executable="$EDGE"
