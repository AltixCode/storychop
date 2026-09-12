import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MessageCircle, Camera, Video, Sliders, Lock } from 'lucide-react-native';
import { useVideoStore, PresetType } from '../store/useVideoStore';

interface PresetSelectorProps {
  onRequirePro?: () => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ onRequirePro }) => {
  const { preset, customDuration, isPro, setPreset, setCustomDuration } = useVideoStore();

  const presets: Array<{
    id: PresetType;
    label: string;
    durationLabel: string;
    icon: React.ReactNode;
    isProOnly?: boolean;
  }> = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      durationLabel: '30 sec',
      icon: <MessageCircle size={18} color="#25D366" />,
    },
    {
      id: 'instagram',
      label: 'IG Stories',
      durationLabel: '60 sec',
      icon: <Camera size={18} color="#E1306C" />,
    },
    {
      id: 'tiktok',
      label: 'TikTok / Reels',
      durationLabel: '90 sec',
      icon: <Video size={18} color="#00F2FE" />,
    },
    {
      id: 'custom',
      label: 'Custom',
      durationLabel: `${customDuration}s`,
      icon: <Sliders size={18} color="#A855F7" />,
      isProOnly: true,
    },
  ];

  const handleSelect = (selectedPreset: PresetType, isProOnly?: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isProOnly && !isPro) {
      if (onRequirePro) onRequirePro();
      return;
    }
    setPreset(selectedPreset);
  };

  return (
    <View className="w-full my-4">
      <Text className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
        Select Split Preset
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {presets.map((p) => {
          const isSelected = preset === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => handleSelect(p.id, p.isProOnly)}
              activeOpacity={0.8}
              className={`flex-1 min-w-[45%] p-3.5 rounded-xl border flex-row items-center justify-between ${
                isSelected
                  ? 'bg-blue-950/60 border-blue-500'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <View className="flex-row items-center space-x-2.5">
                {p.icon}
                <View className="ml-2">
                  <Text className="text-white text-sm font-semibold">{p.label}</Text>
                  <Text className="text-slate-400 text-xs mt-0.5">{p.durationLabel}</Text>
                </View>
              </View>
              {p.isProOnly && !isPro && (
                <View className="bg-amber-500/20 px-1.5 py-0.5 rounded flex-row items-center">
                  <Lock size={12} color="#F59E0B" />
                  <Text className="text-amber-400 text-[10px] font-bold ml-1">PRO</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {preset === 'custom' && (
        <View className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-xl flex-row items-center justify-between">
          <Text className="text-slate-300 text-sm">Cut each clip to:</Text>
          <View className="flex-row items-center">
            <TextInput
              className="bg-slate-950 text-white font-bold text-center px-3 py-1.5 rounded-lg border border-slate-700 w-16"
              keyboardType="number-pad"
              value={String(customDuration)}
              onChangeText={(val) => {
                const num = parseInt(val, 10);
                if (!isNaN(num)) setCustomDuration(num);
              }}
              maxLength={3}
            />
            <Text className="text-slate-400 text-sm ml-2">seconds</Text>
          </View>
        </View>
      )}
    </View>
  );
};
