import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { wordsApi, WordResponse } from '../../src/api/words';
import { colors, spacing, radius } from '../../src/theme';

interface QuizQuestion {
  wordId: string;
  term: string;
  options: string[];
  correctIndex: number;
}

interface QuizResult {
  wordId: string;
  term: string;
  correct: boolean;
}

function getDueWords(words: WordResponse[]): WordResponse[] {
  const now = new Date();
  return words.filter((w) => new Date(w.next_review_date) <= now);
}

function buildQuestions(dueWords: WordResponse[], allWords: WordResponse[]): QuizQuestion[] {
  return dueWords
    .filter((w) => w.definition)
    .map((word) => {
      const distractors = allWords
        .filter((w) => w.id !== word.id && w.definition)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.definition as string);

      const correctDef = word.definition as string;
      const allOptions = [...distractors, correctDef].sort(() => Math.random() - 0.5);
      const correctIndex = allOptions.indexOf(correctDef);

      return {
        wordId: word.id,
        term: word.term,
        options: allOptions,
        correctIndex,
      };
    });
}

export default function QuizScreen() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [dueCount, setDueCount] = useState(0);

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const page = await wordsApi.getAll(0, 200);
      const all = page.content;
      const due = getDueWords(all);
      setDueCount(due.length);

      // Need at least 4 words total for distractors, and at least 1 due word with a definition
      const qs = all.length >= 4 ? buildQuestions(due, all) : [];
      setQuestions(qs);
      setCurrentQ(0);
      setSelected(null);
      setResults([]);
      setFinished(false);
      setAnswered(false);
    } catch {
      // errors handled globally by axios interceptor (toast)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuiz();
  }, [loadQuiz]);

  const handleSelect = async (index: number) => {
    if (answered || questions.length === 0) return;
    const q = questions[currentQ];
    const correct = index === q.correctIndex;
    setSelected(index);
    setAnswered(true);
    setResults((prev) => [...prev, { wordId: q.wordId, term: q.term, correct }]);
    try {
      await wordsApi.review(q.wordId, correct);
    } catch {
      // review errors are handled globally
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
    }
  };

  const getOptionStyle = (index: number) => {
    if (!answered) return {};
    const q = questions[currentQ];
    if (index === q.correctIndex) {
      return { borderColor: colors.success, backgroundColor: colors.successLight };
    }
    if (index === selected && index !== q.correctIndex) {
      return { borderColor: colors.danger, backgroundColor: colors.dangerLight };
    }
    return {};
  };

  const getCircleStyle = (index: number) => {
    if (!answered) return {};
    const q = questions[currentQ];
    if (index === q.correctIndex) {
      return { borderColor: colors.success, backgroundColor: colors.success };
    }
    if (index === selected && index !== q.correctIndex) {
      return { borderColor: colors.danger, backgroundColor: colors.danger };
    }
    return {};
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

  if (questions.length === 0) {
    const isEmpty = dueCount === 0;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name={isEmpty ? 'checkmark-done-circle-outline' : 'library-outline'}
              size={48}
              color={isEmpty ? colors.success : colors.textTertiary}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {isEmpty ? 'All caught up!' : 'Not enough words'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isEmpty
              ? 'No words are due for review right now. Come back later.'
              : 'Add at least 4 words with definitions to start a quiz.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Results screen
  if (finished) {
    const score = results.filter((r) => r.correct).length;
    const total = results.length;
    const pct = Math.round((score / total) * 100);

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Results</Text>
          </View>

          <View style={styles.resultsSummary}>
            <Text style={styles.resultsScore}>{score}/{total}</Text>
            <Text style={styles.resultsPct}>{pct}% correct</Text>
            <View
              style={[
                styles.resultsBadge,
                { backgroundColor: pct >= 70 ? colors.successLight : colors.warningLight },
              ]}
            >
              <Text
                style={[
                  styles.resultsBadgeText,
                  { color: pct >= 70 ? colors.success : colors.warning },
                ]}
              >
                {pct >= 90 ? 'Excellent!' : pct >= 70 ? 'Good job!' : 'Keep practicing'}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Review breakdown</Text>
          {results.map((r, i) => (
            <View key={i} style={styles.resultRow}>
              <Ionicons
                name={r.correct ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={r.correct ? colors.success : colors.danger}
              />
              <Text style={styles.resultTerm}>{r.term}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.nextButton} onPress={loadQuiz}>
            <Text style={styles.nextButtonText}>New session</Text>
            <Ionicons name="refresh" size={18} color={colors.textInverse} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const question = questions[currentQ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Quiz</Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>
              {results.filter((r) => r.correct).length}/{results.length > 0 ? results.length : 0}
            </Text>
          </View>
        </View>

        <Text style={styles.counter}>
          Question {currentQ + 1} of {questions.length}
        </Text>

        {/* Progress */}
        <View style={styles.progressTrack}>
          {questions.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                {
                  backgroundColor:
                    i < currentQ
                      ? results[i]?.correct
                        ? colors.success
                        : colors.danger
                      : i === currentQ
                      ? colors.primary
                      : colors.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Question */}
        <View style={styles.questionArea}>
          <Text style={styles.questionLabel}>What does this word mean?</Text>
          <Text style={styles.questionWord}>{question.term}</Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {question.options.map((option, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.option, getOptionStyle(i)]}
              onPress={() => handleSelect(i)}
              activeOpacity={0.8}
              disabled={answered}
            >
              <View style={[styles.optionCircle, getCircleStyle(i)]}>
                <Text
                  style={[
                    styles.optionLetter,
                    answered &&
                      (i === question.correctIndex || i === selected) && {
                        color: colors.textInverse,
                      },
                  ]}
                >
                  {String.fromCharCode(65 + i)}
                </Text>
              </View>
              <Text style={styles.optionText}>{option}</Text>
              {answered && i === question.correctIndex && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.success}
                  style={{ marginLeft: 'auto' }}
                />
              )}
              {answered && i === selected && i !== question.correctIndex && (
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.danger}
                  style={{ marginLeft: 'auto' }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Next button */}
        {answered && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentQ < questions.length - 1 ? 'Next question' : 'See results'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
          </TouchableOpacity>
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
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
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
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  scoreBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  counter: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.xxxl,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  questionArea: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  questionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  questionWord: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.borderHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetter: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  optionText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.lg,
    marginTop: spacing.xxl,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  // Results screen
  resultsSummary: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  resultsScore: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1,
  },
  resultsPct: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  resultsBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  resultsBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  },
});
