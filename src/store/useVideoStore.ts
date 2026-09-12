import { create } from 'zustand';

export type PresetType = 'whatsapp' | 'instagram' | 'tiktok' | 'custom';

export interface VideoSegment {
  id: string;
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
  outputUri?: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
}

interface VideoMetadata {
  uri: string;
  name: string;
  duration: number; // in seconds
  width: number;
  height: number;
  fileSize?: number;
}

interface VideoState {
  video: VideoMetadata | null;
  preset: PresetType;
  customDuration: number;
  segments: VideoSegment[];
  isPro: boolean;
  isExporting: boolean;
  exportProgress: number; // 0 to 1
  currentSegmentIndex: number;
  reverseExportOrder: boolean;

  // Actions
  setVideo: (video: VideoMetadata | null) => void;
  setPreset: (preset: PresetType) => void;
  setCustomDuration: (duration: number) => void;
  setReverseExportOrder: (reverse: boolean) => void;
  setIsPro: (isPro: boolean) => void;
  setExportProgress: (progress: number, currentIndex: number) => void;
  setIsExporting: (exporting: boolean) => void;
  updateSegmentStatus: (id: string, status: VideoSegment['status'], outputUri?: string) => void;
  computeSegments: () => void;
  reset: () => void;
}

const PRESET_DURATIONS: Record<Exclude<PresetType, 'custom'>, number> = {
  whatsapp: 30,
  instagram: 60,
  tiktok: 90,
};

export const useVideoStore = create<VideoState>((set, get) => ({
  video: null,
  preset: 'instagram',
  customDuration: 60,
  segments: [],
  isPro: false,
  isExporting: false,
  exportProgress: 0,
  currentSegmentIndex: 0,
  reverseExportOrder: false,

  setVideo: (video) => {
    set({ video });
    get().computeSegments();
  },

  setPreset: (preset) => {
    set({ preset });
    get().computeSegments();
  },

  setCustomDuration: (customDuration) => {
    set({ customDuration: Math.max(5, customDuration) });
    get().computeSegments();
  },

  setReverseExportOrder: (reverseExportOrder) => {
    set({ reverseExportOrder });
  },

  setIsPro: (isPro) => {
    set({ isPro });
  },

  setExportProgress: (exportProgress, currentSegmentIndex) => {
    set({ exportProgress, currentSegmentIndex });
  },

  setIsExporting: (isExporting) => {
    set({ isExporting });
  },

  updateSegmentStatus: (id, status, outputUri) => {
    set((state) => ({
      segments: state.segments.map((seg) =>
        seg.id === id ? { ...seg, status, outputUri: outputUri || seg.outputUri } : seg
      ),
    }));
  },

  computeSegments: () => {
    const { video, preset, customDuration } = get();
    if (!video || video.duration <= 0) {
      set({ segments: [] });
      return;
    }

    const T = video.duration;
    const St = preset === 'custom' ? customDuration : PRESET_DURATIONS[preset];
    if (!St || St <= 0) return;

    // Total Segments N = ceil(T / St)
    const N = Math.ceil(T / St);
    const newSegments: VideoSegment[] = [];

    for (let i = 1; i <= N; i++) {
      const startTime = (i - 1) * St;
      const endTime = Math.min(i * St, T);
      newSegments.push({
        id: `seg_${i}_${Date.now()}`,
        index: i,
        startTime,
        endTime,
        duration: Math.max(0.1, endTime - startTime),
        status: 'pending',
      });
    }

    set({ segments: newSegments });
  },

  reset: () => {
    set({
      video: null,
      segments: [],
      isExporting: false,
      exportProgress: 0,
      currentSegmentIndex: 0,
    });
  },
}));
