import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { COLORS } from '@/shared/colors';

interface Props {
  style?: StyleProp<ViewStyle>;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  children?: React.ReactNode;
}

export function RBSGradient({ style, start = { x: 0, y: 0 }, end = { x: 1, y: 0 }, children }: Props) {
  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]}
      start={start}
      end={end}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
