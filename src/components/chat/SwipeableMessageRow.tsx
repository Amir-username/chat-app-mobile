import { ReactNode, useEffect, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, Text, View } from "react-native";
import { theme } from "@/theme";

/** Drag distance (px) that activates the reply action. */
const SWIPE_THRESHOLD = 72;
/** Horizontal drag must clearly beat vertical movement for the gesture to capture. */
const CAPTURE_SLOP = 8;

interface SwipeableMessageRowProps {
  children: ReactNode;
  /** Called on release past the threshold (or a quick flick). */
  onSwipeReply: () => void;
}

/**
 * Telegram-style swipe-to-reply wrapper.
 *
 *  - Drag a row horizontally → it follows the finger with resistance past
 *    the threshold, and a ↩ hint fades in on the side being dragged toward.
 *  - Release past the threshold (or flick fast) → onSwipeReply() fires and
 *    the row springs back.
 *  - Vertical FlatList scrolling is untouched: the responder only captures
 *    when |dx| clearly dominates |dy|.
 *  - Long-press still reaches the child (Pressable) — no movement means the
 *    pan responder never claims the gesture.
 */
export function SwipeableMessageRow({
  children,
  onSwipeReply,
}: SwipeableMessageRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [hintSide, setHintSide] = useState<0 | 1 | -1>(0);

  // Keep the latest callback without re-creating the PanResponder
  const replyRef = useRef(onSwipeReply);
  useEffect(() => {
    replyRef.current = onSwipeReply;
  }, [onSwipeReply]);

  /** Resistance past the threshold — the row keeps moving but heavily damped. */
  const withResistance = (raw: number): number => {
    const sign = Math.sign(raw);
    const abs = Math.abs(raw);
    if (abs <= SWIPE_THRESHOLD) return raw;
    return sign * (SWIPE_THRESHOLD + (abs - SWIPE_THRESHOLD) * 0.15);
  };

  const springBack = (bouncy: boolean) => {
    Animated.spring(translateX, {
      toValue: 0,
      speed: 30,
      bounciness: bouncy ? 8 : 3,
      useNativeDriver: true,
    }).start();
  };

  const pan = useRef(
    PanResponder.create({
      // Only capture clearly-horizontal drags; everything else stays with
      // the FlatList scroll / child Pressable.
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > CAPTURE_SLOP && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderMove: (_, g) => {
        const v = withResistance(g.dx);
        translateX.setValue(v);
        setHintSide(v > 14 ? 1 : v < -14 ? -1 : 0);
      },
      onPanResponderRelease: (_, g) => {
        setHintSide(0);
        const flick = Math.abs(g.vx) > 0.6 && Math.abs(g.dx) > 24;
        if (Math.abs(g.dx) >= SWIPE_THRESHOLD || flick) {
          replyRef.current();
          springBack(true);
        } else {
          springBack(false);
        }
      },
      onPanResponderTerminate: () => {
        // Gesture stolen (e.g. system) → reset silently
        setHintSide(0);
        springBack(false);
      },
    }),
  ).current;

  return (
    <View>
      {/* Hint behind the row, revealed on the side being dragged toward */}
      <View style={styles.hintLayer} pointerEvents="none">
        {hintSide !== 0 ? (
          <Text
            style={[
              styles.hint,
              hintSide === 1 ? styles.hintLeft : styles.hintRight,
            ]}
          >
            ↩
          </Text>
        ) : null}
      </View>

      <Animated.View style={styles.row} {...pan.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hintLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
  },
  hint: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
  },
  hintLeft: {
    alignSelf: "flex-start",
  },
  hintRight: {
    alignSelf: "flex-end",
  },
  row: {
    zIndex: 1,
  },
});
