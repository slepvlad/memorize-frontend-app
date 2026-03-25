import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../../src/theme';

const sampleCards = [
  {
    word: 'Serendipity',
    type: 'Noun',
    pronunciation: '/ˌser.ənˈdɪp.ə.t̬i/',
    definition: 'The occurrence of events by chance in a happy way',
    example: '"It was pure serendipity that we met at the café."',
  },
  {
    word: 'Ephemeral',
    type: 'Adjective',
    pronunciation: '/ɪˈfem.ər.əl/',
    definition: 'Lasting for a very short time',
    example: '"The ephemeral beauty of cherry blossoms."',
  },
  {
    word: 'Eloquent',
    type: 'Adjective',
    pronunciation: '/ˈel.ə.kwənt/',
    definition: 'Fluent or persuasive in speaking or writing',
    example: '"She gave an eloquent speech at the ceremony."',
  },
];

export default function LearnScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const card = sampleCards[currentIndex];
  const progress = (currentIndex + 1) / sampleCards.length;

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleNext = (_difficulty: string) => {
    setIsFlipped(false);
    if (currentIndex < sampleCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Learn</Text>
          <Text style={styles.counter}>
            {currentIndex + 1} of {sampleCards.length}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          {sampleCards.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                {
                  backgroundColor:
                    i <= currentIndex ? colors.primary : colors.border,
                },
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
                <Text style={[styles.pillText, { color: colors.info }]}>{card.type}</Text>
              </View>
              <Text style={styles.wordText}>{card.word}</Text>
              <Text style={styles.pronunciation}>{card.pronunciation}</Text>
              <Text style={styles.flipHint}>Tap to reveal meaning</Text>
            </View>
          ) : (
            <View style={styles.cardBack}>
              <View style={[styles.pill, { backgroundColor: colors.successLight }]}>
                <Text style={[styles.pillText, { color: colors.success }]}>Definition</Text>
              </View>
              <Text style={styles.definition}>{card.definition}</Text>
              <View style={styles.exampleBox}>
                <Text style={styles.exampleText}>{card.example}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Difficulty buttons */}
        <View style={styles.difficultyRow}>
          <TouchableOpacity
            style={styles.diffButton}
            onPress={() => handleNext('hard')}
          >
            <Text style={[styles.diffText, { color: colors.danger }]}>Hard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.diffButton}
            onPress={() => handleNext('good')}
          >
            <Text style={[styles.diffText, { color: colors.warning }]}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.diffButton}
            onPress={() => handleNext('easy')}
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
  },
  pronunciation: {
    fontSize: 14,
    color: colors.textTertiary,
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
  exampleBox: {
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 8,
  },
  exampleText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
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
