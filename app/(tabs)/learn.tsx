import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { wordsApi, WordResponse } from '../../src/api/words';
import { colors, spacing, radius } from '../../src/theme';

export default function LearnScreen() {
  const [words, setWords] = useState<WordResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  const loadWords = useCallback(async () => {
    setLoading(true);
    try {
      const page = await wordsApi.getAll(0, 100);
      setWords(page.content);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch {
      // error handled globally by axios interceptor (toast)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWords();
  }, [loadWords]);

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleReview = async (correct: boolean) => {
    if (reviewing || words.length === 0) return;
    const card = words[currentIndex];
    setReviewing(true);
    try {
      await wordsApi.review(card.id, correct);
    } finally {
      setReviewing(false);
      setIsFlipped(false);
      setCurrentIndex((prev) => (prev < words.length - 1 ? prev + 1 : 0));
    }
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

  if (words.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No words yet</Text>
          <Text style={styles.emptySubtitle}>Add words from the Home tab to start learning.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const card = words[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Learn</Text>
          <Text style={styles.counter}>
            {currentIndex + 1} of {words.length}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          {words.map((_, i) => (
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
                <Text style={[styles.pillText, { color: colors.info }]}>Term</Text>
              </View>
              <Text style={styles.wordText}>{card.term}</Text>
              <Text style={styles.flipHint}>Tap to reveal definition</Text>
            </View>
          ) : (
            <View style={styles.cardBack}>
              <View style={[styles.pill, { backgroundColor: colors.successLight }]}>
                <Text style={[styles.pillText, { color: colors.success }]}>Definition</Text>
              </View>
              <Text style={styles.definition}>
                {card.definition || 'No definition provided.'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Difficulty buttons */}
        <View style={styles.difficultyRow}>
          <TouchableOpacity
            style={styles.diffButton}
            onPress={() => handleReview(false)}
            disabled={reviewing}
          >
            <Text style={[styles.diffText, { color: colors.danger }]}>Hard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.diffButton}
            onPress={() => handleReview(true)}
            disabled={reviewing}
          >
            <Text style={[styles.diffText, { color: colors.warning }]}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.diffButton}
            onPress={() => handleReview(true)}
            disabled={reviewing}
          >
            <Text style={[styles.diffText, { color: colors.success }]}>Easy</Text>
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
});
