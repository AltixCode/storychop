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
import { useTheme } from '../src/theme/useTheme';
import { useTabletColumn } from '../src/theme/useTabletColumn';
import { AdBanner } from '../src/components/AdBanner';
import { useAdsStore } from '../src/store/adsStore';
import { showPrivacyOptionsForm } from '../src/services/ads';

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
  // Google requires a persistent entry back into the consent form wherever UMP reports that
  // privacy options are available, which in practice means the EEA and the regulated US
  // states. It is absent everywhere else rather than shown as a dead control.
  const offerPrivacyOptions = useAdsStore((state) => state.consent.offerPrivacyOptions);
  const theme = useTheme();
  const tabletColumn = useTabletColumn();
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
    <SafeAreaView edges={['bottom']} className="flex-1 px-5" style={{ backgroundColor: theme.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 , ...tabletColumn,
          // A fixed block, not a list that grows, so it is centred when there
          // is slack. On a 13" iPad these screens sat at the top with a third
          // or more of the display empty beneath them. Deliberately not applied
          // to packpixel or gridhabit, whose home screens hold a list the user
          // adds to -- centring a growing list leaves it floating with dead
          // space above and below.
          flexGrow: 1,
          justifyContent: 'center',
        }}>
        {/* Hero Section */}
        <View className="mt-4 mb-6">
          <View className="inline-flex self-start bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full mb-3 flex-row items-center">
            <Sparkles size={12} color={theme.primary} />
            <Text className="text-xs font-semibold ml-1.5" style={{ color: theme.primary }}>
              {t('heroBadge')}
            </Text>
          </View>
          <Text className="text-3xl font-extrabold tracking-tight" style={{ color: theme.text }}>
            {t('heroTitle')}
          </Text>
          <Text className="text-sm mt-1.5 leading-relaxed" style={{ color: theme.textSecondary }}>
            {t('heroSubtitle')}
          </Text>
        </View>

        {/* Video Selector Card */}
        {video ? (
          <View className="border rounded-2xl p-5 mb-6" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
            <View className="flex-row items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: theme.cardBorder }}>
              <View className="flex-row items-center gap-2">
                <View className="bg-blue-600/20 p-2 rounded-xl">
                  <Film size={20} color={theme.primary} />
                </View>
                <Text className="font-bold text-base ml-2" style={{ color: theme.text }}>{t('selectedVideo')}</Text>
              </View>
              <TouchableOpacity
                onPress={handlePickVideo}
                className="flex-row items-center px-3 py-1.5 rounded-lg" style={{ backgroundColor: theme.controlSurface }}
              >
                <RefreshCw size={13} color={theme.textMuted} />
                <Text className="text-xs font-medium ml-1.5" style={{ color: theme.textSecondary }}>{t('change')}</Text>
              </TouchableOpacity>
            </View>

            {/* Metadata Badges */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              <View className="border px-3 py-2 rounded-xl flex-1 min-w-[30%] items-center" style={{ backgroundColor: theme.background, borderColor: theme.cardBorder }}>
                <Clock size={14} color={theme.primary} />
                <Text className="text-[10px] uppercase font-bold mt-1" style={{ color: theme.textSecondary }}>{t('duration')}</Text>
                <Text className="text-xs font-bold mt-0.5" style={{ color: theme.text }}>
                  {formatDuration(video.duration)}
                </Text>
              </View>

              <View className="border px-3 py-2 rounded-xl flex-1 min-w-[30%] items-center" style={{ backgroundColor: theme.background, borderColor: theme.cardBorder }}>
                <Maximize2 size={14} color={theme.success} />
                <Text className="text-[10px] uppercase font-bold mt-1" style={{ color: theme.textSecondary }}>{t('resolution')}</Text>
                <Text className="text-xs font-bold mt-0.5" style={{ color: theme.text }}>
                  {video.width}×{video.height}
                </Text>
              </View>

              <View className="border px-3 py-2 rounded-xl flex-1 min-w-[30%] items-center" style={{ backgroundColor: theme.background, borderColor: theme.cardBorder }}>
                <HardDrive size={14} color={theme.warning} />
                <Text className="text-[10px] uppercase font-bold mt-1" style={{ color: theme.textSecondary }}>{t('size')}</Text>
                <Text className="text-xs font-bold mt-0.5" style={{ color: theme.text }}>
                  {formatBytes(video.fileSize)}
                </Text>
              </View>
            </View>

            {/* Proceed Action Button */}
            <TouchableOpacity
              onPress={() => router.push('/trim')}
              className="bg-blue-600 active:bg-blue-500 py-3.5 px-4 rounded-xl flex-row items-center justify-center"
            >
              <Text className="font-bold text-base mr-2" style={{ color: theme.onPrimary }}>{t('configureSplit')}</Text>
              <ForwardArrow size={18} color={theme.onPrimary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handlePickVideo}
            disabled={isPicking}
            activeOpacity={0.85}
            className="border-2 border-dashed rounded-3xl p-8 items-center justify-center my-2" style={{ borderColor: theme.cardBorder, backgroundColor: theme.card }}
          >
            <View className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-full mb-4">
              <Film size={36} color={theme.primary} />
            </View>
            <Text className="font-bold text-lg text-center mb-1" style={{ color: theme.text }}>
              {t('selectVideoPrompt')}
            </Text>
            <Text className="text-xs text-center max-w-xs leading-relaxed" style={{ color: theme.textSecondary }}>
              {t('selectVideoDesc')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Core Architectural Guarantees */}
        <View className="mt-6 flex-col gap-3">
          <Text className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>
            {t('archGuarantees')}
          </Text>

          <View className="border p-4 rounded-2xl flex-row items-start mb-3" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
            <View className="bg-blue-500/10 p-2 rounded-xl mr-3">
              <Zap size={18} color={theme.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-sm" style={{ color: theme.text }}>{t('streamCopyTitle')}</Text>
              <Text className="text-xs mt-0.5 leading-relaxed" style={{ color: theme.textSecondary }}>
                {t('streamCopyDesc')}
              </Text>
            </View>
          </View>

          <View className="border p-4 rounded-2xl flex-row items-start mb-3" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
            <View className="bg-emerald-500/10 p-2 rounded-xl mr-3">
              <ShieldCheck size={18} color={theme.success} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-sm" style={{ color: theme.text }}>{t('privacyTitle')}</Text>
              <Text className="text-xs mt-0.5 leading-relaxed" style={{ color: theme.textSecondary }}>
                {t('privacyDesc')}
              </Text>
            </View>
          </View>
        </View>
        {offerPrivacyOptions ? (
          <TouchableOpacity
            onPress={() => {
              void showPrivacyOptionsForm();
            }}
            accessibilityRole="button"
            className="mt-2 py-3 items-center"
            style={{ minHeight: 44 }}
          >
            <Text className="text-xs font-semibold underline" style={{ color: theme.textSecondary }}>
              {t('adPrivacySettings')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      {/* Anchored below the scroll area rather than inside it: a banner that scrolls with the
          content can sit under a finger reaching for the button above it. */}
      <AdBanner />
    </SafeAreaView>
  );
}
