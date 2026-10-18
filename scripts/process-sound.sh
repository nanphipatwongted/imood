#!/usr/bin/env bash
# Turns a downloaded recording into a seamless ambient loop:
#   scripts/process-sound.sh <input-file> <sound-id>
# Writes public/sounds/<sound-id>.ogg and .m4a, then log the source in
# src/data/credits.json.
#
# Seamless loop: the first XFADE seconds are crossfaded onto the end, so the
# loop's last sample flows straight into its first (original t=XFADE). The
# output is XFADE seconds shorter than the input.
set -euo pipefail

INPUT="$1"
ID="$2"
MAX_SECONDS="${MAX_SECONDS:-120}" # cap length to keep files small
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/sounds"

duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$INPUT")
length=$(awk -v d="$duration" -v m="$MAX_SECONDS" 'BEGIN { print (d < m ? d : m) }')
# 3s crossfade, but never more than a sixth of the clip.
xfade=$(awk -v l="$length" 'BEGIN { x = l / 6; print (x < 3 ? x : 3) }')

filter="[0]atrim=0:${length},asetpts=PTS-STARTPTS,asplit[a][b];\
[a]atrim=0:${xfade},asetpts=PTS-STARTPTS[head];\
[b]atrim=${xfade},asetpts=PTS-STARTPTS[body];\
[body][head]acrossfade=d=${xfade}:c1=tri:c2=tri,loudnorm=I=-20:TP=-2[out]"

for ext in ogg m4a; do
  [[ "$ext" == "ogg" ]] && codec=(-c:a libopus -b:a 96k) || codec=(-c:a aac -b:a 128k)
  ffmpeg -hide_banner -loglevel error -y -i "$INPUT" \
    -filter_complex "$filter" -map "[out]" -ac 2 "${codec[@]}" "$OUT/$ID.$ext"
done

printf "%s: %.1fs loop (%.1fs crossfade) from %s\n" "$ID" \
  "$(awk -v l="$length" -v x="$xfade" 'BEGIN { print l - x }')" "$xfade" "$(basename "$INPUT")"
