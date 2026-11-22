import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../theme';

interface SpeakerButtonProps {
  onPress: () => void;
  /** accessibilityLabel, e.g. "Play audio for Ephemeral". */
  label: string;
  size?: number;
  color?: string;
  /** Clip is still being synthesized or downloaded. */
  loading?: boolean;
  /** This speaker's clip is playing now. */
  playing?: boolean;
  style?: ViewStyle;
}

export function SpeakerButton({
  onPress,
  label,
  size = 24,
  color = colors.navy,
  loading = false,
  playing = false,
  style,
}: SpeakerButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityLabel={label}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Ionicons
          name={playing ? 'volume-high' : 'volume-high-outline'}
          size={size}
          color={color}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.surface,
  },
});
