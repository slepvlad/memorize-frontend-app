import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius } from '../../src/theme';

const STAT_KEYS = ['wordsLearned', 'dayStreak', 'quizAccuracy', 'xpEarned'] as const;
const STAT_VALUES = ['248', '12', '86%', '1,240'];
const STAT_COLORS = [colors.success, colors.warning, colors.info, colors.purple];

const weekData = [
  { day: 'Mon', value: 65 },
  { day: 'Tue', value: 80 },
  { day: 'Wed', value: 45 },
  { day: 'Thu', value: 90 },
  { day: 'Fri', value: 70 },
  { day: 'Sat', value: 30 },
  { day: 'Sun', value: 50 },
];

const MASTERY_KEYS = ['mastered', 'learning', 'wordNew'] as const;
const MASTERY_PERCENTS = [45, 35, 20];
const MASTERY_COLORS = [colors.primary, colors.warning, colors.borderHover];

export default function ProgressScreen() {
  const { t } = useTranslation();
  const todayIndex = 3; // Thursday

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('yourProgress')}</Text>

        {/* Stat Grid */}
        <View style={styles.statGrid}>
          {STAT_KEYS.map((key, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={[styles.statValue, { color: STAT_COLORS[i] }]}>
                {STAT_VALUES[i]}
              </Text>
              <Text style={styles.statLabel}>{t(key)}</Text>
            </View>
          ))}
        </View>

        {/* Weekly Chart */}
        <Text style={styles.sectionTitle}>{t('thisWeek')}</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartBars}>
            {weekData.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${d.value}%`,
                        backgroundColor:
                          i === todayIndex ? colors.primary : colors.border,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.barLabel,
                    i === todayIndex && {
                      color: colors.primary,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {d.day}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Mastery */}
        <Text style={styles.sectionTitle}>{t('masteryBreakdown')}</Text>
        {MASTERY_KEYS.map((key, i) => (
          <View key={i} style={styles.masteryRow}>
            <Text style={styles.masteryLabel}>{t(key)}</Text>
            <View style={styles.masteryTrack}>
              <View
                style={[
                  styles.masteryFill,
                  {
                    width: `${MASTERY_PERCENTS[i]}%`,
                    backgroundColor: MASTERY_COLORS[i],
                  },
                ]}
              />
            </View>
            <Text style={styles.masteryPercent}>{MASTERY_PERCENTS[i]}%</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.3,
    marginBottom: spacing.xxl,
    marginTop: spacing.sm,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: spacing.xxl,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: spacing.xxl,
  },
  chartBars: {
    flexDirection: 'row',
    height: 120,
    alignItems: 'flex-end',
    gap: 6,
  },
  barCol: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    gap: 6,
  },
  bar: {
    width: 24,
    borderRadius: 6,
    minHeight: 8,
  },
  barLabel: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  masteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  masteryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    width: 70,
  },
  masteryTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  masteryFill: {
    height: '100%',
    borderRadius: 4,
  },
  masteryPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    width: 36,
    textAlign: 'right',
  },
});
