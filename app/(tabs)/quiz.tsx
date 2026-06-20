import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius } from '../../src/theme';
import { useQuizSession } from '../../src/quiz/useQuizSession';
import SelectOptions from '../../src/quiz/SelectOptions';
import TypeInput from '../../src/quiz/TypeInput';
import QuizResults from '../../src/quiz/QuizResults';

export default function QuizScreen() {
  const { phraseIds } = useLocalSearchParams<{ phraseIds?: string }>();
  const { t } = useTranslation();
  const {
    loading,
    refreshing,
    questions,
    currentQ,
    selected,
    answered,
    typedAnswer,
    setTypedAnswer,
    results,
    finished,
    dueCount,
    isLearnSession,
    handleNewSession,
    handleRefresh,
    handleSelect,
    handleSubmitType,
    handleNext,
  } = useQuizSession(phraseIds);

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
    const isEmpty = !isLearnSession && dueCount === 0;
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.centeredContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          <View style={styles.centered}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={isEmpty ? 'checkmark-done-circle-outline' : 'library-outline'}
                size={48}
                color={isEmpty ? colors.success : colors.textTertiary}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {isEmpty ? t('allCaughtUp') : t('notEnoughPhrases')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isEmpty ? t('nothingDue') : t('addFourPhrases')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (finished) {
    return <QuizResults results={results} onNewSession={handleNewSession} refreshing={refreshing} onRefresh={handleRefresh} />;
  }

  const question = questions[currentQ];
  const lastResult = answered ? results[results.length - 1] : null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>{t('quizTitle')}</Text>
              {isLearnSession && (
                <View style={styles.sessionBadge}>
                  <Text style={styles.sessionBadgeText}>{t('fromLearn')}</Text>
                </View>
              )}
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>
                {results.filter((r) => r.correct).length}/{results.length > 0 ? results.length : 0}
              </Text>
            </View>
          </View>

          <Text style={styles.counter}>
            {t('questionCounter', { current: currentQ + 1, total: questions.length })}
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
          {question.type === 'select' ? (
            <SelectOptions
              question={question}
              selected={selected}
              answered={answered}
              onSelect={handleSelect}
            />
          ) : (
            <TypeInput
              question={question}
              answered={answered}
              typedAnswer={typedAnswer}
              onChangeText={setTypedAnswer}
              onSubmit={handleSubmitType}
              isCorrect={lastResult?.correct ?? null}
            />
          )}

          {/* Next button */}
          {answered && (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {currentQ < questions.length - 1 ? t('nextQuestion') : t('seeResults')}
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
  },
  sessionBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  sessionBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
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
