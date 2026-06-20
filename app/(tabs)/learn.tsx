import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { phrasesApi, PhraseResponse } from '../../src/api/phrases';
import { colors, spacing, radius } from '../../src/theme';

function getDuePhrases(phrases: PhraseResponse[]): PhraseResponse[] {
  const now = new Date();
  return phrases.filter((p) => new Date(p.next_review_date) <= now);
}

export default function LearnScreen() {
  const [phrases, setPhrases] = useState<PhraseResponse[]>([]);
  const [allPhrasesCount, setAllPhrasesCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [finished, setFinished] = useState(false);
  const { t } = useTranslation();

  const loadPhrases = useCallback(async () => {
    setLoading(true);
    try {
      const page = await phrasesApi.getAll(0, 100);
      const all = page.content;
      const due = getDuePhrases(all);
      setAllPhrasesCount(all.length);
      setPhrases(due);
      setCurrentIndex(0);
      setIsFlipped(false);
      setFinished(false);
    } catch {
      // error handled globally by axios interceptor (toast)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPhrases();
  }, [loadPhrases]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPhrases();
    setRefreshing(false);
  }, [loadPhrases]);

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleNext = () => {
    if (phrases.length === 0) return;
    setIsFlipped(false);
    if (currentIndex < phrases.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setFinished(true);
    }
  };

  const handleStartQuiz = () => {
    const ids = phrases.map((p) => p.id).join(',');
    router.push({ pathname: '/(tabs)/quiz', params: { phraseIds: ids } });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const refreshControl = (
    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
  );

  if (allPhrasesCount === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.centeredContent} refreshControl={refreshControl}>
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>{t('noPhrasesTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('noPhrasesHint')}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phrases.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.centeredContent} refreshControl={refreshControl}>
          <View style={styles.centered}>
            <View style={styles.completionIcon}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.success} />
            </View>
            <Text style={styles.emptyTitle}>{t('allCaughtUp')}</Text>
            <Text style={styles.emptySubtitle}>{t('nothingDue')}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (finished) {
    const canQuiz = allPhrasesCount >= 4;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.completionIcon}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>
          <Text style={styles.completionTitle}>{t('sessionComplete')}</Text>
          <Text style={styles.completionSubtitle}>
            {t('reviewedCount', { count: phrases.length })}
          </Text>

          {canQuiz ? (
            <TouchableOpacity style={styles.quizButton} onPress={handleStartQuiz}>
              <Ionicons name="help-circle-outline" size={20} color={colors.textInverse} />
              <Text style={styles.quizButtonText}>{t('quizThesePhrases')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.quizDisabled}>
              <Text style={styles.quizDisabledText}>{t('addMoreForQuiz')}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.restartButton} onPress={loadPhrases}>
            <Ionicons name="refresh" size={18} color={colors.primary} />
            <Text style={styles.restartButtonText}>{t('studyAgain')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const phrase = phrases[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('learnTitle')}</Text>
          <Text style={styles.counter}>
            {currentIndex + 1} of {phrases.length}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          {phrases.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                { backgroundColor: i <= currentIndex ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>

        {/* Flashcard */}
        <TouchableOpacity
          style={styles.card}
          onPress={handleFlip}
          activeOpacity={0.95}
        >
          {!isFlipped ? (
            <View style={styles.cardFront}>
              <View style={[styles.pill, { backgroundColor: colors.infoLight }]}>
                <Text style={[styles.pillText, { color: colors.info }]}>{t('phrase')}</Text>
              </View>
              <Text style={styles.wordText}>{phrase.originalWord}</Text>
              <Text style={styles.flipHint}>{t('tapToReveal')}</Text>
            </View>
          ) : (
            <View style={styles.cardBack}>
              <View style={[styles.pill, { backgroundColor: colors.successLight }]}>
                <Text style={[styles.pillText, { color: colors.success }]}>{t('translation')}</Text>
              </View>
              <Text style={styles.definition}>{phrase.translatedWord}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Navigation buttons */}
        <View style={styles.difficultyRow}>
          <TouchableOpacity style={styles.diffButton} onPress={handleNext}>
            <Text style={[styles.diffText, { color: colors.danger }]}>{t('hard')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.diffButton} onPress={handleNext}>
            <Text style={[styles.diffText, { color: colors.warning }]}>{t('good')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.diffButton} onPress={handleNext}>
            <Text style={[styles.diffText, { color: colors.success }]}>{t('easy')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredContent: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  counter: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.xxl,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  card: {
    flex: 1,
    maxHeight: 380,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFront: {
    alignItems: 'center',
    gap: 12,
  },
  cardBack: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  wordText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: 8,
    textAlign: 'center',
  },
  flipHint: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 24,
  },
  definition: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 26,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  diffButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  diffText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completionIcon: {
    marginBottom: spacing.lg,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  completionSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: radius.lg,
    width: '100%',
    marginBottom: spacing.md,
  },
  quizButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  quizDisabled: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  quizDisabledText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  restartButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.primary,
  },
});
