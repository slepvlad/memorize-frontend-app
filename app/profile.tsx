import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../src/context/AuthContext';
import { useToast } from '../src/context/ToastContext';
import { useLanguage, SUPPORTED_LANGUAGES } from '../src/context/LanguageContext';
import { useProfile } from '../src/context/ProfileContext';
import { ChangeEmailForm } from '../src/profile/ChangeEmailForm';
import { ChangePasswordForm } from '../src/profile/ChangePasswordForm';
import { colors, spacing, radius, typography } from '../src/theme';

type Section = 'email' | 'password' | null;

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const { nativeLanguage, studiedLanguage } = useLanguage();

  const { profile, avatarUri, isLoading, refreshProfile, uploadAvatar, removeAvatar } = useProfile();
  const [uploading, setUploading] = useState(false);
  const [openSection, setOpenSection] = useState<Section>(null);

  const nativeLang = SUPPORTED_LANGUAGES.find((l) => l.code === nativeLanguage);
  const studiedLang = SUPPORTED_LANGUAGES.find((l) => l.code === studiedLanguage);

  // The context loads on login; refetch on open so the screen is never stale.
  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const toggleSection = (section: Exclude<Section, null>) =>
    setOpenSection((prev) => (prev === section ? null : section));

  const handlePickAvatar = async () => {
    if (uploading) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast(t('photoPermissionDenied'), 'warning');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      await uploadAvatar(result.assets[0]);
      showToast(t('avatarUpdated'), 'success');
    } catch {
      // error surfaced globally by axios interceptor (toast)
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (uploading) return;
    setUploading(true);
    try {
      await removeAvatar();
      showToast(t('avatarRemoved'), 'success');
    } catch {
      // error surfaced globally by axios interceptor (toast)
    } finally {
      setUploading(false);
    }
  };

  const initial = profile?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} testID="back-button">
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profileTitle')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading && !profile ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxxl }} testID="profile-loading" />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar */}
            <View style={styles.avatarBlock}>
              <TouchableOpacity
                onPress={handlePickAvatar}
                activeOpacity={0.8}
                testID="avatar-button"
                accessibilityLabel={t('changePhoto')}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatar} testID="avatar-image" />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarInitial}>{initial}</Text>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  {uploading ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  ) : (
                    <Ionicons name="camera" size={16} color={colors.textInverse} />
                  )}
                </View>
              </TouchableOpacity>
              {profile?.email ? <Text style={styles.email}>{profile.email}</Text> : null}
              {avatarUri ? (
                <TouchableOpacity onPress={handleRemoveAvatar} disabled={uploading}>
                  <Text style={styles.removePhoto}>{t('removePhoto')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Account */}
            <Text style={styles.sectionTitle}>{t('account')}</Text>
            <View style={styles.card}>
              <Row
                icon="mail-outline"
                label={t('changeEmail')}
                expanded={openSection === 'email'}
                onPress={() => toggleSection('email')}
              />
              {openSection === 'email' && (
                <View style={styles.formBody}>
                  <ChangeEmailForm
                    currentEmail={profile?.email ?? ''}
                    onDone={() => setOpenSection(null)}
                  />
                </View>
              )}
              <View style={styles.divider} />
              <Row
                icon="lock-closed-outline"
                label={t('changePassword')}
                expanded={openSection === 'password'}
                onPress={() => toggleSection('password')}
              />
              {openSection === 'password' && (
                <View style={styles.formBody}>
                  <ChangePasswordForm onDone={() => setOpenSection(null)} />
                </View>
              )}
              <View style={styles.divider} />
              <Row
                icon="language-outline"
                label={t('studyLanguages')}
                value={nativeLang && studiedLang ? `${nativeLang.flag} → ${studiedLang.flag}` : undefined}
                onPress={() => router.push('/(onboarding)/language-setup')}
              />
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={styles.logoutText}>{t('logOut')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  expanded?: boolean;
  onPress: () => void;
}

function Row({ icon, label, value, expanded, onPress }: RowProps) {
  const chevron = expanded === undefined ? 'chevron-forward' : expanded ? 'chevron-up' : 'chevron-down';
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <Ionicons name={chevron} size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const AVATAR_SIZE = 96;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSpacer: {
    width: 26,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  avatarBlock: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...typography.h1,
    color: colors.textInverse,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryDark,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  email: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.xs,
  },
  removePhoto: {
    ...typography.bodySmall,
    color: colors.danger,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  rowLabel: {
    ...typography.body,
    flex: 1,
    color: colors.text,
  },
  rowValue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  formBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerLight,
  },
  logoutText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.danger,
  },
});
