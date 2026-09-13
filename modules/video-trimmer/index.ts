import { requireNativeModule } from 'expo-modules-core';

export interface VideoInfo {
  /** Seconds. */
  duration: number;
  width: number;
  height: number;
}

export interface TrimResult {
  uri: string;
  /** Actual duration of the written clip, in seconds. */
  duration: number;
}

interface VideoTrimmerModule {
  getInfo(uri: string): Promise<VideoInfo>;
  /** Writes [startTime, endTime) of `uri` to a new file and returns it. */
  trim(uri: string, startTime: number, endTime: number): Promise<TrimResult>;
}

/**
 * On-device video trimming.
 *
 * Uses AVAssetExportSession on iOS and MediaExtractor/MediaMuxer on Android,
 * both in passthrough mode: samples are copied, not re-encoded, so a trim is
 * fast and lossless. ffmpeg-kit-react-native was retired in 2025 and its
 * binaries delisted, so it is not an option.
 *
 * The build this replaces produced its clips with FileSystem.copyAsync on the
 * whole source, so every "clip" was a full-length copy of the original.
 */
export default requireNativeModule<VideoTrimmerModule>('VideoTrimmer');
