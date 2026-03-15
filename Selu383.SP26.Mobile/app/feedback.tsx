import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "@/constants/api";

const AMBER = "#C47D2B";
const BROWN = "#3C1F0F";
const CREAM = "#FAF7F2";

export default function FeedbackScreen() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Rate your experience", "Please select a star rating.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) throw new Error("Failed to submit feedback.");
      Alert.alert("Thanks!", "Your feedback has been submitted.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Leave Feedback</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>How was your experience?</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setRating(s)}>
              <Text style={[styles.star, s <= rating && styles.starActive]}>★</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Comments (optional)</Text>
        <TextInput
          style={styles.textarea}
          multiline
          numberOfLines={5}
          placeholder="Tell us about your visit..."
          value={comment}
          onChangeText={setComment}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "Submitting..." : "Submit Feedback"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  header: { padding: 16, paddingTop: 56, backgroundColor: BROWN, flexDirection: "row", alignItems: "center", gap: 16 },
  back: { color: "#fff", fontSize: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#fff" },
  content: { padding: 24 },
  label: { fontSize: 16, fontWeight: "700", color: BROWN, marginTop: 20, marginBottom: 12 },
  stars: { flexDirection: "row", gap: 8 },
  star: { fontSize: 40, color: "#ddd" },
  starActive: { color: AMBER },
  textarea: { backgroundColor: "#fff", borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: "#ddd", minHeight: 120 },
  btn: { backgroundColor: AMBER, padding: 16, borderRadius: 25, alignItems: "center", marginTop: 28 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
