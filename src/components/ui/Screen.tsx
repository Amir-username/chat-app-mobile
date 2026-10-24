import type { ReactNode } from "react";
import { SafeAreaView, StyleSheet, View, type ViewStyle } from "react-native";
import { theme } from "@/theme";

interface ScreenProps {
  children: ReactNode;
  /** Extra styling for the inner content container */
  style?: ViewStyle;
}

/** Safe-area-wrapped screen container with standard padding. */
export function Screen({ children, style }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.inner, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inner: {
    flex: 1,
    padding: theme.spacing.xl,
  },
});
