import React, { useState, useEffect, useCallback } from "react";
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

export default function FoodDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { destination, budget, days, members = 1 } = route.params;
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTier, setSelectedTier] = useState("all");
  const [selectedDiet, setSelectedDiet] = useState("Both");

  useEffect(() => {
    fetchFood();
  }, []);

  const fetchFood = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          type: "food",
          budget,
          days,
          members,
        }),
      });
      const json = await res.json();
      if (json.success) {
        let raw = json.data;
        const start = raw.indexOf("[");
        const end = raw.lastIndexOf("]");
        if (start !== -1 && end !== -1) raw = raw.substring(start, end + 1);
        setRestaurants(JSON.parse(raw));
      } else {
        setError("Could not load restaurants");
      }
    } catch {
      setError("Network error — check backend");
    } finally {
      setLoading(false);
    }
  };

  const tiers = ["all", "affordable", "midrange", "finedining"];
  const tierLabels = {
    all: "All",
    affordable: "💰 Cheap",
    midrange: "🍽️ Mid",
    finedining: "💎 Fine",
  };
  const tierColors = {
    affordable: "#00c853",
    midrange: "#ff9800",
    finedining: theme.primary,
  };
  const diets = ["Both", "Veg", "Non-Veg"];

  const filtered = restaurants.filter((r) => {
    const tierMatch = selectedTier === "all" || r.tier === selectedTier;
    const dietMatch =
      selectedDiet === "Both" ||
      r.dietary === selectedDiet ||
      r.dietary === "Both";
    return tierMatch && dietMatch;
  });

  const openZomato = (name) =>
    Linking.openURL(
      `https://www.zomato.com/search?q=${encodeURIComponent(destination + " " + name)}`,
    );
  const openMaps = (name) =>
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + destination)}`,
    );

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
          <Text style={styles.headerTitle}>🍽️ Food & Dining</Text>
          <Text style={styles.headerSubtitle}>{destination}</Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={fetchFood}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingTop: 110 }}
      >
        <View style={styles.budgetCard}>
          <Text style={styles.budgetAmount}>${budget}</Text>
          <Text style={styles.budgetLabel}>Food Budget</Text>
          <Text style={styles.budgetSub}>
            ${Math.round(budget / days / members)}/person/day · {days} days
          </Text>
        </View>

        <View style={styles.dietRow}>
          {diets.map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.dietBtn,
                selectedDiet === d && {
                  backgroundColor:
                    d === "Veg"
                      ? "#00c853"
                      : d === "Non-Veg"
                        ? "#f44336"
                        : theme.primary,
                  borderColor: "transparent",
                },
              ]}
              onPress={() => setSelectedDiet(d)}
            >
              <Text
                style={[
                  styles.dietText,
                  selectedDiet === d && { color: "#fff" },
                ]}
              >
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
        >
          {tiers.map((tier) => (
            <TouchableOpacity
              key={tier}
              style={[
                styles.filterBtn,
                selectedTier === tier && [
                  styles.filterBtnActive,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                  },
                ],
              ]}
              onPress={() => setSelectedTier(tier)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedTier === tier && styles.filterTextActive,
                ]}
              >
                {tierLabels[tier]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>
              Finding best restaurants in {destination}...
            </Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.primary }]}
              onPress={fetchFood}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading &&
          !error &&
          filtered.map((r, index) => (
            <View key={index} style={styles.card}>
              <View
                style={[
                  styles.tierBadge,
                  { backgroundColor: tierColors[r.tier] || theme.primary },
                ]}
              >
                <Text style={styles.tierText}>{r.tier?.toUpperCase()}</Text>
              </View>
              <View style={styles.cardTop}>
                <View style={styles.cardTopLeft}>
                  <Text style={styles.restName}>{r.name}</Text>
                  <Text style={styles.restInfo}>
                    {r.cuisine} · 📍 {r.area}
                  </Text>
                </View>
                <View style={styles.ratingBox}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>{r.rating}</Text>
                </View>
              </View>
              <Text style={styles.restDesc}>{r.description}</Text>
              <View style={styles.infoRow}>
                <View style={styles.priceTag}>
                  <Text style={styles.priceText}>{r.price_per_meal}</Text>
                </View>
                <View
                  style={[
                    styles.dietTag,
                    {
                      backgroundColor:
                        r.dietary === "Veg"
                          ? "#e8f5e9"
                          : r.dietary === "Non-Veg"
                            ? "#fce4ec"
                            : "#fff3e0",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dietTagText,
                      {
                        color:
                          r.dietary === "Veg"
                            ? "#00c853"
                            : r.dietary === "Non-Veg"
                              ? "#f44336"
                              : "#ff9800",
                      },
                    ]}
                  >
                    {r.dietary}
                  </Text>
                </View>
              </View>
              {r.must_try && (
                <View style={styles.mustTryBox}>
                  <Text style={styles.mustTryText}>
                    🍴 Must try:{" "}
                    <Text style={{ fontWeight: "700" }}>{r.must_try}</Text>
                  </Text>
                </View>
              )}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => openZomato(r.name)}
                >
                  <Ionicons name="restaurant-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Zomato</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#00c853" }]}
                  onPress={() => openMaps(r.name)}
                >
                  <Ionicons name="map-outline" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Maps</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

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
    backgroundColor: "#ff9800",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  budgetAmount: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  budgetLabel: { fontSize: 14, color: "#fff", marginTop: 4 },
  budgetSub: { fontSize: 13, color: "#fff3e0", marginTop: 2 },
  dietRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  dietBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  dietText: { fontSize: 13, fontWeight: "600", color: "#666" },
  filterRow: { marginBottom: 16 },
  filterBtn: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  filterBtnActive: {},
  filterText: { fontSize: 13, fontWeight: "600", color: "#666" },
  filterTextActive: { color: "#fff" },
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
    marginBottom: 14,
    elevation: 3,
    overflow: "hidden",
  },
  tierBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomLeftRadius: 12,
  },
  tierText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
    marginTop: 4,
  },
  cardTopLeft: { flex: 1, marginRight: 8 },
  restName: { fontSize: 16, fontWeight: "700", color: "#333" },
  restInfo: { fontSize: 12, color: "#888", marginTop: 2 },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8DC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: { fontSize: 14, fontWeight: "600", color: "#333", marginLeft: 4 },
  restDesc: { fontSize: 14, color: "#666", lineHeight: 20, marginBottom: 10 },
  infoRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  priceTag: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: { fontSize: 14, fontWeight: "700", color: "#00c853" },
  dietTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dietTagText: { fontSize: 12, fontWeight: "600" },
  mustTryBox: {
    backgroundColor: "#fff8e1",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  mustTryText: { fontSize: 13, color: "#ff8f00" },
  buttonRow: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
