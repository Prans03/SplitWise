// ============================================================
// SplitWise – UI Enhancement Components
// Animated progress bar, number counter, shimmer skeleton
// ============================================================
import React, { useEffect, useRef } from 'react';
import {
  View, Text, Animated, StyleSheet, Easing, ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';

// ── 1. River Progress Bar (Material You style) ───────────────
interface ProgressBarProps {
  progress: number;        // 0 to 1
  label?: string;
  valueLabel?: string;
  color?: string;
  trackColor?: string;
  height?: number;
  animated?: boolean;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  label,
  valueLabel,
  color,
  trackColor,
  height = 10,
  animated = true,
  style,
}: ProgressBarProps) {
  const t = useTheme();
  const barColor = color ?? t.primary;
  const track = trackColor ?? t.outlineVariant;
  const clampedProgress = Math.min(1, Math.max(0, progress));

  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(widthAnim, {
        toValue: clampedProgress,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      widthAnim.setValue(clampedProgress);
    }
  }, [clampedProgress, animated]);

  const pct = Math.round(clampedProgress * 100);

  return (
    <View style={[style]}>
      {(label || valueLabel) && (
        <View style={styles.progressLabelRow}>
          {label && <Text style={[styles.progressLabel, { color: t.onSurfaceVariant }]}>{label}</Text>}
          {valueLabel && <Text style={[styles.progressValue, { color: barColor }]}>{valueLabel}</Text>}
        </View>
      )}
      <View style={[styles.progressTrack, { backgroundColor: track, height, borderRadius: height / 2 }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: barColor,
              height,
              borderRadius: height / 2,
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
        {/* River wave highlight */}
        <Animated.View
          style={[
            styles.progressShine,
            {
              height: height * 0.4,
              top: height * 0.1,
              borderRadius: height / 2,
              left: 4,
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '80%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={[styles.progressPct, { color: t.onSurfaceVariant }]}>{pct}%</Text>
    </View>
  );
}

// ── 2. Animated Number Counter ────────────────────────────────
interface CounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  style?: object;
  textStyle?: object;
}

export function AnimatedCounter({
  value,
  prefix = '₹',
  suffix = '',
  decimals = 0,
  duration = 1000,
  style,
  textStyle,
}: CounterProps) {
  const t = useTheme();
  const animValue = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = React.useState('0');

  useEffect(() => {
    const id = animValue.addListener(({ value: v }) => {
      setDisplay(v.toFixed(decimals));
    });
    Animated.timing(animValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => animValue.removeListener(id);
  }, [value]);

  return (
    <View style={style}>
      <Text style={[{ fontSize: 28, fontWeight: '900', color: t.onSurface }, textStyle]}>
        {prefix}{display}{suffix}
      </Text>
    </View>
  );
}

// ── 3. Shimmer Skeleton ───────────────────────────────────────
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const t = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const bgColor = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [t.surfaceVariant, t.outlineVariant],
  });

  return (
    <Animated.View
      style={[{ width: width as number, height, borderRadius, backgroundColor: bgColor }, style]}
    />
  );
}

// ── 4. Settlement Progress Card ───────────────────────────────
interface SettlementProgressProps {
  paid: number;
  total: number;
  label?: string;
}

export function SettlementProgressCard({ paid, total, label }: SettlementProgressProps) {
  const t = useTheme();
  const progress = total > 0 ? paid / total : 0;
  const remaining = total - paid;

  return (
    <View style={[styles.spCard, { backgroundColor: t.surface }]}>
      <View style={styles.spTop}>
        <View>
          <Text style={[styles.spLabel, { color: t.onSurfaceVariant }]}>{label ?? 'Budget Progress'}</Text>
          <Text style={[styles.spMain, { color: t.onSurface }]}>
            ₹{paid.toLocaleString('en-IN')}
            <Text style={[styles.spSub, { color: t.onSurfaceVariant }]}> / ₹{total.toLocaleString('en-IN')}</Text>
          </Text>
        </View>
        <View style={[styles.spBadge, { backgroundColor: progress > 0.8 ? t.errorContainer : t.primaryContainer }]}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: progress > 0.8 ? t.error : t.primary }}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      </View>
      <ProgressBar
        progress={progress}
        color={progress > 0.9 ? t.error : progress > 0.7 ? t.secondary : t.primary}
        height={12}
        style={{ marginTop: 10 }}
      />
      <Text style={[styles.spRemaining, { color: t.onSurfaceVariant }]}>
        ₹{remaining.toLocaleString('en-IN')} remaining
      </Text>
    </View>
  );
}

// ── 5. Stat Card with animation ───────────────────────────────
export function AnimatedStatCard({ value, label, emoji, color, bg }: {
  value: number; label: string; emoji: string; color: string; bg: string;
}) {
  const t = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.statCard, { backgroundColor: bg, transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      <Text style={{ fontSize: 28 }}>{emoji}</Text>
      <AnimatedCounter value={value} textStyle={{ fontSize: 22, color }} />
      <Text style={{ fontSize: 12, color, opacity: 0.75, fontWeight: '600' }}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, fontWeight: '600' },
  progressValue: { fontSize: 12, fontWeight: '800' },
  progressTrack: { overflow: 'hidden', position: 'relative' },
  progressFill: { position: 'absolute', left: 0, top: 0 },
  progressShine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.35)' },
  progressPct: { fontSize: 11, marginTop: 4, textAlign: 'right' },
  spCard: { borderRadius: 20, padding: 16, elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  spTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  spLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  spMain: { fontSize: 22, fontWeight: '900' },
  spSub: { fontSize: 14, fontWeight: '400' },
  spBadge: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  spRemaining: { fontSize: 12, marginTop: 6 },
  statCard: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center', gap: 4, elevation: 3, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
});
