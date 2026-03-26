import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { colors } from '../../theme';

const MAX_MOBILE_WIDTH = 430;
const BREAKPOINT_DESKTOP = 768;

interface WebContainerProps {
  children: React.ReactNode;
  withFrame?: boolean;
}

export function WebContainer({ children, withFrame = true }: WebContainerProps) {
  const { width } = useWindowDimensions();

  // On native, just render children directly
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const isDesktop = width >= BREAKPOINT_DESKTOP;

  // On small web screens, render normally
  if (!isDesktop) {
    return <>{children}</>;
  }

  // On desktop web, center in a phone-like container
  return (
    <View style={styles.desktopBackground}>
      <View style={[styles.phoneFrame, withFrame && styles.phoneFrameBorder]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopBackground: {
    flex: 1,
    backgroundColor: '#F0EFEB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  phoneFrame: {
    width: MAX_MOBILE_WIDTH,
    maxHeight: 844,
    height: '100%',
    backgroundColor: colors.background,
    overflow: 'hidden',
    borderRadius: 32,
  },
  phoneFrameBorder: {
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.1)',
    // Web-only shadow
    ...Platform.select({
      web: {
        boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 20px rgba(0,0,0,0.06)',
      },
    }),
  },
});
