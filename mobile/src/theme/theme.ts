import { useColorScheme } from 'react-native';

export type AppTheme = {
  dark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    text: string;
    textMuted: string;
    primary: string;
    primaryText: string;
    secondary: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
    overlay: string;
  };
};

const lightTheme: AppTheme = {
  dark: false,
  colors: {
    background: '#F4F6F8',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    text: '#111827',
    textMuted: '#667085',
    primary: '#16A34A',
    primaryText: '#FFFFFF',
    secondary: '#E8F5EC',
    border: '#E4E7EC',
    success: '#15803D',
    warning: '#B45309',
    danger: '#DC2626',
    overlay: 'rgba(15, 23, 42, 0.45)',
  },
};

const darkTheme: AppTheme = {
  dark: true,
  colors: {
    background: '#0B1014',
    surface: '#151B21',
    surfaceElevated: '#1B232B',
    text: '#F8FAFC',
    textMuted: '#9AA4B2',
    primary: '#4ADE80',
    primaryText: '#052E16',
    secondary: '#173724',
    border: '#2A3440',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
    overlay: 'rgba(0, 0, 0, 0.65)',
  },
};

export function useAppTheme() {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
