import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Scissors,
  ArrowDownUp,
  AlertCircle,
} from 'lucide-react-native';
import { useVideoStore } from '../src/store/useVideoStore';
import { PresetSelector } from '../src/components/PresetSelector';
import { TimelineBar } from '../src/components/TimelineBar';
import { PaywallModal } from '../src/components/PaywallModal';
import { usePaywall } from '../src/hooks/usePaywall';
import { t } from '../src/i18n';
import { ForwardArrow } from '../src/components/DirectionalIcons';
import { useTheme } from '../src/theme/useTheme';
import { useTabletColumn } from '../src/theme/useTabletColumn';

export default function TrimScreen() {
  const theme = useTheme();
  const tabletColumn = useTabletColumn();
  const { priceString } = usePaywall(() => undefined);
  const router = useRouter();
  const {
    video,
    segments,
    isPro,
    reverseExportOrder,
    setReverseExportOrder,
  } = useVideoStore();

  const [paywallVisible, setPaywallVisible] = useState(false);

  // Redirect AFTER the commit, never during render.
  //
  // `router.replace()` called in the render phase throws "Couldn't find a
  // navigation context" -- React is still rendering, so the navigator is not
  // in a state that can accept a navigation. It surfaces as a Render Error
  // whose stack names the ROOT layout and the home screen rather than this
  // file, which sends the reader to the wrong screen entirely. It fires on the
  // ordinary guard path: arrive here with nothing loaded and the app dies
  // instead of bouncing home.
  useEffect(() => {
    if (!video) router.replace('/');
  }, [video, router]);

  if (!video) return null;

  const isLongVideo = video.duration > 180; // > 3 minutes is Pro only
  const requiresPro = (isLongVideo && !isPro);

  const handleStartExport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (requiresPro) {
      setPaywallVisible(true);
      return;
    }
    router.push('/exporting');
  };

  return (
    <View className="flex-1 px-5" style={{ backgroundColor: theme.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, ...tabletColumn, flexGrow: 1, justifyContent: 'center' }}>
        {/* Preset Selector */}
        <PresetSelector onRequirePro={() => setPaywallVisible(true)} />

        {/* Visual Timeline Bar */}
        <TimelineBar />

        {/* Long Video Gating Alert if > 3 min and Free */}
        {isLongVideo && !isPro && (
          <View className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-2xl my-3 flex-row items-start">
            <AlertCircle size={18} color={theme.warning} />
            <View className="flex-1 ml-3">
              <Text className="font-bold text-sm" style={{ color: theme.warning }}>{t('longVideoDetected')}</Text>
              <Text className="text-amber-200/80 text-xs mt-0.5 leading-relaxed">
                {t('longVideoDesc')}
              </Text>
              <TouchableOpacity
                onPress={() => setPaywallVisible(true)}
                className="mt-2 bg-amber-500/20 self-start px-3 py-1 rounded-lg border border-amber-500/30"
              >
                <Text className="text-xs font-bold" style={{ color: theme.warning }}>{t('unlockPro', { price: priceString ?? '' })}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Reverse Order Export Toggle (Pro) */}
        <View className="border p-4 rounded-2xl my-2 flex-row items-center justify-between" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
          <View className="flex-row items-center flex-1 mr-3">
            <View className="p-2 rounded-xl mr-3" style={{ backgroundColor: theme.controlSurface }}>
              <ArrowDownUp size={18} color={theme.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-sm" style={{ color: theme.text }}>{t('reverseExportOrder')}</Text>
              <Text className="text-xs mt-0.5" style={{ color: theme.textSecondary }}>
                {t('reverseExportOrderDesc')}
              </Text>
            </View>
          </View>
          <Switch
            value={reverseExportOrder}
            onValueChange={(val) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (val && !isPro) {
                setPaywallVisible(true);
                return;
              }
              setReverseExportOrder(val);
            }}
            trackColor={{ false: '#1E293B', true: '#2563EB' }}
            thumbColor={reverseExportOrder ? '#FFFFFF' : '#94A3B8'}
          />
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleStartExport}
          activeOpacity={0.85}
          className="mt-6 bg-blue-600 active:bg-blue-500 p-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-500/20"
        >
          <Scissors size={20} color={theme.onPrimary} />
          <Text className="font-bold text-base ml-2 mr-2" style={{ color: theme.onPrimary }}>
            {t('exportClips', { count: segments.length })}
          </Text>
          <ForwardArrow size={18} color={theme.onPrimary} />
        </TouchableOpacity>
      </ScrollView>

      {/* Embedded Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}
