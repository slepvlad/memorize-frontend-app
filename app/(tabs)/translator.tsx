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
import { useRouter } from 'expo-router';
import { phrasesApi, PhraseLookupResponse, LANGUAGE_TO_API } from '../../src/api/phrases';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../src/context/LanguageContext';
import { colors, spacing, radius } from '../../src/theme';

const getLangInfo = (code: string | null) =>
  SUPPORTED_LANGUAGES.find(l => l.code === code) ?? null;

export default function TranslatorScreen() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PhraseLookupResponse | null>(null);
  const [swapped, setSwapped] = useState(false);

  const router = useRouter();
  const { studiedLanguage, nativeLanguage, isConfigured } = useLanguage();

  const sourceLangCode = swapped ? nativeLanguage : studiedLanguage;
  const targetLangCode = swapped ? studiedLanguage : nativeLanguage;
  const sourceLang = getLangInfo(sourceLangCode);
  const targetLang = getLangInfo(targetLangCode);
  const sourceApiLang = sourceLangCode ? LANGUAGE_TO_API[sourceLangCode] : undefined;
  const targetApiLang = targetLangCode ? LANGUAGE_TO_API[targetLangCode] : undefined;

  const canLookup = query.trim().length > 0 && !!sourceApiLang && !!targetApiLang;

  const handleSwap = () => {
    setSwapped(s => !s);
    setQuery('');
    setResult(null);
  };

  const handleClear = () => {
    setQuery('');
    setResult(null);
  };

  const handleLookup = async () => {
    if (!canLookup) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await phrasesApi.lookup(query.trim(), sourceApiLang!, targetApiLang!);
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

  if (!isConfigured || !sourceApiLang || !targetApiLang) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="globe-outline" size={56} color={colors.textTertiary} />
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.navigate('/')}
          accessibilityLabel="Go to Home"
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={styles.homeBtnText}>Home</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          {result && query.trim().length > 0 && (
            <TouchableOpacity
              onPress={handleClear}
              accessibilityLabel="Clear search"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={22} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
          {result && (
            <TouchableOpacity
              style={styles.saveHeaderBtn}
              onPress={handleSave}
              accessibilityLabel="Save for study"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="bookmark-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        {/* Input panel */}
        <View style={styles.inputPanel}>
          <TextInput
            style={styles.inputText}
            placeholder="Enter text…"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleLookup}
            multiline
            blurOnSubmit
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Phrase input"
          />
          {result && (
            <View style={styles.inputFooter}>
              <TouchableOpacity
                onPress={handlePlayAudio}
                accessibilityLabel="Play original audio"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="volume-high-outline" size={24} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.panelDivider} />

        {/* Loading */}
        {loading && (
          <View style={styles.loadingPanel}>
            <ActivityIndicator color={colors.primary} accessibilityLabel="Loading" />
          </View>
        )}

        {/* Result panel */}
        {result && !loading && (
          <View style={styles.resultPanel}>
            <Text style={styles.resultText}>{result.translatedWord}</Text>
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.iconAction}
                onPress={handlePlayAudio}
                accessibilityLabel="Play audio"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="volume-high-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Examples */}
        {result && !loading && result.examples.length > 0 && (
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

        {/* Empty hint */}
        {!loading && !result && (
          <View style={styles.hintBox}>
            <Ionicons name="language-outline" size={32} color={colors.textTertiary} />
            <Text style={styles.hintText}>Enter a word or phrase to see its translation</Text>
          </View>
        )}
      </ScrollView>

      {/* Language selector bar */}
      <View style={styles.langBar}>
        <View style={styles.langChip}>
          <Text style={styles.langFlag}>{sourceLang?.flag}</Text>
          <Text style={styles.langName}>{sourceLang?.name}</Text>
        </View>

        <TouchableOpacity
          style={styles.swapBtn}
          onPress={handleSwap}
          accessibilityLabel="Swap languages"
        >
          <Ionicons name="swap-horizontal-outline" size={22} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.langChip}>
          <Text style={styles.langFlag}>{targetLang?.flag}</Text>
          <Text style={styles.langName}>{targetLang?.name}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  homeBtnText: {
    fontSize: 17,
    fontWeight: '400',
    color: colors.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  saveHeaderBtn: {
    padding: spacing.xs,
  },

  // Language bar
  langBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  langChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  langFlag: {
    fontSize: 18,
  },
  langName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  swapBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },

  // Input panel
  inputPanel: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    minHeight: 160,
  },
  inputText: {
    fontSize: 22,
    color: colors.text,
    lineHeight: 30,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  inputFooter: {
    marginTop: spacing.sm,
  },

  panelDivider: {
    height: 8,
    backgroundColor: colors.surface,
  },

  // Loading
  loadingPanel: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },

  // Result panel
  resultPanel: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    minHeight: 120,
  },
  resultText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primaryDark,
    letterSpacing: -0.3,
    lineHeight: 36,
  },
  resultActions: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.lg,
  },
  iconAction: {
    padding: spacing.xs,
  },

  // Examples
  examplesSection: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  examplesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  exampleItem: {
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 4,
  },
  exampleOriginal: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
  },
  exampleTranslation: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Hint / empty state
  hintBox: {
    paddingTop: spacing.xxxl * 2,
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxxl,
  },
  hintText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Not-configured state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxxl,
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
  },
});
