import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { rewardsService } from '@/services/rewardsService';
import { useAuth } from '@/store/authStore';
import { useRewards } from '@/store/rewardsStore';
import { getRewardProgress, POINTS_PER_DOLLAR, REWARD_THRESHOLD } from '@/utils/rewardsProgram';

export default function RewardsScreen() {
  const { user } = useAuth();
  const { balance, refresh, rewards } = useRewards();
  const [redeeming, setRedeeming] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const points = balance?.points ?? user?.points ?? 0;
  const progress = getRewardProgress(points);
  const pointsWord = progress.pointsToNextReward === 1 ? 'pt' : 'pts';

  async function handleRedeem(rewardId: number, pointsCost: number) {
    if (!user) {
      router.push('/Auth/login');
      return;
    }
    if ((balance?.points ?? 0) < pointsCost) {
      setMessage('Not enough points to redeem this reward.');
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
        <Text style={styles.eyebrow}>Rewards</Text>
        <Text style={styles.balanceValue}>{points}</Text>
        <Text style={styles.balanceLabel}>
          Earn {POINTS_PER_DOLLAR} pts / $1 •{' '}
          {progress.availableRewards > 0
            ? `${progress.availableRewards} reward${progress.availableRewards === 1 ? '' : 's'} ready`
            : `${progress.pointsToNextReward} ${pointsWord} to ${REWARD_THRESHOLD}`}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, (progress.progressPoints / REWARD_THRESHOLD) * 100)}%` },
            ]}
          />
        </View>
        {!user && (
          <Pressable style={styles.loginButton} onPress={() => router.push('/Auth/login')}>
            <Text style={styles.loginButtonText}>Login to earn points</Text>
          </Pressable>
        )}
      </View>

      {message ? (
        <View style={styles.messageCard}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      {rewards.map((reward) => {
        const canRedeem = user && (balance?.points ?? 0) >= reward.pointsCost;
        return (
          <View key={reward.id} style={styles.rewardCard}>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>{reward.name}</Text>
              <Text style={styles.rewardCopy}>{reward.description}</Text>
              <Text style={styles.rewardMeta}>
                {reward.pointsCost} points
              </Text>
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
                {redeeming === reward.id ? 'Redeeming...' : 'Redeem'}
              </Text>
            </Pressable>
          </View>
        );
      })}

      {rewards.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No rewards available right now. Check back soon!</Text>
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
  balanceLabel: { color: '#eadcd1', marginTop: 6 },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,250,244,0.18)',
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#f2c57d',
  },
  loginButton: {
    alignSelf: 'center',
    borderRadius: 999,
    backgroundColor: '#f2c57d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 10,
  },
  loginButtonText: { color: '#40261a', fontWeight: '700', textAlign: 'center' },
  messageCard: {
    borderRadius: 14,
    backgroundColor: '#fffaf4',
    padding: 12,
  },
  messageText: { color: '#1a6b2a', fontWeight: '600' },
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
  rewardCopy: { color: '#6c5b4d', marginTop: 2 },
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
  },
  emptyText: { color: '#6c5b4d', textAlign: 'center' },
});
