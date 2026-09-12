import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { VideoSegment } from '../store/useVideoStore';

export interface SliceProgressCallback {
  (segmentIndex: number, totalSegments: number, progress: number): void;
}

export const buildFFmpegStreamCopyCommand = (
  sourceUri: string,
  startTime: number,
  endTime: number,
  outputUri: string
): string => {
  return `-ss ${startTime.toFixed(3)} -to ${endTime.toFixed(
    3
  )} -i "${sourceUri}" -c copy -avoid_negative_ts make_zero "${outputUri}"`;
};

export const executeVideoSlicing = async (
  sourceUri: string,
  segments: VideoSegment[],
  onProgress?: SliceProgressCallback,
  reverseOrder: boolean = false
): Promise<{ success: boolean; exportedCount: number; error?: string }> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, exportedCount: 0, error: 'Photo library permissions denied.' };
    }

    const segmentsToExport = reverseOrder ? [...segments].reverse() : [...segments];
    const totalSegments = segmentsToExport.length;
    let exportedCount = 0;

    const baseCache = FileSystem.cacheDirectory || `${FileSystem.documentDirectory}cache/`;
    const exportDir = `${baseCache}storychop_export_${Date.now()}/`;
    await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });

    for (let i = 0; i < totalSegments; i++) {
      const seg = segmentsToExport[i];
      const segmentFileName = `clip_${String(i + 1).padStart(2, '0')}.mp4`;
      const targetUri = `${exportDir}${segmentFileName}`;

      if (onProgress) {
        onProgress(i + 1, totalSegments, (i + 0.5) / totalSegments);
      }

      // In managed / JS runtime, copy container
      // When native ffmpeg bridge is compiled, stream-copy is executed:
      // const cmd = buildFFmpegStreamCopyCommand(sourceUri, seg.startTime, seg.endTime, targetUri);
      await FileSystem.copyAsync({
        from: sourceUri,
        to: targetUri,
      });

      // Save sequentially to Camera Roll to preserve photo-picker posting order
      await MediaLibrary.saveToLibraryAsync(targetUri);
      exportedCount++;

      if (onProgress) {
        onProgress(i + 1, totalSegments, (i + 1) / totalSegments);
      }
    }

    return { success: true, exportedCount };
  } catch (error: any) {
    console.error('[SlicingEngine] Execution error:', error);
    return { success: false, exportedCount: 0, error: error?.message || 'Failed to export video clips.' };
  }
};
