/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const storefrontGold = '#d8bb74';
const storefrontGoldLight = '#f3e4ad';
const storefrontText = '#f6efcf';
const storefrontMuted = '#a8a274';
const storefrontBackground = '#11170d';
const storefrontCard = '#303a14';

export const StorefrontPalette = {
  background: storefrontBackground,
  backgroundSoft: '#1f2710',
  panel: storefrontCard,
  panelStrong: '#414b16',
  panelGlass: 'rgba(65, 75, 22, 0.84)',
  panelMuted: '#232b11',
  border: 'rgba(246, 239, 207, 0.12)',
  text: storefrontText,
  textSoft: 'rgba(246, 239, 207, 0.84)',
  textMuted: 'rgba(246, 239, 207, 0.62)',
  accent: storefrontGold,
  accentLight: storefrontGoldLight,
  accentDeep: '#ac8540',
  accentOlive: '#768526',
  danger: '#d67e7e',
};

export const Colors = {
  light: {
    text: storefrontText,
    background: storefrontBackground,
    tint: storefrontGold,
    icon: storefrontMuted,
    tabIconDefault: storefrontMuted,
    tabIconSelected: storefrontGoldLight,
  },
  dark: {
    text: storefrontText,
    background: storefrontBackground,
    tint: storefrontGold,
    icon: storefrontMuted,
    tabIconDefault: storefrontMuted,
    tabIconSelected: storefrontGoldLight,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
