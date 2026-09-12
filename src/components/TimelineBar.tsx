import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Scissors, Film } from 'lucide-react-native';
import { useVideoStore } from '../store/useVideoStore';

const formatSeconds = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const TimelineBar: React.FC = () => {
  const { segments, video } = useVideoStore();

  if (!video || segments.length === 0) return null;

  return (
    <View className="w-full my-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Scissors size={14} color="#60A5FA" />
          <Text className="text-xs font-semibold uppercase tracking-wider text-slate-300 ml-1.5">
            Output Clips ({segments.length})
          </Text>
        </View>
        <Text className="text-xs text-slate-400">Total: {formatSeconds(video.duration)}</Text>
      </View>

      {/* Visual Segment Timeline Strip */}
      <View className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex-row border border-slate-800 my-2">
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
            className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl min-w-[100px] items-center"
          >
            <View className="flex-row items-center mb-1">
              <Film size={12} color="#94A3B8" />
              <Text className="text-xs font-bold text-white ml-1">Part {seg.index}</Text>
            </View>
            <Text className="text-xs font-mono text-blue-400">
              {formatSeconds(seg.startTime)} - {formatSeconds(seg.endTime)}
            </Text>
            <Text className="text-[10px] text-slate-500 mt-0.5">
              {seg.duration.toFixed(0)}s duration
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
