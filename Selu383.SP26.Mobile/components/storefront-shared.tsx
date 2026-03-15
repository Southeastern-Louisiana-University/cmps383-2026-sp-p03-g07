import type { PropsWithChildren, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { StorefrontPalette } from '@/constants/theme';

type StorefrontScreenProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, 'contentContainerStyle' | 'children' | 'style'>;
}>;

type StorefrontHeaderProps = {
  eyebrow?: string;
  title: string;
  copy?: string;
  trailing?: ReactNode;
};

type StoreButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
};

type StoreInputProps = TextInputProps & {
  multilineTall?: boolean;
};

export function StorefrontScreen({
  children,
  contentContainerStyle,
  scrollProps,
}: StorefrontScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={[styles.glowOrb, styles.glowOrbTop]} />
      <View style={[styles.glowOrb, styles.glowOrbBottom]} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        {...scrollProps}>
        {children}
      </ScrollView>
    </View>
  );
}

export function StorefrontHero({
  eyebrow,
  title,
  copy,
  trailing,
}: StorefrontHeaderProps) {
  return (
    <View style={styles.heroCard}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.heroTitle}>{title}</Text>
      {copy ? <Text style={styles.heroCopy}>{copy}</Text> : null}
      {trailing ? <View style={styles.heroTrailing}>{trailing}</View> : null}
    </View>
  );
}

export function StorefrontSection({
  eyebrow,
  title,
  copy,
  trailing,
}: StorefrontHeaderProps) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionHeadingCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
        {copy ? <Text style={styles.sectionCopy}>{copy}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

export function StoreCard({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function StoreMetric({
  label,
  value,
  copy,
}: {
  label: string;
  value: string;
  copy: string;
}) {
  return (
    <StoreCard style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricCopy}>{copy}</Text>
    </StoreCard>
  );
}

export function StoreBadge({
  label,
  tone = 'default',
}: {
  label: string;
  tone?: 'default' | 'accent' | 'muted';
}) {
  return (
    <View
      style={[
        styles.badge,
        tone === 'accent' ? styles.badgeAccent : undefined,
        tone === 'muted' ? styles.badgeMuted : undefined,
      ]}>
      <Text
        style={[
          styles.badgeText,
          tone === 'accent' ? styles.badgeAccentText : undefined,
        ]}>
        {label}
      </Text>
    </View>
  );
}

export function StoreButton({
  label,
  variant = 'primary',
  fullWidth,
  style,
  ...rest
}: StoreButtonProps) {
  return (
    <Pressable
      style={[
        styles.button,
        variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary,
        fullWidth ? styles.buttonFullWidth : undefined,
        style as StyleProp<ViewStyle>,
      ]}
      {...rest}>
      <Text
        style={[
          styles.buttonText,
          variant === 'primary' ? styles.buttonPrimaryText : styles.buttonSecondaryText,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function StoreInput({ multilineTall, style, ...rest }: StoreInputProps) {
  return (
    <TextInput
      placeholderTextColor={StorefrontPalette.textMuted}
      style={[
        styles.input,
        multilineTall ? styles.inputTall : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

export function StoreRow({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function StoreTitle({ children }: PropsWithChildren) {
  return <Text style={styles.cardTitle}>{children}</Text>;
}

export function StoreCopy({ children, muted = false }: PropsWithChildren<{ muted?: boolean }>) {
  return <Text style={muted ? styles.cardCopyMuted : styles.cardCopy}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: StorefrontPalette.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 18,
    paddingBottom: 40,
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.65,
  },
  glowOrbTop: {
    top: -72,
    left: -48,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(221, 191, 113, 0.17)',
  },
  glowOrbBottom: {
    right: -54,
    bottom: 54,
    width: 220,
    height: 220,
    backgroundColor: 'rgba(118, 133, 38, 0.16)',
  },
  heroCard: {
    gap: 12,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(246, 239, 207, 0.12)',
    padding: 22,
    backgroundColor: StorefrontPalette.panelStrong,
  },
  heroTrailing: {
    marginTop: 4,
  },
  eyebrow: {
    color: StorefrontPalette.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: StorefrontPalette.accentLight,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heroCopy: {
    color: StorefrontPalette.textSoft,
    fontSize: 16,
    lineHeight: 22,
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-end',
  },
  sectionHeadingCopy: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    color: StorefrontPalette.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionCopy: {
    color: StorefrontPalette.textMuted,
    lineHeight: 20,
  },
  card: {
    gap: 10,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(246, 239, 207, 0.12)',
    padding: 16,
    backgroundColor: StorefrontPalette.panelGlass,
  },
  metricCard: {
    flex: 1,
    minHeight: 132,
  },
  metricLabel: {
    color: StorefrontPalette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: StorefrontPalette.accentLight,
    fontSize: 28,
    fontWeight: '800',
  },
  metricCopy: {
    color: StorefrontPalette.textSoft,
    lineHeight: 19,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(246, 239, 207, 0.08)',
  },
  badgeAccent: {
    backgroundColor: 'rgba(216, 187, 116, 0.18)',
  },
  badgeMuted: {
    backgroundColor: 'rgba(118, 133, 38, 0.2)',
  },
  badgeText: {
    color: StorefrontPalette.textSoft,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  badgeAccentText: {
    color: StorefrontPalette.accentLight,
  },
  button: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonPrimary: {
    backgroundColor: StorefrontPalette.accent,
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: StorefrontPalette.border,
    backgroundColor: 'rgba(246, 239, 207, 0.08)',
  },
  buttonFullWidth: {
    alignSelf: 'stretch',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  buttonPrimaryText: {
    color: '#38420d',
  },
  buttonSecondaryText: {
    color: StorefrontPalette.text,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: StorefrontPalette.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: StorefrontPalette.text,
    backgroundColor: 'rgba(18, 24, 14, 0.54)',
  },
  inputTall: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cardTitle: {
    color: StorefrontPalette.text,
    fontSize: 18,
    fontWeight: '800',
  },
  cardCopy: {
    color: StorefrontPalette.textSoft,
    lineHeight: 20,
  },
  cardCopyMuted: {
    color: StorefrontPalette.textMuted,
    lineHeight: 20,
  },
});

export const storefrontStyles = styles;
