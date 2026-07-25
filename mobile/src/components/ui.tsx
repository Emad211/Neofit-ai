import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewProps,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/providers/app-provider';
import { useAppTheme } from '@/theme/theme';

export function Screen({
  children,
  gap = 20,
  padded = true,
  safeTop = true,
}: {
  children: React.ReactNode;
  gap?: number;
  padded?: boolean;
  safeTop?: boolean;
}) {
  const theme = useAppTheme();
  const { direction } = useApp();
  return (
    <SafeAreaView
      edges={safeTop ? ['top'] : []}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{
          padding: padded ? 20 : 0,
          paddingBottom: 40,
          gap,
          direction,
        }}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function AppText({
  children,
  muted = false,
  size = 16,
  weight = '400',
  selectable = false,
  style,
}: {
  children: React.ReactNode;
  muted?: boolean;
  size?: number;
  weight?: '400' | '500' | '600' | '700' | '800';
  selectable?: boolean;
  style?: object;
}) {
  const theme = useAppTheme();
  const { direction } = useApp();
  return (
    <Text
      selectable={selectable}
      style={[
        {
          color: muted ? theme.colors.textMuted : theme.colors.text,
          fontSize: size,
          fontWeight: weight,
          lineHeight: Math.round(size * 1.45),
          textAlign: direction === 'rtl' ? 'right' : 'left',
          writingDirection: direction,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <AppText size={32} weight="800">{title}</AppText>
      {subtitle ? <AppText muted size={15}>{subtitle}</AppText> : null}
    </View>
  );
}

export function Card({ children, style, ...props }: ViewProps) {
  const theme = useAppTheme();
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 22,
          borderCurve: 'continuous',
          padding: 18,
          gap: 14,
          boxShadow: theme.dark
            ? '0 8px 24px rgba(0, 0, 0, 0.22)'
            : '0 8px 24px rgba(15, 23, 42, 0.07)',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
}: {
  title: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) {
  const theme = useAppTheme();
  const palette = {
    primary: { background: theme.colors.primary, text: theme.colors.primaryText, border: theme.colors.primary },
    secondary: { background: theme.colors.secondary, text: theme.colors.text, border: theme.colors.border },
    danger: { background: theme.colors.danger, text: '#FFFFFF', border: theme.colors.danger },
    ghost: { background: 'transparent', text: theme.colors.primary, border: theme.colors.border },
  }[variant];

  const handlePress = async () => {
    if (disabled || loading) return;
    await Haptics.selectionAsync().catch(() => undefined);
    await onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={() => void handlePress()}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        minHeight: 54,
        borderRadius: 18,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: palette.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
        opacity: disabled ? 0.45 : pressed ? 0.78 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <Text style={{ color: palette.text, fontSize: 16, fontWeight: '700' }}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  error,
  ...props
}: TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const theme = useAppTheme();
  const { direction } = useApp();
  return (
    <View style={{ gap: 8 }}>
      <AppText size={14} weight="600">{label}</AppText>
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.textMuted}
        style={[
          {
            minHeight: props.multiline ? 110 : 52,
            borderRadius: 16,
            borderCurve: 'continuous',
            borderWidth: 1,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            backgroundColor: theme.colors.surfaceElevated,
            color: theme.colors.text,
            paddingHorizontal: 14,
            paddingVertical: 12,
            textAlign: direction === 'rtl' ? 'right' : 'left',
            writingDirection: direction,
            fontSize: 16,
          },
          props.style,
        ]}
      />
      {error ? <AppText size={13} style={{ color: theme.colors.danger }}>{error}</AppText> : null}
      {!error && hint ? <AppText muted size={13}>{hint}</AppText> : null}
    </View>
  );
}

export function ChoiceGrid<T extends string>({
  value,
  options,
  onChange,
  columns = 2,
}: {
  value: T;
  options: Array<{ value: T; label: string; description?: string }>;
  onChange: (value: T) => void;
  columns?: number;
}) {
  const theme = useAppTheme();
  const width = `${100 / columns - 2}%` as `${number}%`;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              void Haptics.selectionAsync().catch(() => undefined);
              onChange(option.value);
            }}
            style={({ pressed }) => ({
              width,
              minHeight: 72,
              borderRadius: 18,
              borderCurve: 'continuous',
              borderWidth: selected ? 2 : 1,
              borderColor: selected ? theme.colors.primary : theme.colors.border,
              backgroundColor: selected ? theme.colors.secondary : theme.colors.surfaceElevated,
              padding: 12,
              justifyContent: 'center',
              gap: 2,
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <AppText weight="700" size={15}>{option.label}</AppText>
            {option.description ? <AppText muted size={12}>{option.description}</AppText> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function MetricCard({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        flex: 1,
        minWidth: 100,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: 18,
        borderCurve: 'continuous',
        padding: 14,
        gap: 4,
      }}
    >
      <AppText muted size={12}>{label}</AppText>
      <AppText size={24} weight="800" style={{ fontVariant: ['tabular-nums'] }}>
        {value}{unit ? <Text style={{ fontSize: 12, fontWeight: '500' }}> {unit}</Text> : null}
      </AppText>
    </View>
  );
}

export function InlineNotice({
  children,
  tone = 'info',
}: {
  children: React.ReactNode;
  tone?: 'info' | 'success' | 'warning' | 'danger';
}) {
  const theme = useAppTheme();
  const color = {
    info: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
  }[tone];
  return (
    <View
      style={{
        borderStartWidth: 4,
        borderStartColor: color,
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        borderCurve: 'continuous',
        padding: 14,
      }}
    >
      <AppText size={14}>{children}</AppText>
    </View>
  );
}
