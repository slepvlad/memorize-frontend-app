import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Module-level bridge so Axios interceptors (outside React) can trigger toasts
let _showToast: ((message: string, type: ToastType) => void) | null = null;

export function triggerToast(message: string, type: ToastType = 'error') {
  _showToast?.(message, type);
}

let _nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'error') => {
      const id = _nextId++;
      setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  // Register the module-level bridge
  React.useEffect(() => {
    _showToast = showToast;
    return () => {
      _showToast = null;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ---- internal stack renderer (avoids a separate file for simplicity) ----

import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

const TYPE_STYLES: Record<
  ToastType,
  { bg: string; border: string; text: string; icon: string }
> = {
  error:   { bg: colors.dangerLight,  border: colors.danger,  text: colors.danger,        icon: '✕' },
  success: { bg: colors.successLight, border: colors.success, text: colors.primaryDark,   icon: '✓' },
  warning: { bg: colors.warningLight, border: colors.warning, text: '#9a6400',            icon: '!' },
  info:    { bg: colors.infoLight,    border: colors.info,    text: colors.info,          icon: 'i' },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const s = TYPE_STYLES[toast.type];

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: s.bg, borderLeftColor: s.border, opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={[styles.iconBadge, { backgroundColor: s.border }]}>
        <Text style={styles.iconText}>{s.icon}</Text>
      </View>
      <Text style={[styles.message, { color: colors.text }]} numberOfLines={3}>
        {toast.message}
      </Text>
      <Pressable onPress={() => onDismiss(toast.id)} style={styles.closeBtn} hitSlop={8}>
        <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
      </Pressable>
    </Animated.View>
  );
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <View style={styles.stack} pointerEvents="box-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    gap: spacing.sm,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderLeftWidth: 4,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  iconBadge: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  message: {
    ...typography.bodySmall,
    flex: 1,
  },
  closeBtn: {
    flexShrink: 0,
    padding: 2,
  },
  closeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
