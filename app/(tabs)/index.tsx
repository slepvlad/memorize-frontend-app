import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { wordsApi, WordResponse } from '../../src/api/words';
import { colors, spacing, radius } from '../../src/theme';

export default function HomeScreen() {
  const { logout } = useAuth();
  const router = useRouter();

  const [recentWords, setRecentWords] = useState<WordResponse[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [loadingWords, setLoadingWords] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [saving, setSaving] = useState(false);

  const loadWords = useCallback(async () => {
    setLoadingWords(true);
    try {
      const page = await wordsApi.getAll(0, 5);
      setRecentWords(page.content.slice(0, 3));
      setTotalWords(page.totalElements);
    } catch {
      // error handled globally by axios interceptor (toast)
    } finally {
      setLoadingWords(false);
    }
  }, []);

  useEffect(() => {
    void loadWords();
  }, [loadWords]);

  const handleAddWord = async () => {
    if (!term.trim() || saving) return;
    setSaving(true);
    try {
      await wordsApi.create({ term: term.trim(), definition: definition.trim() || undefined });
      setTerm('');
      setDefinition('');
      setModalVisible(false);
      void loadWords();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.name}>Learner</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.avatar}>
            <Text style={styles.avatarText}>L</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakTop}>
            <View>
              <Text style={styles.streakLabel}>Words added</Text>
              <Text style={styles.streakCount}>{loadingWords ? '—' : totalWords}</Text>
            </View>
            <Ionicons name="library-outline" size={32} color="rgba(255,255,255,0.4)" />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/learn')}
            activeOpacity={0.8}
          >
            <Ionicons name="layers-outline" size={28} color={colors.primary} />
            <Text style={styles.actionTitle}>Learn words</Text>
            <Text style={styles.actionSub}>Flashcards</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/quiz')}
            activeOpacity={0.8}
          >
            <Ionicons name="help-circle-outline" size={28} color={colors.coral} />
            <Text style={styles.actionTitle}>Quiz me</Text>
            <Text style={styles.actionSub}>Test yourself</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Words */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent words</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color={colors.textInverse} />
            <Text style={styles.addButtonText}>Add word</Text>
          </TouchableOpacity>
        </View>

        {loadingWords ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : recentWords.length === 0 ? (
          <Text style={styles.emptyText}>No words yet. Tap "Add word" to get started.</Text>
        ) : (
          recentWords.map((item) => (
            <View key={item.id} style={styles.wordRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.wordText}>{item.term}</Text>
                {item.definition ? (
                  <Text style={styles.wordMeaning} numberOfLines={1}>{item.definition}</Text>
                ) : null}
              </View>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      item.repetitions > 0 ? colors.successLight : colors.warningLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: item.repetitions > 0 ? colors.success : colors.warning },
                  ]}
                >
                  {item.repetitions > 0 ? 'Reviewed' : 'New'}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Word Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add word</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Term *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ephemeral"
              placeholderTextColor={colors.textTertiary}
              value={term}
              onChangeText={setTerm}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.fieldLabel}>Definition</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="e.g. Lasting for a very short time"
              placeholderTextColor={colors.textTertiary}
              value={definition}
              onChangeText={setDefinition}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.saveButton, (!term.trim() || saving) && styles.saveButtonDisabled]}
              onPress={handleAddWord}
              disabled={!term.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.sm,
  },
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.textInverse,
    fontWeight: '600',
    fontSize: 16,
  },
  streakCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: spacing.xl,
  },
  streakTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  streakLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  streakCount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: -1,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.xxl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  actionSub: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textInverse,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  wordText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  wordMeaning: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.xl,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
