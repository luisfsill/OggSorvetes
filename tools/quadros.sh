#!/usr/bin/env bash
# Gera os quadros do filme da abertura a partir dos clipes do Dreamina em assets/raw.
# clipe1.mp4 (720x1280, casquinha) + clipe2.mp4 (704x1248, picolé), unidos com fusão de 0,6 s.
# Os cortes tiram a marca d'água "Dreamina AI" (canto inferior) e o selo "AI" (canto superior).
set -euo pipefail
FFMPEG="${FFMPEG:-ffmpeg}"
FPS=20
W=640
H=1013
cd "$(dirname "$0")/.."
rm -rf assets/quadros && mkdir -p assets/quadros
"$FFMPEG" -v error -y -i assets/raw/clipe1.mp4 -i assets/raw/clipe2.mp4 -filter_complex "
  [0:v]crop=720:1140:0:60,scale=$W:$H,fps=$FPS,setsar=1,format=yuv420p,settb=AVTB[a];
  [1:v]crop=704:1114:0:62,scale=$W:$H,fps=$FPS,setsar=1,format=yuv420p,settb=AVTB[b];
  [a][b]xfade=transition=fade:duration=0.6:offset=4.4[v]" \
  -map "[v]" -c:v libwebp -quality 66 -compression_level 6 assets/quadros/f%03d.webp
last=$(ls assets/quadros | tail -1)
cp "assets/quadros/$last" assets/poster.webp
cp assets/quadros/f001.webp assets/inicio.webp
"$FFMPEG" -v error -y -i assets/raw/picole.jpg -vf "crop=iw:ih*0.9:0:ih*0.04,scale=900:-1" -c:v libwebp -quality 80 assets/picole.webp
cp assets/raw/oggi-logo.svg assets/logo-oggi.svg
echo "$(ls assets/quadros | wc -l) quadros, $(du -sh assets/quadros | cut -f1)"
