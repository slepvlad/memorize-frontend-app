import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { wordsApi, WordResponse } from '../../src/api/words';
import { colors, spacing, radius } from '../../src/theme';

const PAGE_SIZE = 20;
type ModalMode = 'create' | 'edit';

export default function VocabularyScreen() {
  const [words, setWords] = useState<WordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingWord, setEditingWord] = useState<WordResponse | null>(null);
  const [term, setTerm] = useState('');
  const [definition, setDefinition] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    try {
      const data = await wordsApi.getAll(pageNum, PAGE_SIZE);
      setWords(prev => (append ? [...prev, ...data.content] : data.content));
      setHasMore(!data.last);
      setPage(pageNum);
      setTotalElements(data.totalElements);
    } catch {
      // errors handled by global axios interceptor (toast)
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    await fetchPage(0, false);
    setLoading(false);
  }, [fetchPage]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(0, false);
    setRefreshing(false);
  }, [fetchPage]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPage(page + 1, true);
    setLoadingMore(false);
  }, [loadingMore, hasMore, page, fetchPage]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingWord(null);
    setTerm('');
    setDefinition('');
    setModalVisible(true);
  };

  const openEditModal = (word: WordResponse) => {
    setModalMode('edit');
    setEditingWord(word);
    setTerm(word.term);
    setDefinition(word.definition ?? '');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTerm('');
    setDefinition('');
    setEditingWord(null);
  };

  const handleSave = async () => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm || saving) return;
    setSaving(true);
    try {
      const payload = {
        term: trimmedTerm,
        definition: definition.trim() || undefined,
      };
      if (modalMode === 'create') {
        const created = await wordsApi.create(payload);
        setWords(prev => [created, ...prev]);
        setTotalElements(prev => prev + 1);
      } else if (editingWord) {
        const updated = await wordsApi.update(editingWord.id, payload);
        setWords(prev => prev.map(w => (w.id === updated.id ? updated : w)));
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePress = (word: WordResponse) => {
    Alert.alert(
      'Delete word',
      `Remove "${word.term}" from your vocabulary?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await wordsApi.delete(word.id);
              setWords(prev => prev.filter(w => w.id !== word.id));
              setTotalElements(prev => Math.max(0, prev - 1));
            } catch {
              // handled globally
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: WordResponse }) => (
    <View style={styles.wordRow}>
      <View style={styles.wordInfo}>
        <Text style={styles.wordTerm}>{item.term}</Text>
        {item.definition ? (
          <Text style={styles.wordDefinition} numberOfLines={1}>
            {item.definition}
          </Text>
        ) : null}
      </View>
      <View style={styles.wordActions}>
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
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => openEditModal(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={`Edit ${item.term}`}
        >
          <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => handleDeletePress(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={`Delete ${item.term}`}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Vocabulary</Text>
          {!loading && (
            <Text style={styles.headerSub}>
              {totalElements} {totalElements === 1 ? 'word' : 'words'}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={openCreateModal}
          accessibilityLabel="Add word"
        >
          <Ionicons name="add" size={22} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.centered} />
      ) : (
        <FlatList
          data={words}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={
            words.length === 0 ? styles.emptyContainer : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="library-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No words yet</Text>
              <Text style={styles.emptyText}>
                Tap the + button to add your first word.
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginVertical: spacing.xl }}
              />
            ) : null
          }
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'Add word' : 'Edit word'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
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
              style={[
                styles.saveButton,
                (!term.trim() || saving) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!term.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {modalMode === 'create' ? 'Save' : 'Save changes'}
                </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerSub: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    marginTop: spacing.xxxl,
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
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
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  wordInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  wordTerm: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  wordDefinition: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  wordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginRight: spacing.xs,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  iconBtn: {
    padding: spacing.xs,
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
