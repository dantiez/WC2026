// Lightweight haptic feedback for mobile. No-ops on devices/browsers without
// the Vibration API (most desktops, iOS Safari) — safe to call anywhere.
export function haptic(pattern: number | number[] = 15): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore — vibration is a nice-to-have
  }
}
