import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/context/AuthContext';
import { colors, spacing } from '../../src/theme';

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, labelKey: 'strengthWeak', color: colors.danger };
  if (score <= 2) return { score: 2, labelKey: 'strengthFair', color: colors.warning };
  if (score <= 3) return { score: 3, labelKey: 'strengthGood', color: colors.warning };
  if (score <= 4) return { score: 4, labelKey: 'strengthStrong', color: colors.primary };
  return { score: 5, labelKey: 'strengthVeryStrong', color: colors.primary };
}

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { register, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const strengthData = password ? getPasswordStrength(password) : null;
  const strength = strengthData ? { ...strengthData, label: t(strengthData.labelKey as any) } : null;

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};

    if (!email.trim()) {
      errors.email = t('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = t('emailInvalid');
    }

    if (!password) {
      errors.password = t('passwordRequired');
    } else if (password.length < 6) {
      errors.password = t('passwordMin6');
    }

    if (!confirmPassword) {
      errors.confirmPassword = t('confirmRequired');
    } else if (password !== confirmPassword) {
      errors.confirmPassword = t('passwordMismatch');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) return;

    try {
      await register({ email: email.trim(), password });
    } catch {
      // Error is set in AuthContext
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
            <Text style={styles.backText}>{t('back')}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{t('registerTitle')}</Text>
          <Text style={styles.subtitle}>{t('registerSubtitle')}</Text>

          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Input
              label={t('emailLabel')}
              placeholder={t('emailPlaceholder')}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (fieldErrors.email) setFieldErrors((e) => ({ ...e, email: undefined }));
              }}
              keyboardType="email-address"
              autoComplete="email"
              error={fieldErrors.email}
            />

            <Input
              label={t('passwordLabel')}
              placeholder={t('passwordMinLength')}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: undefined }));
              }}
              isPassword
              autoComplete="new-password"
              error={fieldErrors.password}
            />

            {/* Password strength indicator */}
            {strength && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            i <= strength.score
                              ? strength.color
                              : colors.border,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            )}

            <Input
              label={t('confirmPasswordLabel')}
              placeholder={t('reEnterPassword')}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (fieldErrors.confirmPassword)
                  setFieldErrors((e) => ({ ...e, confirmPassword: undefined }));
              }}
              isPassword
              autoComplete="new-password"
              error={fieldErrors.confirmPassword}
            />

            <Button
              title={t('createAccount')}
              onPress={handleRegister}
              loading={isLoading}
              style={{ marginTop: spacing.md }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('alreadyHaveAccount')}</Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.footerLink}>{t('signIn')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingBottom: 40,
    flexGrow: 1,
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
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.xxxl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerLight,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: spacing.xxl,
  },
  errorBannerText: {
    fontSize: 14,
    color: colors.danger,
    flex: 1,
  },
  form: {
    flex: 1,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: -8,
    marginBottom: spacing.lg,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
  },
  footerText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  footerLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
});
