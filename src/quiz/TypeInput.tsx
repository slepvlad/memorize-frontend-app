import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius } from '../theme';
import { TypeQuestion } from './types';

interface Props {
  question: TypeQuestion;
  answered: boolean;
  typedAnswer: string;
  onChangeText: (s: string) => void;
  onSubmit: () => void;
  isCorrect: boolean | null;
}

export default function TypeInput({ question, answered, typedAnswer, onChangeText, onSubmit, isCorrect }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <View style={styles.questionArea}>
        <Text style={styles.questionLabel}>{t('typePhraseLabel')}</Text>
        <Text style={styles.exampleQuote}>{`"${question.exampleTranslation}"`}</Text>
      </View>

      <TextInput
        style={[
          styles.typeInput,
          answered && {
            borderColor: isCorrect ? colors.success : colors.danger,
            backgroundColor: isCorrect ? colors.successLight : colors.dangerLight,
          },
        ]}
        value={typedAnswer}
        onChangeText={onChangeText}
        placeholder={t('typeAnswerPlaceholder')}
        placeholderTextColor={colors.textTertiary}
        editable={!answered}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        autoCapitalize="none"
        autoCorrect={false}
        underlineColorAndroid="transparent"
      />

      {answered && !isCorrect && (
        <View style={styles.correctAnswerBox}>
          <Text style={styles.correctAnswerLabel}>{t('correctAnswerLabel')}</Text>
          <Text style={styles.correctAnswerText}>{question.correctAnswer}</Text>
        </View>
      )}

      {!answered && (
        <TouchableOpacity
          style={[styles.checkButton, !typedAnswer.trim() && styles.checkButtonDisabled]}
          onPress={onSubmit}
          disabled={!typedAnswer.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.checkButtonText}>{t('checkAnswer')}</Text>
          <Ionicons name="checkmark" size={18} color={colors.textInverse} />
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  questionArea: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  questionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  exampleQuote: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 28,
    paddingHorizontal: spacing.md,
  },
  typeInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + spacing.sm,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  checkButtonDisabled: {
    backgroundColor: colors.borderHover,
  },
  checkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  correctAnswerBox: {
    padding: spacing.lg,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  correctAnswerLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  correctAnswerText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
