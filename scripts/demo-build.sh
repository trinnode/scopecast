#!/usr/bin/env bash
# Assemble the DoraHacks demo video from captured frames + espeak narration.
# Run from the repository root: bash scripts/demo-build.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FRAMES="$ROOT/docs/demo/frames"
WORK="$ROOT/docs/demo/work"
OUT="$ROOT/docs/demo/scopecast-demo.mp4"
DURATION=8

rm -rf "$WORK" && mkdir -p "$WORK"

mapfile -t LINES < "$ROOT/docs/demo/narration.txt"
mapfile -t FILES < <(find "$FRAMES" -maxdepth 1 -name '*.png' | sort)

if [ "${#LINES[@]}" -ne "${#FILES[@]}" ]; then
  echo "ERROR: ${#LINES[@]} narration lines but ${#FILES[@]} frames" >&2
  exit 1
fi

for i in "${!FILES[@]}"; do
  n=$((i + 1))
  espeak -v en+f3 -s 145 -w "$WORK/voice-$n.wav" "${LINES[$i]}" >/dev/null 2>&1
  ffmpeg -y -loglevel error -i "$WORK/voice-$n.wav" -af "apad" -t "$DURATION" -c:a aac -b:a 96k "$WORK/voice-$n.m4a"
  FADE=""
  if [ "$n" -eq 1 ]; then FADE=",fade=t=in:st=0:d=0.5"; fi
  if [ "$n" -eq "${#FILES[@]}" ]; then FADE="$FADE,fade=t=out:st=7.5:d=0.5"; fi
  ffmpeg -y -loglevel error -loop 1 -i "${FILES[$i]}" -i "$WORK/voice-$n.m4a" \
    -filter_complex "[0:v]scale=1280:800:force_original_aspect_ratio=decrease,pad=1280:800:(ow-iw)/2:(oh-ih)/2${FADE}[v]" \
    -map "[v]" -map 1:a -t "$DURATION" -c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p -c:a copy "$WORK/seg-$n.mp4"
  echo "segment $n/${#FILES[@]}"
done

: > "$WORK/list.txt"
for i in $(seq 1 "${#FILES[@]}"); do echo "file '$WORK/seg-$i.mp4'" >> "$WORK/list.txt"; done
ffmpeg -y -loglevel error -f concat -safe 0 -i "$WORK/list.txt" -c copy "$OUT"

echo "VIDEO: $OUT"
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUT"
