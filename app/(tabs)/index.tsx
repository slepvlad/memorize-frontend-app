import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { colors, spacing, radius } from '../../src/theme';

const recentWords = [
  { word: 'Ephemeral', meaning: 'Lasting for a very short time', status: 'learned' },
  { word: 'Ubiquitous', meaning: 'Found everywhere', status: 'learned' },
  { word: 'Resilience', meaning: 'Ability to recover quickly', status: 'learning' },
];

export default function HomeScreen() {
  const { logout } = useAuth();
  const router = useRouter();

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

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakTop}>
            <View>
              <Text style={styles.streakLabel}>Current streak</Text>
              <Text style={styles.streakCount}>0 days</Text>
            </View>
            <Ionicons name="flame" size={32} color="rgba(255,255,255,0.4)" />
          </View>
          <View style={styles.streakDots}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <View
                key={i}
                style={[
                  styles.streakDot,
                  { backgroundColor: i < 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)' },
                ]}
              />
            ))}
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
            <Text style={styles.actionSub}>24 words due</Text>
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
        <Text style={styles.sectionTitle}>Recent words</Text>
        {recentWords.map((item, index) => (
          <View key={index} style={styles.wordRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.wordText}>{item.word}</Text>
              <Text style={styles.wordMeaning}>{item.meaning}</Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    item.status === 'learned' ? colors.successLight : colors.warningLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: item.status === 'learned' ? colors.success : colors.warning,
                  },
                ]}
              >
                {item.status === 'learned' ? 'Learned' : 'Learning'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
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
  streakDots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
  },
  streakDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
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
});
