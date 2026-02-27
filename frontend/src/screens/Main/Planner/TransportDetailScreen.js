import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";

const API_URL = "https://voyagehub-backend.onrender.com";
const TRANSPORT_ICONS = {
  Flight: "airplane",
  Train: "train",
  Bus: "bus",
  Metro: "subway",
  Taxi: "car",
  Ferry: "boat",
  "Taxi/Uber": "car",
  Tuk: "bicycle",
  Walk: "walk",
};

export default function TransportDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { destination, budget, days, members = 1 } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransport();
  }, []);

  const fetchTransport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          type: "transport",
          budget,
          days,
          members,
        }),
      });
      const json = await res.json();
      if (json.success) {
        let raw = json.data;
        const start = raw.indexOf("{");
        const end = raw.lastIndexOf("}");
        if (start !== -1 && end !== -1) raw = raw.substring(start, end + 1);
        setData(JSON.parse(raw));
      } else {
        setError("Could not load transport info");
      }
    } catch {
      setError("Network error — check backend");
    } finally {
      setLoading(false);
    }
  };

  const providerURLs = {
    Skyscanner: "https://www.skyscanner.com",
    Trainline: "https://www.thetrainline.com",
    FlixBus: "https://www.flixbus.com",
    Uber: "https://m.uber.com",
    Ola: "https://www.olacabs.com",
  };

  const openLink = (provider, url) => {
    const link =
      url ||
      providerURLs[provider] ||
      `https://www.google.com/search?q=${encodeURIComponent(provider + " " + destination)}`;
    Linking.openURL(link);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🚕 Transport</Text>
          <Text style={styles.headerSubtitle}>{destination}</Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={fetchTransport}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingTop: 110 }}
      >
        <View style={[styles.budgetCard, { backgroundColor: theme.primary }]}>
          <Text style={styles.budgetAmount}>${budget}</Text>
          <Text style={styles.budgetLabel}>Transport Budget</Text>
          <Text style={styles.budgetSub}>
            ${Math.round(budget / days)}/day · {days} days
          </Text>
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>
              Getting transport options for {destination}...
            </Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.primary }]}
              onPress={fetchTransport}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && data && (
          <>
            <Text style={styles.sectionTitle}>🌍 Getting to {destination}</Text>
            {data.getting_there?.map((option, i) => (
              <View key={i} style={styles.card}>
                <View style={styles.cardRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: theme.primary + "18" },
                    ]}
                  >
                    <Ionicons
                      name={TRANSPORT_ICONS[option.type] || "navigate"}
                      size={26}
                      color={theme.primary}
                    />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.optionType}>{option.type}</Text>
                    <Text style={styles.optionMeta}>
                      {option.price_range} · ⏱️ {option.duration}
                    </Text>
                  </View>
                  <Text style={styles.priceText}>{option.price_range}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.bookBtn, { backgroundColor: theme.primary }]}
                  onPress={() => openLink(option.provider, option.url)}
                >
                  <Ionicons name="open-outline" size={16} color="#fff" />
                  <Text style={styles.bookBtnText}>
                    Search on {option.provider}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}

            <Text style={styles.sectionTitle}>🗺️ Getting Around</Text>

            {data.best_app && (
              <View style={styles.appCard}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={22}
                  color={theme.primary}
                />
                <Text style={styles.appText}>
                  Best local app:{" "}
                  <Text style={{ fontWeight: "700", color: theme.primary }}>
                    {data.best_app}
                  </Text>
                </Text>
              </View>
            )}

            {data.daily_budget && (
              <View style={styles.appCard}>
                <Ionicons name="cash-outline" size={22} color="#00c853" />
                <Text style={styles.appText}>
                  Estimated daily transport:{" "}
                  <Text style={{ fontWeight: "700", color: "#00c853" }}>
                    {data.daily_budget}
                  </Text>
                </Text>
              </View>
            )}

            {data.getting_around?.map((option, i) => (
              <View key={i} style={styles.aroundCard}>
                <View style={styles.aroundTop}>
                  <View
                    style={[
                      styles.iconCircleSmall,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <Ionicons
                      name={TRANSPORT_ICONS[option.type] || "navigate"}
                      size={20}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.aroundInfo}>
                    <Text style={styles.aroundType}>{option.type}</Text>
                    <Text style={styles.aroundCost}>{option.cost}</Text>
                  </View>
                </View>
                <Text style={styles.aroundDesc}>{option.description}</Text>
                {option.tip && (
                  <View style={styles.tipBox}>
                    <Text style={styles.tipText}>💡 {option.tip}</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 40,
    paddingHorizontal: 16,
    zIndex: 1000,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  headerSubtitle: { fontSize: 14, color: "#e0e0e0" },
  content: { flex: 1, padding: 16 },
  budgetCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  budgetAmount: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  budgetLabel: { fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 4 },
  budgetSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 2 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    marginTop: 8,
  },
  loadingBox: { alignItems: "center", paddingVertical: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: "#666" },
  errorBox: { alignItems: "center", padding: 24 },
  errorText: { fontSize: 15, color: "#f44336", marginBottom: 12 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
  },
  cardRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  optionType: { fontSize: 16, fontWeight: "700", color: "#333" },
  optionMeta: { fontSize: 13, color: "#888", marginTop: 2 },
  priceText: { fontSize: 16, fontWeight: "700", color: "#00c853" },
  bookBtn: {
    flexDirection: "row",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bookBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  appCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 2,
  },
  appText: { fontSize: 14, color: "#333", flex: 1 },
  aroundCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  aroundTop: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  iconCircleSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  aroundInfo: { flex: 1 },
  aroundType: { fontSize: 15, fontWeight: "700", color: "#333" },
  aroundCost: { fontSize: 13, color: "#00c853", fontWeight: "600" },
  aroundDesc: { fontSize: 14, color: "#666", lineHeight: 20, marginBottom: 6 },
  tipBox: { backgroundColor: "#fff8e1", padding: 8, borderRadius: 8 },
  tipText: { fontSize: 13, color: "#ff8f00" },
});
