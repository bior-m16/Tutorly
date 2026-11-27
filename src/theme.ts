// Tutorly's warm neon theme: warm white surfaces, deep indigo ink, and a glowing
// blue-to-violet-to-pink accent taken from Tia's orb on the live tutor screen.
import { Platform } from 'react-native';

export const C = {
  bg: '#FFF8F5', // warm white page
  card: '#FFFFFF',
  ink: '#1D1A33', // main text
  sub: '#6B6585', // secondary text
  faint: '#ADA7C2', // placeholders, inactive icons
  line: 'rgba(106,76,255,0.10)',
  chip: '#F4EFFF', // soft lilac fill for chips and icon tiles
  neon: '#6A4CFF', // primary accent
  blue: '#3D6BFF',
  violet: '#9B5CFF',
  pink: '#FF5DB1',
  peach: '#FFB38A',
};

/** The signature gradient for primary buttons and highlights. */
export const NEON = ['#3D6BFF', '#7A5CFF', '#FF5DB1'] as const;
export const NEON_SOFT = ['#EAF0FF', '#F1E9FF', '#FFE8F4'] as const;

/** A coloured glow under cards and buttons. */
export function glow(color: string = C.neon, radius = 16, opacity = 0.18) {
  return Platform.select({
    web: { boxShadow: `0 6px ${radius * 1.5}px ${hexA(color, opacity)}` } as object,
    default: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
  });
}

function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
