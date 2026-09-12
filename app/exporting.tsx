import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, XCircle, Film, Sparkles, ArrowLeft, RotateCcw } from 'lucide-react-native';
import { useVideoStore } from '../src/store/useVideoStore';
import { executeVideoSlicing } from '../src/services/ffmpeg';
import { t } from '../src/i18n';

export default function ExportingScreen() {
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
        reverseExportOrder
      );

      if (!isMounted || isCanceledRef.current) return;

      if (result.success) {
        setIsDone(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reset();
    router.replace('/');
  };

  const handleCancel = () => {
    isCanceledRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const progressPercent = Math.min(100, Math.round(exportProgress * 100));

  return (
    <View className="flex-1 bg-slate-950 px-6 justify-center items-center">
      {isDone ? (
        /* Completion State */
        <View className="w-full items-center">
          <View className="bg-emerald-500/20 p-5 rounded-full mb-5 border border-emerald-500/30">
            <CheckCircle2 size={56} color="#34D399" />
          </View>
          <Text className="text-2xl font-extrabold text-white text-center mb-2">
            {t('allClipsSaved')}
          </Text>
          <Text className="text-slate-400 text-sm text-center max-w-xs leading-relaxed mb-6">
            {t('allClipsSavedDesc', { count: segments.length })}
          </Text>

          <View className="bg-slate-900 border border-slate-800 p-4 rounded-2xl w-full mb-8 flex-row items-center">
            <Sparkles size={20} color="#60A5FA" />
            <Text className="text-slate-300 text-xs ml-3 flex-1">
              {t('qualityPreserved')}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleDone}
            activeOpacity={0.85}
            className="w-full bg-blue-600 active:bg-blue-500 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-500/20"
          >
            <RotateCcw size={18} color="#FFFFFF" />
            <Text className="text-white font-bold text-base ml-2">{t('splitAnotherVideo')}</Text>
          </TouchableOpacity>
        </View>
      ) : errorMessage ? (
        /* Error State */
        <View className="w-full items-center">
          <View className="bg-rose-500/20 p-5 rounded-full mb-5 border border-rose-500/30">
            <XCircle size={56} color="#F43F5E" />
          </View>
          <Text className="text-2xl font-extrabold text-white text-center mb-2">{t('exportFailed')}</Text>
          <Text className="text-rose-300 text-xs text-center max-w-xs mb-8">{errorMessage}</Text>

          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-slate-800 py-3.5 px-6 rounded-xl flex-row items-center justify-center"
          >
            <ArrowLeft size={16} color="#FFFFFF" />
            <Text className="text-white font-semibold text-sm ml-2">{t('backToSettings')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Exporting In-Progress State */
        <View className="w-full items-center">
          <View className="bg-blue-600/10 border border-blue-500/30 p-6 rounded-full mb-6">
            <Film size={44} color="#60A5FA" />
          </View>

          <Text className="text-xl font-bold text-white text-center mb-1">
            {t('losslessSlicing')}
          </Text>
          <Text className="text-slate-400 text-xs text-center mb-8">
            {t('exportingProgress', { current: currentSegmentIndex || 1, total: segments.length })}
          </Text>

          {/* Progress Bar */}
          <View className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800 mb-3">
            <View
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-blue-500 rounded-full"
            />
          </View>

          <View className="w-full flex-row justify-between mb-8">
            <Text className="text-slate-500 text-xs font-mono">{t('streamEngine')}</Text>
            <Text className="text-blue-400 text-xs font-bold font-mono">{progressPercent}%</Text>
          </View>

          <ActivityIndicator size="small" color="#60A5FA" className="mb-8" />

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={handleCancel}
            className="px-6 py-2.5 rounded-full bg-slate-900 border border-slate-800"
          >
            <Text className="text-slate-400 text-xs font-semibold">{t('cancelExport')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
