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

function buildQuestions(words: WordResponse[]): QuizQuestion[] {
  if (words.length < 4) return [];

  return words.map((word) => {
    const distractors = words
      .filter((w) => w.id !== word.id && w.definition)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.definition as string);

    const correctDef = word.definition || word.term;
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
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const page = await wordsApi.getAll(0, 100);
      const qs = buildQuestions(page.content);
      setQuestions(qs);
      setCurrentQ(0);
      setSelected(null);
      setScore(0);
      setAnswered(false);
    } catch {
      // error handled globally by axios interceptor (toast)
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
    if (correct) setScore((s) => s + 1);
    try {
      await wordsApi.review(q.wordId, correct);
    } catch {
      // review errors are handled globally by the axios interceptor
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      void loadQuiz();
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
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Not enough words</Text>
          <Text style={styles.emptySubtitle}>Add at least 4 words with definitions to start a quiz.</Text>
        </View>
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
              {score}/{currentQ + (answered ? 1 : 0)}
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
                      ? colors.success
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
              {currentQ < questions.length - 1 ? 'Next question' : 'Restart quiz'}
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
});
