#!/bin/sh
# Saca fotogramas de cada escena (inicio, mitad y final) de TikTok02Excel o TikTok03Pin para la revision.
# Uso: sh fotogramas.sh 02|03 [guias]   (con "guias" dibuja la zona segura en magenta y el centro en cian)
cd "$(dirname "$0")"
EDGE="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
case "$1" in
  02) COMP=TikTok02Excel
      FRAMES="0,36,71,72,117,161,162,207,251,252,289,326,327,381,434,435,480,524,525,570,614,615,675,734" ;;
  03) COMP=TikTok03Pin
      FRAMES="0,36,71,72,111,149,150,192,233,234,276,317,318,360,401,402,453,503,504,555,605,606,663,719" ;;
  *) echo "Uso: sh fotogramas.sh 02|03 [guias]"; exit 1 ;;
esac
OUT="out/fotogramas-$1/limpio"
PROPS='{"guias":false}'
if [ "$2" = "guias" ]; then OUT="out/fotogramas-$1/guias"; PROPS='{"guias":true}'; fi
MSYS_NO_PATHCONV=1 npx remotion render src/index.ts "$COMP" "$OUT" --sequence --frames="$FRAMES" --image-format=png --props="$PROPS" --browser-executable="$EDGE"
