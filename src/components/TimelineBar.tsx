import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Scissors, Film } from 'lucide-react-native';
import { useVideoStore } from '../store/useVideoStore';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';

const formatSeconds = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const TimelineBar: React.FC = () => {
  const theme = useTheme();
  const { segments, video } = useVideoStore();

  if (!video || segments.length === 0) return null;

  return (
    <View className="w-full my-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Scissors size={14} color={theme.primary} />
          <Text className="text-xs font-semibold uppercase tracking-wider ml-1.5" style={{ color: theme.textSecondary }}>
            {t('outputClips', { count: segments.length })}
          </Text>
        </View>
        <Text className="text-xs" style={{ color: theme.textSecondary }}>
          {t('totalDuration', { duration: formatSeconds(video.duration) })}
        </Text>
      </View>

      {/* Visual Segment Timeline Strip */}
      <View className="h-4 w-full rounded-full overflow-hidden flex-row border my-2" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}>
        {segments.map((seg, idx) => {
          const widthPercent = (seg.duration / video.duration) * 100;
          const isEven = idx % 2 === 0;
          return (
            <View
              key={seg.id}
              style={{ width: `${widthPercent}%` }}
              className={`h-full border-r border-slate-950 ${
                isEven ? 'bg-blue-500' : 'bg-cyan-500'
              }`}
            />
          );
        })}
      </View>

      {/* Segment Cards List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-2 py-1"
        contentContainerStyle={{ gap: 8 }}
      >
        {segments.map((seg) => (
          <View
            key={seg.id}
            className="border px-3 py-2 rounded-xl min-w-[100px] items-center" style={{ backgroundColor: theme.card, borderColor: theme.cardBorder }}
          >
            <View className="flex-row items-center mb-1">
              <Film size={12} color={theme.textMuted} />
              <Text className="text-xs font-bold ml-1" style={{ color: theme.text }}>
                {t('partIndex', { index: seg.index })}
              </Text>
            </View>
            <Text className="text-xs font-mono" style={{ color: theme.primary }}>
              {formatSeconds(seg.startTime)} - {formatSeconds(seg.endTime)}
            </Text>
            <Text className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>
              {t('partDuration', { duration: seg.duration.toFixed(0) })}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
