// expo-media-library's root export deprecated saveToLibraryAsync in SDK 57 and
// now throws on use. The legacy entry keeps the function-style API working;
// migrating to the class-based API is a separate change.
import * as MediaLibrary from 'expo-media-library/legacy';
import VideoTrimmer from '../../modules/video-trimmer';
import type { VideoSegment } from '../store/useVideoStore';

export interface SliceProgressCallback {
  (segmentIndex: number, totalSegments: number, progress: number): void;
}

export interface SliceOutcome {
  success: boolean;
  exportedCount: number;
  /** Duration actually written per clip, for the completion summary. */
  durations: number[];
  error?: string;
}

/**
 * Cuts the source into its segments and saves each clip to the camera roll.
 *
 * The previous implementation built an ffmpeg command string, never ran it, and
 * copied the whole source file once per segment — so the user received N
 * identical full-length videos rather than N clips. Trimming now happens in the
 * native module, which copies samples rather than re-encoding.
 */
export const executeVideoSlicing = async (
  sourceUri: string,
  segments: VideoSegment[],
  onProgress?: SliceProgressCallback,
  reverseOrder: boolean = false,
  shouldCancel?: () => boolean,
): Promise<SliceOutcome> => {
  const durations: number[] = [];

  try {
    // Add-only: neither app reads the library (imports come through the system
    // picker, which needs no permission), so asking for full read/write access
    // prompts for far more than is used -- and iOS can refuse it outright
    // without showing a prompt at all, which silently broke RedactPro's export.
    const { status } = await MediaLibrary.requestPermissionsAsync(true);
    if (status !== 'granted') {
      return {
        success: false,
        exportedCount: 0,
        durations,
        error: 'Photo library permissions denied.',
      };
    }

    // Reversing affects the order clips reach the camera roll, which is the
    // order most pickers present them in when posting a story.
    const ordered = reverseOrder ? [...segments].reverse() : [...segments];
    let exportedCount = 0;

    for (let i = 0; i < ordered.length; i++) {
      if (shouldCancel?.()) break;

      const segment = ordered[i];
      onProgress?.(i + 1, ordered.length, (i + 0.5) / ordered.length);

      const clip = await VideoTrimmer.trim(sourceUri, segment.startTime, segment.endTime);
      durations.push(clip.duration);

      await MediaLibrary.saveToLibraryAsync(clip.uri);
      exportedCount++;

      onProgress?.(i + 1, ordered.length, (i + 1) / ordered.length);
    }

    return { success: true, exportedCount, durations };
  } catch (error) {
    return {
      success: false,
      exportedCount: 0,
      durations,
      error: (error as { message?: string })?.message || 'Failed to export video clips.',
    };
  }
};
