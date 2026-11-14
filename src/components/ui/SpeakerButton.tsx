import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';

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
  color = colors.textSecondary,
  loading = false,
  playing = false,
  style,
}: SpeakerButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      accessibilityLabel={label}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[styles.button, style]}
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: spacing.xs,
  },
});
