import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { rewardsService } from '@/services/rewardsService';
import { useAuth } from '@/store/authStore';
import { useRewards } from '@/store/rewardsStore';
import { FIRST_TIER_THRESHOLD, POINTS_PER_DOLLAR } from '@/utils/rewardsProgram';

const programSteps = [
  {
    label: 'Join',
    title: '10% off your first order',
    description: 'Create your Lions account and start with a clear welcome perk.',
  },
  {
    label: 'Earn',
    title: '10 points for every $1 spent',
    description: 'Every qualifying order keeps the math simple and easy to explain.',
  },
  {
    label: 'Redeem',
    title: '1000 points = choose a reward',
    description: 'Hit 1000 Lions and choose from drinks, pastries, breakfast, or cake and sweets.',
  },
  {
    label: 'Birthday',
    title: 'Birthday month treat',
    description: 'Add your birthday in your profile so we can celebrate with you during your birthday month.',
  },
] as const;

const clientFacingSummary =
  'Members earn 10 points per dollar, and once they reach 1,000 points, they can choose a reward.';

export default function RewardsScreen() {
  const { user } = useAuth();
  const { balance, refresh, rewards } = useRewards();
  const [redeeming, setRedeeming] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const availablePoints = balance?.points ?? user?.points ?? 0;
  const rewardsReady = Math.floor(availablePoints / FIRST_TIER_THRESHOLD);
  const pointsToReward = Math.max(FIRST_TIER_THRESHOLD - availablePoints, 0);

  async function handleRedeem(rewardId: number, pointsCost: number) {
    if (!user) {
      router.push('/Auth/login');
      return;
    }
    if ((balance?.points ?? 0) < pointsCost) {
      setMessage('Not enough Lions to redeem this reward.');
      return;
    }
    setRedeeming(rewardId);
    setMessage('');
    try {
      const result = await rewardsService.redeem(rewardId);
      setMessage(result.message ?? 'Reward redeemed successfully!');
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Redemption failed. Please try again.');
    } finally {
      setRedeeming(null);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Lions Rewards</Text>
        <Text style={styles.balanceValue}>{availablePoints}</Text>
        <Text style={styles.balanceLabel}>
          {user
            ? rewardsReady > 0
              ? `${rewardsReady} reward${rewardsReady === 1 ? '' : 's'} ready to redeem.`
              : `${pointsToReward} Lions until your next reward.`
            : 'Login to start earning and tracking Lions.'}
        </Text>
        <View style={styles.programMeta}>
          <Text style={styles.programMetaText}>{POINTS_PER_DOLLAR} points per $1</Text>
          <Text style={styles.programMetaText}>{FIRST_TIER_THRESHOLD} points = choose a reward</Text>
          <Text style={styles.programMetaText}>Birthday month treat</Text>
        </View>
        {!user && (
          <Pressable style={styles.loginButton} onPress={() => router.push('/Auth/login')}>
            <Text style={styles.loginButtonText}>Login to join</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Simple, clear rewards</Text>
        <Text style={styles.summaryText}>{clientFacingSummary}</Text>
      </View>

      {message ? (
        <View style={styles.messageCard}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      {programSteps.map((step) => (
        <View key={step.title} style={styles.programCard}>
          <Text style={styles.programLabel}>{step.label}</Text>
          <Text style={styles.programTitle}>{step.title}</Text>
          <Text style={styles.programCopy}>{step.description}</Text>
        </View>
      ))}

      {rewards.map((reward) => {
        const canRedeem = user && (balance?.points ?? 0) >= reward.pointsCost;
        return (
          <View key={reward.id} style={styles.rewardCard}>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>{reward.name}</Text>
              <Text style={styles.rewardCopy}>{reward.description}</Text>
              <Text style={styles.rewardMeta}>{reward.pointsCost} Lions</Text>
            </View>
            <Pressable
              style={[
                styles.redeemButton,
                !canRedeem && styles.redeemButtonDisabled,
                redeeming === reward.id && styles.redeemButtonDisabled,
              ]}
              onPress={() => handleRedeem(reward.id, reward.pointsCost)}
              disabled={redeeming === reward.id}>
              <Text style={styles.redeemButtonText}>
                {redeeming === reward.id
                  ? 'Redeeming...'
                  : !user
                    ? 'Sign in'
                    : canRedeem
                      ? 'Redeem now'
                      : `${reward.pointsCost - (balance?.points ?? 0)} more`}
              </Text>
            </Pressable>
          </View>
        );
      })}

      {rewards.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No reward loaded yet.</Text>
          <Text style={styles.emptyText}>Check back soon for the current Lions redemption.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6efe7' },
  content: { gap: 14, padding: 20, paddingBottom: 40 },
  heroCard: {
    borderRadius: 28,
    backgroundColor: '#40261a',
    padding: 20,
    gap: 6,
  },
  eyebrow: { color: '#f2c57d', textTransform: 'uppercase', letterSpacing: 2, fontSize: 12 },
  balanceValue: { color: '#fffaf4', fontSize: 42, fontWeight: '700', marginTop: 10 },
  balanceLabel: { color: '#eadcd1', marginTop: 6, lineHeight: 20 },
  programMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 10 },
  programMetaText: {
    color: '#f2c57d',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  loginButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#f2c57d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 10,
  },
  loginButtonText: { color: '#40261a', fontWeight: '700' },
  summaryCard: {
    borderRadius: 22,
    backgroundColor: '#fffaf4',
    padding: 16,
    gap: 8,
  },
  summaryTitle: { color: '#1f1a17', fontSize: 18, fontWeight: '700' },
  summaryText: { color: '#6c5b4d', lineHeight: 20 },
  messageCard: {
    borderRadius: 14,
    backgroundColor: '#fffaf4',
    padding: 12,
  },
  messageText: { color: '#1a6b2a', fontWeight: '600' },
  programCard: {
    borderRadius: 22,
    backgroundColor: '#fffaf4',
    padding: 16,
    gap: 6,
  },
  programLabel: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#ece4c8',
    color: '#7d6220',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  programTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  programCopy: { color: '#6c5b4d', lineHeight: 20 },
  rewardCard: {
    borderRadius: 22,
    backgroundColor: '#fffaf4',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rewardInfo: { flex: 1, gap: 4 },
  rewardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  rewardCopy: { color: '#6c5b4d', marginTop: 2, lineHeight: 20 },
  rewardMeta: { color: '#8a5124', fontWeight: '700', fontSize: 13, marginTop: 4 },
  redeemButton: {
    borderRadius: 999,
    backgroundColor: '#1d2d3c',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  redeemButtonDisabled: { opacity: 0.4 },
  redeemButtonText: { color: '#fffaf4', fontWeight: '700', fontSize: 13 },
  emptyCard: {
    borderRadius: 22,
    backgroundColor: '#fffaf4',
    padding: 16,
    gap: 6,
  },
  emptyTitle: { color: '#1f1a17', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyText: { color: '#6c5b4d', textAlign: 'center' },
});
