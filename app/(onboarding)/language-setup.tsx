import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
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

        <View style={styles.fields}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>My native language</Text>
            <LanguageDropdown
              value={nativeLanguage}
              disabledOption={studiedLanguage}
              placeholder="Select language"
              onChange={setNativeLanguage}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Language I want to learn</Text>
            <LanguageDropdown
              value={studiedLanguage}
              disabledOption={nativeLanguage}
              placeholder="Select language"
              onChange={setStudiedLanguage}
            />
          </View>
        </View>
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

function LanguageDropdown({
  value,
  disabledOption,
  placeholder,
  onChange,
}: {
  value: Language | null;
  disabledOption: Language | null;
  placeholder: string;
  onChange: (lang: Language) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = SUPPORTED_LANGUAGES.find((l) => l.code === value);

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, open && styles.triggerOpen]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        {selected ? (
          <View style={styles.triggerValue}>
            <Text style={styles.triggerFlag}>{selected.flag}</Text>
            <Text style={styles.triggerText}>{selected.name}</Text>
          </View>
        ) : (
          <Text style={styles.triggerPlaceholder}>{placeholder}</Text>
        )}
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            {SUPPORTED_LANGUAGES.map((lang, index) => {
              const isSelected = value === lang.code;
              const isDisabled = disabledOption === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.item,
                    index < SUPPORTED_LANGUAGES.length - 1 && styles.itemBorder,
                    isDisabled && styles.itemDisabled,
                  ]}
                  onPress={() => {
                    if (!isDisabled) {
                      onChange(lang.code);
                      setOpen(false);
                    }
                  }}
                  disabled={isDisabled}
                  activeOpacity={0.7}
                >
                  <Text style={styles.itemFlag}>{lang.flag}</Text>
                  <Text style={[styles.itemName, isDisabled && styles.itemNameDisabled]}>
                    {lang.name}
                  </Text>
                  {isDisabled && (
                    <Text style={styles.itemHint}>Already selected</Text>
                  )}
                  {isSelected && !isDisabled && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  fields: {
    gap: spacing.xl,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Trigger (closed state)
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  triggerOpen: {
    borderColor: colors.primary,
  },
  triggerValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  triggerFlag: {
    fontSize: 22,
  },
  triggerText: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text,
  },
  triggerPlaceholder: {
    ...typography.body,
    color: colors.textTertiary,
    flex: 1,
  },
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'web' ? spacing.xxl : 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: spacing.md,
  },
  itemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  itemDisabled: {
    opacity: 0.4,
  },
  itemFlag: {
    fontSize: 24,
  },
  itemName: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  itemNameDisabled: {
    color: colors.textTertiary,
  },
  itemHint: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  // Footer
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
