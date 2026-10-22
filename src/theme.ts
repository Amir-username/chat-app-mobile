/** Design tokens shared across the app. Swap or extend freely. */
export const theme = {
  colors: {
    primary: '#4F46E5',
    primaryDark: '#4338CA',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    danger: '#DC2626',
    dangerBg: '#FEE2E2',
  },
  radius: { sm: 8, md: 12, lg: 16 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
} as const;