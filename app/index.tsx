import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  Film,
  Sparkles,
  Zap,
  ShieldCheck,
  Clock,
  Maximize2,
  HardDrive,
  RefreshCw,
} from 'lucide-react-native';
import { useVideoStore } from '../src/store/useVideoStore';
import { t } from '../src/i18n';
import { ForwardArrow } from '../src/components/DirectionalIcons';

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
};

const formatBytes = (bytes?: number): string => {
  if (!bytes) return t('unknownSize');
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

export default function HomeScreen() {
  const router = useRouter();
  const { video, setVideo } = useVideoStore();
  const [isPicking, setIsPicking] = useState(false);

  const handlePickVideo = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsPicking(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setVideo({
          uri: asset.uri,
          name: asset.fileName || 'Selected Video',
          duration: asset.duration ? asset.duration / 1000 : 60,
          width: asset.width || 1080,
          height: asset.height || 1920,
          fileSize: asset.fileSize,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert(t('selectionError'), t('selectionErrorDesc'));
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-slate-950 px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Hero Section */}
        <View className="mt-4 mb-6">
          <View className="inline-flex self-start bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full mb-3 flex-row items-center">
            <Sparkles size={12} color="#60A5FA" />
            <Text className="text-blue-400 text-xs font-semibold ml-1.5">
              {t('heroBadge')}
            </Text>
          </View>
          <Text className="text-3xl font-extrabold text-white tracking-tight">
            {t('heroTitle')}
          </Text>
          <Text className="text-slate-400 text-sm mt-1.5 leading-relaxed">
            {t('heroSubtitle')}
          </Text>
        </View>

        {/* Video Selector Card */}
        {video ? (
          <View className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
            <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <View className="flex-row items-center gap-2">
                <View className="bg-blue-600/20 p-2 rounded-xl">
                  <Film size={20} color="#60A5FA" />
                </View>
                <Text className="text-white font-bold text-base ml-2">{t('selectedVideo')}</Text>
              </View>
              <TouchableOpacity
                onPress={handlePickVideo}
                className="flex-row items-center bg-slate-800 px-3 py-1.5 rounded-lg"
              >
                <RefreshCw size={13} color="#94A3B8" />
                <Text className="text-slate-300 text-xs font-medium ml-1.5">{t('change')}</Text>
              </TouchableOpacity>
            </View>

            {/* Metadata Badges */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              <View className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl flex-1 min-w-[30%] items-center">
                <Clock size={14} color="#60A5FA" />
                <Text className="text-slate-400 text-[10px] uppercase font-bold mt-1">{t('duration')}</Text>
                <Text className="text-white text-xs font-bold mt-0.5">
                  {formatDuration(video.duration)}
                </Text>
              </View>

              <View className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl flex-1 min-w-[30%] items-center">
                <Maximize2 size={14} color="#34D399" />
                <Text className="text-slate-400 text-[10px] uppercase font-bold mt-1">{t('resolution')}</Text>
                <Text className="text-white text-xs font-bold mt-0.5">
                  {video.width}×{video.height}
                </Text>
              </View>

              <View className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl flex-1 min-w-[30%] items-center">
                <HardDrive size={14} color="#FBBF24" />
                <Text className="text-slate-400 text-[10px] uppercase font-bold mt-1">{t('size')}</Text>
                <Text className="text-white text-xs font-bold mt-0.5">
                  {formatBytes(video.fileSize)}
                </Text>
              </View>
            </View>

            {/* Proceed Action Button */}
            <TouchableOpacity
              onPress={() => router.push('/trim')}
              className="bg-blue-600 active:bg-blue-500 py-3.5 px-4 rounded-xl flex-row items-center justify-center"
            >
              <Text className="text-white font-bold text-base mr-2">{t('configureSplit')}</Text>
              <ForwardArrow size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handlePickVideo}
            disabled={isPicking}
            activeOpacity={0.85}
            className="border-2 border-dashed border-slate-700 bg-slate-900/40 rounded-3xl p-8 items-center justify-center my-2"
          >
            <View className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-full mb-4">
              <Film size={36} color="#60A5FA" />
            </View>
            <Text className="text-white font-bold text-lg text-center mb-1">
              {t('selectVideoPrompt')}
            </Text>
            <Text className="text-slate-400 text-xs text-center max-w-xs leading-relaxed">
              {t('selectVideoDesc')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Core Architectural Guarantees */}
        <View className="mt-6 flex-col gap-3">
          <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            {t('archGuarantees')}
          </Text>

          <View className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex-row items-start mb-3">
            <View className="bg-blue-500/10 p-2 rounded-xl mr-3">
              <Zap size={18} color="#60A5FA" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">{t('streamCopyTitle')}</Text>
              <Text className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                {t('streamCopyDesc')}
              </Text>
            </View>
          </View>

          <View className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl flex-row items-start mb-3">
            <View className="bg-emerald-500/10 p-2 rounded-xl mr-3">
              <ShieldCheck size={18} color="#34D399" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">{t('privacyTitle')}</Text>
              <Text className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                {t('privacyDesc')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
