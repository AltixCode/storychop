#!/usr/bin/env bash
# Verifies the clips StoryChop wrote to the camera roll of a QA simulator.
# Usage: .maestro/verify-clips.sh <simulator-udid> <expected-clip-count>
set -euo pipefail
UDID="${1:?usage: verify-clips.sh <udid> <count>}"
WANT="${2:-4}"
DCIM="$HOME/Library/Developer/CoreSimulator/Devices/$UDID/data/Media/DCIM/100APPLE"
BIN="$(mktemp -d)/verify-clips"
swiftc -O "$(dirname "$0")/verify-clips.swift" -o "$BIN"
# Newest first, then oldest-first for playback order.
mapfile -t CLIPS < <(ls -t "$DCIM"/*.MP4 2>/dev/null | head -"$WANT" | tail -r)
[ "${#CLIPS[@]}" -eq "$WANT" ] || { echo "FAIL: expected $WANT clips, found ${#CLIPS[@]}"; exit 1; }
"$BIN" "${CLIPS[@]}"
