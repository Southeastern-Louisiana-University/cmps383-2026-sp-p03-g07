import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { getPoints, getRewards, redeemReward, Reward, UserPointsDto } from "@/hooks/services/rewardsService";

const AMBER = "#C47D2B";
const BROWN = "#3C1F0F";
const CREAM = "#FAF7F2";

export default function RewardsScreen() {
  const [points, setPoints] = useState<UserPointsDto | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const load = async () => {
    try {
      const [p, r] = await Promise.all([getPoints(), getRewards()]);
      setPoints(p);
      setRewards(r);
    } catch {
      setError("Please log in to view rewards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRedeem = async (reward: Reward) => {
    if (!points || points.balance < reward.pointCost) {
      Alert.alert("Not enough points", `You need ${reward.pointCost} points.`);
      return;
    }
    try {
      await redeemReward(reward.id);
      Alert.alert("Redeemed!", `${reward.name} redeemed successfully.`);
      load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={AMBER} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rewards</Text>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.push("/Auth/login")}>
            <Text style={styles.btnText}>Log In</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Your Points</Text>
            <Text style={styles.balanceValue}>{points?.balance ?? 0}</Text>
          </View>

          <Text style={styles.sectionTitle}>Available Rewards</Text>
          <FlatList
            data={rewards.filter((r) => r.isActive)}
            keyExtractor={(r) => String(r.id)}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rewardName}>{item.name}</Text>
                  <Text style={styles.rewardDesc}>{item.description}</Text>
                  <Text style={styles.rewardCost}>{item.pointCost} pts</Text>
                </View>
                <TouchableOpacity
                  style={[styles.redeemBtn, (points?.balance ?? 0) < item.pointCost && styles.redeemBtnDisabled]}
                  onPress={() => handleRedeem(item)}
                >
                  <Text style={styles.redeemBtnText}>Redeem</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { padding: 16, paddingTop: 56, backgroundColor: BROWN },
  title: { fontSize: 24, fontWeight: "700", color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { color: "#666", marginBottom: 16, textAlign: "center" },
  btn: { backgroundColor: AMBER, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 25 },
  btnText: { color: "#fff", fontWeight: "700" },
  balanceCard: { margin: 16, padding: 24, backgroundColor: BROWN, borderRadius: 16, alignItems: "center" },
  balanceLabel: { color: "#ccc", fontSize: 14 },
  balanceValue: { color: AMBER, fontSize: 48, fontWeight: "700" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: BROWN, marginLeft: 16, marginTop: 4 },
  card: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, alignItems: "center", elevation: 1 },
  rewardName: { fontSize: 16, fontWeight: "700", color: BROWN },
  rewardDesc: { color: "#666", fontSize: 13, marginTop: 2 },
  rewardCost: { color: AMBER, fontWeight: "700", marginTop: 4 },
  redeemBtn: { backgroundColor: AMBER, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  redeemBtnDisabled: { backgroundColor: "#ccc" },
  redeemBtnText: { color: "#fff", fontWeight: "700" },
});
