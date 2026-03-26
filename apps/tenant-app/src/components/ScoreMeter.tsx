import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';
import { colors } from '../../constants/design';
import { ScoreTier } from '@kiraaya/types';
import { TIER_COLORS, TIER_LABELS, NEXT_MILESTONE } from '@kiraaya/score-engine';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreMeterProps {
  score: number;
  tier: ScoreTier;
  streakMonths: number;
  onTimePayments: number;
  totalPayments: number;
  language?: 'en' | 'hi';
}

const SIZE = 220;
const STROKE_WIDTH = 18;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const MIN_SCORE = 300;
const MAX_SCORE = 900;

export default function ScoreMeter({
  score,
  tier,
  streakMonths,
  onTimePayments,
  totalPayments,
  language = 'en',
}: ScoreMeterProps) {
  const progress = useSharedValue(0);
  const [displayScore, setDisplayScore] = React.useState(MIN_SCORE);

  React.useEffect(() => {
    const targetProgress = (score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE);

    // Animate score number counting up
    const duration = 800;
    const startTime = Date.now();
    const startScore = MIN_SCORE;
    const endScore = score;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const fraction = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - fraction, 3); // ease-out cubic
      setDisplayScore(Math.round(startScore + (endScore - startScore) * eased));
      if (fraction >= 1) clearInterval(interval);
    }, 16);

    progress.value = withTiming(targetProgress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });

    return () => clearInterval(interval);
  }, [score]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress.value);
    return { strokeDashoffset };
  });

  const tierColor = TIER_COLORS[tier];
  const tierLabel = TIER_LABELS[tier][language];
  const nextMilestone = NEXT_MILESTONE[tier];
  const consistencyPct = totalPayments > 0
    ? Math.round((onTimePayments / totalPayments) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* SVG Arc Meter */}
      <View style={styles.svgContainer}>
        <Svg width={SIZE} height={SIZE}>
          <G rotation="-90" origin={`${SIZE / 2}, ${SIZE / 2}`}>
            {/* Track circle */}
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke="rgba(0,0,0,0.06)"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Progress arc */}
            <AnimatedCircle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={tierColor}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              animatedProps={animatedProps}
              strokeLinecap="round"
            />
          </G>
        </Svg>

        {/* Score in centre */}
        <View style={styles.scoreCenter}>
          <Text style={[styles.scoreNumber, { color: tierColor }]}>{displayScore}</Text>
          <Text style={[styles.tierLabel, { color: tierColor }]}>{tierLabel}</Text>
        </View>
      </View>

      {/* Streak counter — PRD §8.2: primary emotional hook */}
      <View style={styles.streakRow}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <Text style={styles.streakText}>
          {streakMonths} {language === 'hi' ? 'महीने समय पर' : 'months paid on time in a row'}
        </Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{consistencyPct}%</Text>
          <Text style={styles.statLabel}>
            {language === 'hi' ? 'समय पर' : 'On-time'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{onTimePayments}</Text>
          <Text style={styles.statLabel}>
            {language === 'hi' ? 'भुगतान' : 'Payments'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round((score - MIN_SCORE) / ((MAX_SCORE - MIN_SCORE) / 100))}%</Text>
          <Text style={styles.statLabel}>
            {language === 'hi' ? 'प्रगति' : 'Progress'}
          </Text>
        </View>
      </View>

      {/* Next milestone */}
      {tier !== 'prime' && (
        <View style={[styles.milestoneCard, { borderColor: tierColor + '33' }]}>
          <Text style={styles.milestoneText}>
            {language === 'hi'
              ? `${nextMilestone.threshold - score} अंक और — ${nextMilestone.label} बनें`
              : `${nextMilestone.threshold - score} points to reach ${nextMilestone.label}`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  svgContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 56,
  },
  tierLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  streakEmoji: {
    fontSize: 20,
  },
  streakText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 24,
    gap: 0,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 11,
    color: '#9A9A9A',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  milestoneCard: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  milestoneText: {
    fontSize: 13,
    color: '#5A5A5A',
    fontWeight: '500',
  },
});
