import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, XCircle, Film, Sparkles, ArrowLeft, RotateCcw } from 'lucide-react-native';
import { useVideoStore } from '../src/store/useVideoStore';
import { executeVideoSlicing } from '../src/engine/videoSlicer';
import { t } from '../src/i18n';
import { useTheme } from '../src/theme/useTheme';
import { useAdsStore } from '../src/store/adsStore';
import { showInterstitial } from '../src/services/ads';
import { shouldShowInterstitial } from '../src/services/adPolicy';

export default function ExportingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    video,
    segments,
    reverseExportOrder,
    exportProgress,
    currentSegmentIndex,
    setExportProgress,
    reset,
  } = useVideoStore();

  const [isDone, setIsDone] = useState(false);
  const [clipDurations, setClipDurations] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isCanceledRef = useRef(false);

  useEffect(() => {
    if (!video || segments.length === 0) {
      router.replace('/');
      return;
    }

    let isMounted = true;

    const runExport = async () => {
      setErrorMessage(null);
      setIsDone(false);

      const result = await executeVideoSlicing(
        video.uri,
        segments,
        (currentIdx, total, progress) => {
          if (!isMounted || isCanceledRef.current) return;
          setExportProgress(progress, currentIdx);
        },
        reverseExportOrder,
        () => isCanceledRef.current,
      );

      if (!isMounted || isCanceledRef.current) return;

      if (result.success) {
        // Surfaced so the user can confirm the clips really differ in length —
        // the previous build silently produced N copies of the whole video.
        setClipDurations(result.durations);
        setIsDone(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        void useAdsStore.getState().recordCompletion();
      } else {
        setErrorMessage(result.error || t('exportFailed'));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    };

    runExport();

    return () => {
      isMounted = false;
      isCanceledRef.current = true;
    };
  }, []);

  const maybeShowInterstitial = async () => {
    const { completions, lastInterstitialAt, markInterstitialShown } = useAdsStore.getState();
    const decision = shouldShowInterstitial({
      completions,
      lastInterstitialAt,
      now: Date.now(),
      // Read at call time rather than captured: the user may have bought the upgrade from the
      // paywall between opening this screen and finishing the work.
      isPro: useVideoStore.getState().isPro,
    });
    if (!decision) return;
    // Only a shown-and-dismissed ad resets the clock. Counting an unfilled request would
    // suppress the next several ads for nothing.
    if (await showInterstitial()) await markInterstitialShown();
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reset();
    router.replace('/');
    // After the navigation, not before it: an ad that appears while the user is still looking
    // at the export screen reads as the app refusing to let them leave.
    void maybeShowInterstitial();
  };

  const handleCancel = () => {
    isCanceledRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const progressPercent = Math.min(100, Math.round(exportProgress * 100));

  return (
    <View className="flex-1 px-6 justify-center items-center" style={{ backgroundColor: theme.background }}>
      {isDone ? (
        /* Completion State */
        <View className="w-full items-center">
          <View className="bg-emerald-500/20 p-5 rounded-full mb-5 border border-emerald-500/30">
            <CheckCircle2 size={56} color={theme.success} />
          </View>
          <Text className="text-2xl font-extrabold text-center mb-2" style={{ color: theme.text }}>
            {t('allClipsSaved')}
          </Text>
          <Text className="text-sm text-center max-w-xs leading-relaxed mb-6" style={{ color: theme.textSecondary }}>
            {t('allClipsSavedDesc', { count: clipDurations.length || segments.length })}
          </Text>

          <View className="border p-4 rounded-2xl w-full mb-8 flex-row items-center" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
            <Sparkles size={20} color={theme.primary} />
            <Text className="text-xs ml-3 flex-1" style={{ color: theme.textSecondary }}>
              {clipDurations.length > 0
                ? t('clipLengths', {
                    lengths: clipDurations.map((d) => `${d.toFixed(1)}s`).join(', '),
                  })
                : t('qualityPreserved')}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleDone}
            activeOpacity={0.85}
            className="w-full bg-blue-600 active:bg-blue-500 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-500/20"
          >
            <RotateCcw size={18} color={theme.onPrimary} />
            <Text className="font-bold text-base ml-2" style={{ color: theme.onPrimary }}>{t('splitAnotherVideo')}</Text>
          </TouchableOpacity>
        </View>
      ) : errorMessage ? (
        /* Error State */
        <View className="w-full items-center">
          <View className="bg-rose-500/20 p-5 rounded-full mb-5 border border-rose-500/30">
            <XCircle size={56} color={theme.danger} />
          </View>
          <Text className="text-2xl font-extrabold text-center mb-2" style={{ color: theme.text }}>{t('exportFailed')}</Text>
          <Text className="text-xs text-center max-w-xs mb-8" style={{ color: theme.danger }}>{errorMessage}</Text>

          <TouchableOpacity
            onPress={() => router.back()}
            className="py-3.5 px-6 rounded-xl flex-row items-center justify-center" style={{ backgroundColor: theme.controlSurface }}
          >
            <ArrowLeft size={16} color={theme.text} />
            <Text className="font-semibold text-sm ml-2" style={{ color: theme.text }}>{t('backToSettings')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Exporting In-Progress State */
        <View className="w-full items-center">
          <View className="bg-blue-600/10 border border-blue-500/30 p-6 rounded-full mb-6">
            <Film size={44} color={theme.primary} />
          </View>

          <Text className="text-xl font-bold text-center mb-1" style={{ color: theme.text }}>
            {t('losslessSlicing')}
          </Text>
          <Text className="text-xs text-center mb-8" style={{ color: theme.textSecondary }}>
            {t('exportingProgress', { current: currentSegmentIndex || 1, total: segments.length })}
          </Text>

          {/* Progress Bar */}
          <View className="w-full h-3 rounded-full overflow-hidden border mb-3" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
            <View
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-blue-500 rounded-full"
            />
          </View>

          <View className="w-full flex-row justify-between mb-8">
            <Text className="text-xs font-mono" style={{ color: theme.textMuted }}>{t('streamEngine')}</Text>
            <Text className="text-xs font-bold font-mono" style={{ color: theme.primary }}>{progressPercent}%</Text>
          </View>

          <ActivityIndicator size="small" color={theme.primary} className="mb-8" />

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={handleCancel}
            className="px-6 py-2.5 rounded-full border" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
          >
            <Text className="text-xs font-semibold" style={{ color: theme.textSecondary }}>{t('cancelExport')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
