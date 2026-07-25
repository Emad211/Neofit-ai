import * as React from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/ui';
import { useAppTheme } from '@/theme/theme';

export function MultiChoiceGrid<T extends string | number>({
  values,
  options,
  onChange,
  columns = 2,
  maxSelections,
}: {
  values: T[];
  options: Array<{ value: T; label: string; description?: string }>;
  onChange: (values: T[]) => void;
  columns?: number;
  maxSelections?: number;
}) {
  const theme = useAppTheme();
  const width = `${100 / columns - 2}%` as `${number}%`;
  const selectedSet = React.useMemo(() => new Set(values), [values]);

  const toggle = (value: T) => {
    void Haptics.selectionAsync().catch(() => undefined);
    if (selectedSet.has(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }
    if (maxSelections !== undefined && values.length >= maxSelections) return;
    onChange([...values, value]);
  };

  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {options.map((option) => {
        const selected = selectedSet.has(option.value);
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected, disabled: !selected && maxSelections !== undefined && values.length >= maxSelections }}
            onPress={() => toggle(option.value)}
            style={({ pressed }) => ({
              width,
              minHeight: 68,
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
            <AppText weight="700" size={14}>{option.label}</AppText>
            {option.description ? <AppText muted size={11}>{option.description}</AppText> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
