import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Scissors, ArrowRight, ArrowDownUp, AlertCircle } from 'lucide-react-native';
import { useVideoStore } from '../src/store/useVideoStore';
import { PresetSelector } from '../src/components/PresetSelector';
import { TimelineBar } from '../src/components/TimelineBar';
import { PaywallModal } from '../src/components/PaywallModal';
import { t } from '../src/i18n';

export default function TrimScreen() {
  const router = useRouter();
  const {
    video,
    segments,
    isPro,
    reverseExportOrder,
    setReverseExportOrder,
  } = useVideoStore();

  const [paywallVisible, setPaywallVisible] = useState(false);

  if (!video) {
    router.replace('/');
    return null;
  }

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
    <View className="flex-1 bg-slate-950 px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Preset Selector */}
        <PresetSelector onRequirePro={() => setPaywallVisible(true)} />

        {/* Visual Timeline Bar */}
        <TimelineBar />

        {/* Long Video Gating Alert if > 3 min and Free */}
        {isLongVideo && !isPro && (
          <View className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-2xl my-3 flex-row items-start">
            <AlertCircle size={18} color="#F59E0B" />
            <View className="flex-1 ml-3">
              <Text className="text-amber-300 font-bold text-sm">{t('longVideoDetected')}</Text>
              <Text className="text-amber-200/80 text-xs mt-0.5 leading-relaxed">
                {t('longVideoDesc')}
              </Text>
              <TouchableOpacity
                onPress={() => setPaywallVisible(true)}
                className="mt-2 bg-amber-500/20 self-start px-3 py-1 rounded-lg border border-amber-500/30"
              >
                <Text className="text-amber-400 text-xs font-bold">{t('unlockPro')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Reverse Order Export Toggle (Pro) */}
        <View className="bg-slate-900 border border-slate-800 p-4 rounded-2xl my-2 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-3">
            <View className="bg-slate-800 p-2 rounded-xl mr-3">
              <ArrowDownUp size={18} color="#60A5FA" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">{t('reverseExportOrder')}</Text>
              <Text className="text-slate-400 text-xs mt-0.5">
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
          <Scissors size={20} color="#FFFFFF" />
          <Text className="text-white font-bold text-base ml-2 mr-2">
            {t('exportClips', { count: segments.length })}
          </Text>
          <ArrowRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Embedded Paywall Modal */}
      <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
    </View>
  );
}
