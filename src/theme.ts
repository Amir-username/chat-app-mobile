/**
 * Design tokens shared across the app — "Dark Glow" edition.
 * Deep navy surfaces, glass inputs, glowing indigo accents.
 * Swap or extend freely.
 */
export const theme = {
  colors: {
    // Accents
    primary: "#6366F1", // indigo-500 — buttons, active states
    primaryDark: "#4F46E5", // pressed state
    primaryLight: "#818CF8", // links, focus border, active tab icon on dark
    primarySoft: "rgba(99,102,241,0.16)", // tinted fills (chips, focus)
    primaryGlow: "rgba(99,102,241,0.55)", // iOS shadow glow color

    // Surfaces
    background: "#0B1020", // deep navy — every screen background
    surface: "#141B31", // cards, rows, "theirs" bubbles
    surfaceAlt: "rgba(255,255,255,0.06)", // glass inputs

    // Lines
    border: "rgba(255,255,255,0.12)",
    borderSoft: "rgba(255,255,255,0.08)",

    // Text
    text: "#F1F5F9",
    textMuted: "#8A94A8",
    placeholder: "#5B6478", // input placeholders — dimmer than labels

    // Feedback
    danger: "#F87171",
    dangerBg: "rgba(239,68,68,0.14)",
    dangerBorder: "rgba(248,113,113,0.35)",
    success: "#34D399",

    // Misc
    onPrimary: "#FFFFFF",
    tabInactive: "#64748B",
  },
  radius: { sm: 8, md: 14, lg: 18 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
} as const;
