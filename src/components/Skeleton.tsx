import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
}

export function Skeleton({ width, height, style, borderRadius = 8 }: SkeletonProps) {
  const t = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [-200, 200]);
    return {
      transform: [{ translateX: `${translateX}%` }] as any,
    };
  });

  return (
    <View style={[{ width, height, borderRadius, backgroundColor: t.surfaceVariant, overflow: 'hidden' }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle, { width: '100%', flexDirection: 'row' }]}>
        <LinearGradient
          colors={['transparent', t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
