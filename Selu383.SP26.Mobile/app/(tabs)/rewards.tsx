import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRewards } from '@/store/rewardsStore';

export default function RewardsScreen() {
  const { balance, rewards } = useRewards();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Stars and offers</Text>
        <Text style={styles.balanceValue}>{balance?.points ?? 0}</Text>
        <Text style={styles.balanceLabel}>
          {balance ? `${balance.currentTier} tier • ${balance.pointsToNextTier} to ${balance.nextTier}` : 'Login to unlock tiers'}
        </Text>
      </View>

      {rewards.map((reward) => (
        <View key={reward.id} style={styles.rewardCard}>
          <View>
            <Text style={styles.rewardTitle}>{reward.name}</Text>
            <Text style={styles.rewardCopy}>{reward.description}</Text>
          </View>
          <Text style={styles.rewardMeta}>
            {reward.pointsCost} stars • {reward.tierName}
          </Text>
        </View>
      ))}
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
  },
  eyebrow: { color: '#f2c57d', textTransform: 'uppercase', letterSpacing: 2 },
  balanceValue: { color: '#fffaf4', fontSize: 42, fontWeight: '700', marginTop: 10 },
  balanceLabel: { color: '#eadcd1', marginTop: 6 },
  rewardCard: {
    gap: 10,
    borderRadius: 22,
    backgroundColor: '#fffaf4',
    padding: 16,
  },
  rewardTitle: { fontSize: 17, fontWeight: '700', color: '#1f1a17' },
  rewardCopy: { color: '#6c5b4d', marginTop: 6 },
  rewardMeta: { color: '#8a5124', fontWeight: '700' },
});
