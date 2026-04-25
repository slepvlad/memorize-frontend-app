import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage, SUPPORTED_LANGUAGES, Language } from '../../src/context/LanguageContext';
import { colors, spacing, radius, typography } from '../../src/theme';

export default function LanguageSetupScreen() {
  const router = useRouter();
  const { nativeLanguage: savedNative, studiedLanguage: savedStudied, isConfigured, setLanguages } = useLanguage();

  const [nativeLanguage, setNativeLanguage] = useState<Language | null>(savedNative);
  const [studiedLanguage, setStudiedLanguage] = useState<Language | null>(savedStudied);
  const [saving, setSaving] = useState(false);

  const canSave =
    nativeLanguage !== null &&
    studiedLanguage !== null &&
    nativeLanguage !== studiedLanguage;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    await setLanguages({ nativeLanguage: nativeLanguage!, studiedLanguage: studiedLanguage! });
    if (isConfigured && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {isConfigured && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}

        <View style={styles.iconBox}>
          <Ionicons name="language-outline" size={36} color={colors.textInverse} />
        </View>

        <Text style={styles.title}>Choose your languages</Text>
        <Text style={styles.subtitle}>
          This helps us tailor your learning experience
        </Text>

        <Section label="My native language">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <LanguageOption
              key={lang.code}
              flag={lang.flag}
              name={lang.name}
              selected={nativeLanguage === lang.code}
              disabled={studiedLanguage === lang.code}
              onPress={() => setNativeLanguage(lang.code)}
            />
          ))}
        </Section>

        <Section label="Language I want to learn">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <LanguageOption
              key={lang.code}
              flag={lang.flag}
              name={lang.name}
              selected={studiedLanguage === lang.code}
              disabled={nativeLanguage === lang.code}
              onPress={() => setStudiedLanguage(lang.code)}
            />
          ))}
        </Section>

        {nativeLanguage !== null &&
          studiedLanguage !== null &&
          nativeLanguage === studiedLanguage && (
            <View style={styles.warningBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
              <Text style={styles.warningText}>
                Native and studied languages must be different
              </Text>
            </View>
          )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave || saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving…' : isConfigured ? 'Save changes' : 'Get started'}
          </Text>
          {!saving && (
            <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.optionRow}>{children}</View>
    </View>
  );
}

function LanguageOption({
  flag,
  name,
  selected,
  disabled,
  onPress,
}: {
  flag: string;
  name: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.option,
        selected && styles.optionSelected,
        disabled && styles.optionDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={styles.flag}>{flag}</Text>
      <Text
        style={[
          styles.optionName,
          selected && styles.optionNameSelected,
          disabled && styles.optionNameDisabled,
        ]}
      >
        {name}
      </Text>
      {selected && (
        <Ionicons
          name="checkmark-circle"
          size={18}
          color={colors.primary}
          style={styles.checkIcon}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'web' ? 40 : 0,
  },
  content: {
    flex: 1,
    paddingTop: spacing.xxxl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
  },
  backText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxxl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  optionDisabled: {
    opacity: 0.35,
  },
  flag: {
    fontSize: 24,
  },
  optionName: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  optionNameSelected: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  optionNameDisabled: {
    color: colors.textTertiary,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningLight,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  warningText: {
    ...typography.bodySmall,
    color: colors.warning,
    flex: 1,
  },
  footer: {
    paddingBottom: Platform.OS === 'web' ? 20 : spacing.lg,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.lg,
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
