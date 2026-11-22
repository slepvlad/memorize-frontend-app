import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius, typography } from '../theme';
import { QuizResult } from './types';

interface Props {
  results: QuizResult[];
  onNewSession: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export default function QuizResults({ results, onNewSession, refreshing = false, onRefresh }: Props) {
  const { t } = useTranslation();
  const score = results.filter((r) => r.correct).length;
  const total = results.length;
  const pct = Math.round((score / total) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          ) : undefined
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('resultsTitle')}</Text>
        </View>

        <View style={styles.summary}>
          <Text style={styles.score}>{score}/{total}</Text>
          <Text style={styles.pct}>{t('scorePercent', { pct })}</Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: pct >= 70 ? colors.successLight : colors.warningLight },
            ]}
          >
            <Text
              style={[styles.badgeText, { color: pct >= 70 ? colors.success : colors.warning }]}
            >
              {pct >= 90 ? t('excellent') : pct >= 70 ? t('goodJob') : t('keepPracticing')}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t('reviewBreakdown')}</Text>
        {results.map((r, i) => (
          <View key={i} style={styles.resultRow}>
            <Ionicons
              name={r.correct ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={r.correct ? colors.success : colors.danger}
            />
            <Text style={styles.resultTerm}>{r.question}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.newSessionButton} onPress={onNewSession}>
          <Text style={styles.newSessionText}>{t('newSession')}</Text>
          <Ionicons name="refresh" size={18} color={colors.textInverse} />
        </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  summary: {
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  score: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: -1.5,
  },
  pct: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultTerm: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  newSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.full,
    marginTop: spacing.xxl,
  },
  newSessionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
