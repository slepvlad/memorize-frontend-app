import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { colors, typography } from '../../theme';

interface EyebrowProps extends TextProps {
  children: React.ReactNode;
}

export function Eyebrow({ children, style, ...props }: EyebrowProps) {
  return (
    <Text style={[typography.eyebrow, styles.eyebrow, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.primaryDark,
    textTransform: 'uppercase',
  },
});
