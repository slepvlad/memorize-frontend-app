import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/ui/Button';
import { colors, spacing } from '../../src/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[colors.primaryLight, colors.background]}
      locations={[0, 0.6]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.spacer} />

        <View style={styles.hero}>
          <View style={styles.iconBox}>
            <Ionicons name="layers-outline" size={40} color={colors.textInverse} />
          </View>
          <Text style={styles.title}>Memorize</Text>
          <Text style={styles.subtitle}>
            Master new words with smart{'\n'}spaced repetition
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            title="Get started"
            onPress={() => router.push('/(auth)/register')}
          />
          <Button
            title="I already have an account"
            variant="secondary"
            onPress={() => router.push('/(auth)/login')}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: spacing.xxxl,
    paddingTop: Platform.OS === 'web' ? 40 : 0,
  },
  spacer: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    gap: 12,
    paddingBottom: Platform.OS === 'web' ? 20 : 0,
  },
});
