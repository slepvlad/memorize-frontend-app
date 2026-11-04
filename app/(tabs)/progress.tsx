import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { statsApi, StatsSummary } from '../../src/api/stats';
import { Button } from '../../src/components/ui/Button';
import { colors, spacing, radius } from '../../src/theme';

const STAT_COLORS = [colors.success, colors.warning, colors.info, colors.purple];
const MASTERY_COLORS = [colors.primary, colors.warning, colors.borderHover];

function percentOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export default function ProgressScreen() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await statsApi.getSummary());
      setFailed(false);
    } catch {
      // The interceptor skips the toast for this endpoint — show the inline error instead.
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch on every focus so numbers reflect reviews done on other tabs.
  useFocusEffect(
    useCallback(() => {
      void loadSummary();
    }, [loadSummary])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSummary();
    setRefreshing(false);
  }, [loadSummary]);

  const handleRetry = useCallback(() => {
    setLoading(true);
    void loadSummary();
  }, [loadSummary]);

  if (loading && !summary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const stats = summary
    ? [
        { key: 'totalPhrases', value: String(summary.totalPhrases) },
        { key: 'dueNow', value: String(summary.dueNow) },
        { key: 'dueToday', value: String(summary.dueToday) },
        { key: 'averageEasiness', value: summary.averageEasiness.toFixed(2) },
      ]
    : [];

  const mastery = summary
    ? [
        { key: 'mastered', count: summary.maturePhrases },
        { key: 'learning', count: summary.learningPhrases },
        { key: 'wordNew', count: summary.newPhrases },
      ]
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        <Text style={styles.title}>{t('yourProgress')}</Text>

        {failed ? (
          <View style={styles.errorCard}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.danger} />
            <Text style={styles.errorText}>{t('statsLoadError')}</Text>
            <Button title={t('tryAgain')} onPress={handleRetry} variant="secondary" loading={loading} />
          </View>
        ) : (
          <>
            {/* Stat Grid */}
            <View style={styles.statGrid}>
              {stats.map((stat, i) => (
                <View key={stat.key} style={styles.statCard}>
                  <Text style={[styles.statValue, { color: STAT_COLORS[i] }]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{t(stat.key)}</Text>
                </View>
              ))}
            </View>

            {/* Mastery */}
            <Text style={styles.sectionTitle}>{t('masteryBreakdown')}</Text>
            {mastery.map((item, i) => {
              const percent = percentOf(item.count, summary!.totalPhrases);
              return (
                <View key={item.key} style={styles.masteryRow}>
                  <Text style={styles.masteryLabel}>{t(item.key)}</Text>
                  <View style={styles.masteryTrack}>
                    <View
                      style={[
                        styles.masteryFill,
                        { width: `${percent}%`, backgroundColor: MASTERY_COLORS[i] },
                      ]}
                    />
                  </View>
                  <Text style={styles.masteryPercent}>{percent}%</Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
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
