import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { phrasesApi, PhraseLookupResponse, LANGUAGE_TO_API } from '../../src/api/phrases';
import { useLanguage } from '../../src/context/LanguageContext';
import { colors, spacing, radius } from '../../src/theme';

export default function TranslatorScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PhraseLookupResponse | null>(null);

  const { studiedLanguage, nativeLanguage, isConfigured } = useLanguage();

  const sourceLanguage = studiedLanguage ? LANGUAGE_TO_API[studiedLanguage] : undefined;
  const targetLanguage = nativeLanguage ? LANGUAGE_TO_API[nativeLanguage] : undefined;

  const canLookup = query.trim().length > 0 && !!sourceLanguage && !!targetLanguage;

  const handleLookup = async () => {
    if (!canLookup) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await phrasesApi.lookup(query.trim(), sourceLanguage!, targetLanguage!);
      setResult(data);
    } catch {
      // errors handled by global axios interceptor (toast)
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = () => {
    Alert.alert('Coming soon', 'Audio playback will be available in a future update.');
  };

  const handleSave = () => {
    Alert.alert('Coming soon', 'Saving phrases for study will be available in a future update.');
  };

  if (!isConfigured || !sourceLanguage || !targetLanguage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Translator</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="globe-outline" size={48} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>Languages not configured</Text>
          <Text style={styles.emptyText}>
            Set up your native and studied languages to use the translator.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Translator</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter a word or phrase…"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleLookup}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Phrase input"
          />
          <TouchableOpacity
            style={[styles.searchBtn, !canLookup && styles.searchBtnDisabled]}
            onPress={handleLookup}
            disabled={!canLookup}
            accessibilityLabel="Translate"
          >
            <Ionicons name="search" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        </View>

        {loading && (
          <ActivityIndicator
            color={colors.primary}
            style={styles.spinner}
            accessibilityLabel="Loading"
          />
        )}

        {result && !loading && (
          <>
            <View style={styles.resultCard}>
              <Text style={styles.originalLabel}>Original</Text>
              <Text style={styles.originalWord}>{result.originalWord}</Text>

              <View style={styles.divider} />

              <Text style={styles.translatedLabel}>Translation</Text>
              <Text style={styles.translatedWord}>{result.translatedWord}</Text>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.audioBtn}
                  onPress={handlePlayAudio}
                  accessibilityLabel="Play audio"
                >
                  <Ionicons name="volume-high-outline" size={18} color={colors.primary} />
                  <Text style={styles.audioBtnText}>Play audio</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSave}
                  accessibilityLabel="Save for study"
                >
                  <Ionicons name="bookmark-outline" size={18} color={colors.textInverse} />
                  <Text style={styles.saveBtnText}>Save for study</Text>
                </TouchableOpacity>
              </View>
            </View>

            {result.examples.length > 0 && (
              <View style={styles.examplesSection}>
                <Text style={styles.examplesTitle}>Examples</Text>
                {result.examples.map((ex, i) => (
                  <View key={i} style={styles.exampleItem}>
                    <Text style={styles.exampleOriginal}>{ex.original}</Text>
                    <Text style={styles.exampleTranslation}>{ex.translation}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {!loading && !result && (
          <View style={styles.emptyState}>
            <Ionicons name="globe-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Translate a phrase</Text>
            <Text style={styles.emptyText}>
              Enter a word or phrase above to see its translation and examples.
            </Text>
          </View>
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
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: spacing.xxl,
    flexGrow: 1,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnDisabled: {
    opacity: 0.4,
  },
  spinner: {
    marginTop: spacing.xxxl,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
  },
  originalLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  originalWord: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  translatedLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  translatedWord: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.3,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  audioBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
  },
  examplesSection: {
    gap: spacing.md,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  exampleItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  exampleOriginal: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  exampleTranslation: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xxxl,
  },
});
