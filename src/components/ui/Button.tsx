import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { colors, radius } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed, hovered }: any) => [
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        Platform.OS === 'web' && ({ cursor: isDisabled ? 'not-allowed' : 'pointer' } as any),
        Platform.OS === 'web' && hovered && !isDisabled && styles[`${variant}Hover` as keyof typeof styles],
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary' || variant === 'dark'
              ? colors.textInverse
              : colors.primaryDark
          }
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              styles[`${variant}Text` as keyof typeof styles],
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    ...Platform.select({
      web: {
        transitionDuration: '150ms',
        transitionProperty: 'background-color, opacity, transform',
      } as any,
    }),
  },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  primaryHover: {
    backgroundColor: colors.primaryDark,
  },
  dark: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
  },
  secondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  secondaryHover: {
    backgroundColor: colors.surface,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: radius.md,
  },
  ghostHover: {
    backgroundColor: colors.surface,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryText: {
    color: colors.textInverse,
  },
  darkText: {
    color: colors.textInverse,
  },
  secondaryText: {
    color: colors.text,
  },
  ghostText: {
    color: colors.primaryDark,
  },
});
