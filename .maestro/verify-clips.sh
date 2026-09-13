#!/usr/bin/env bash
# Verifies the clips StoryChop wrote to the camera roll of a QA simulator.
# Usage: .maestro/verify-clips.sh <simulator-udid|android> <expected-clip-count>
#
# The slicer is AVAssetExportSession on iOS and MediaExtractor/MediaMuxer on
# Android -- separate implementations, so one passing says nothing about the
# other.
set -euo pipefail
TARGET="${1:?usage: verify-clips.sh <udid|android> <count>}"
WANT="${2:-4}"
BIN="$(mktemp -d)/verify-clips"
swiftc -O "$(dirname "$0")/verify-clips.swift" -o "$BIN"

if [ "$TARGET" = android ]; then
  ADB="$HOME/Library/Android/sdk/platform-tools/adb"
  "$ADB" shell content call --uri content://media/ --method scan_volume --arg external_primary >/dev/null 2>&1 || true
  PULLED="$(mktemp -d)"
  for f in $("$ADB" shell "ls -t /sdcard/DCIM/*.mp4 /sdcard/Movies/*.mp4" 2>/dev/null | tr -d '\r' | grep -v -- "-qa/" | head -"$WANT"); do
    "$ADB" pull "$f" "$PULLED/" >/dev/null 2>&1 || true
  done
  mapfile -t CLIPS < <(ls "$PULLED"/*.mp4 2>/dev/null | sort)
else
  DCIM="$HOME/Library/Developer/CoreSimulator/Devices/$TARGET/data/Media/DCIM/100APPLE"
  # Newest first, then oldest-first for playback order.
  mapfile -t CLIPS < <(ls -t "$DCIM"/*.MP4 2>/dev/null | head -"$WANT" | tail -r)
fi
[ "${#CLIPS[@]}" -eq "$WANT" ] || { echo "FAIL: expected $WANT clips, found ${#CLIPS[@]}"; exit 1; }
"$BIN" "${CLIPS[@]}"
