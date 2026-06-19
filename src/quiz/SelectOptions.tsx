import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius } from '../theme';
import { SelectQuestion } from './types';

interface Props {
  question: SelectQuestion;
  selected: number | null;
  answered: boolean;
  onSelect: (index: number) => void;
}

export default function SelectOptions({ question, selected, answered, onSelect }: Props) {
  const { t } = useTranslation();

  const getOptionStyle = (index: number) => {
    if (!answered) return {};
    if (index === question.correctIndex) {
      return { borderColor: colors.success, backgroundColor: colors.successLight };
    }
    if (index === selected && index !== question.correctIndex) {
      return { borderColor: colors.danger, backgroundColor: colors.dangerLight };
    }
    return {};
  };

  const getCircleStyle = (index: number) => {
    if (!answered) return {};
    if (index === question.correctIndex) {
      return { borderColor: colors.success, backgroundColor: colors.success };
    }
    if (index === selected && index !== question.correctIndex) {
      return { borderColor: colors.danger, backgroundColor: colors.danger };
    }
    return {};
  };

  return (
    <>
      <View style={styles.questionArea}>
        <Text style={styles.questionLabel}>{t('whatDoesThisMean')}</Text>
        <Text style={styles.questionWord}>{question.question}</Text>
      </View>

      <View style={styles.options}>
        {question.options.map((option, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.option, getOptionStyle(i)]}
            onPress={() => onSelect(i)}
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
});
