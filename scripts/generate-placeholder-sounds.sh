#!/usr/bin/env bash
# Generates synthetic placeholder ambient loops (pure ffmpeg synthesis, so no
# licensing concerns) for sounds that don't have a real recording yet. Once a
# real file exists, process it with scripts/process-sound.sh and REMOVE its
# line here — otherwise rerunning this script overwrites the real recording.
#
# Every modulation frequency below divides evenly into DURATION seconds, so
# each file ends at the same phase it starts and loops without a seam.
set -euo pipefail

DURATION=60
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/sounds"
mkdir -p "$OUT"

gen() {
  local name="$1" filter="$2"
  for ext in ogg m4a; do
    local codec
    [[ "$ext" == "ogg" ]] && codec="-c:a libopus -b:a 96k" || codec="-c:a aac -b:a 128k"
    # shellcheck disable=SC2086
    ffmpeg -hide_banner -loglevel error -y \
      -f lavfi -i "$filter,loudnorm=I=-20:TP=-2" \
      -t "$DURATION" -ac 2 $codec "$OUT/$name.$ext"
  done
  echo "generated $name"
}

gen rain "anoisesrc=c=pink:a=0.5,highpass=f=400,lowpass=f=8000"

# Real recordings (see src/data/credits.json) — not generated here:
# storm, chatter, coffee, keyboard, forest, birds, stream, wind, campfire
