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

export default function AccommodationDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { destination, budget, days } = route.params;
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTier, setSelectedTier] = useState("all");

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, type: "hotels", budget, days }),
      });
      const json = await res.json();
      if (json.success) {
        let raw = json.data;
        const start = raw.indexOf("[");
        const end = raw.lastIndexOf("]");
        if (start !== -1 && end !== -1) raw = raw.substring(start, end + 1);
        setHotels(JSON.parse(raw));
      } else {
        setError("Could not load hotels");
      }
    } catch {
      setError("Network error — check backend");
    } finally {
      setLoading(false);
    }
  };

  const tiers = ["all", "budget", "midrange", "luxury"];
  const tierLabels = {
    all: "All",
    budget: "💰 Budget",
    midrange: "🏩 Mid",
    luxury: "🏰 Luxury",
  };
  const tierColors = {
    budget: "#00c853",
    midrange: "#ff9800",
    luxury: theme.primary,
  };

  const filtered =
    selectedTier === "all"
      ? hotels
      : hotels.filter((h) => h.tier === selectedTier);

  const openBooking = (name) =>
    Linking.openURL(
      `https://www.booking.com/search.html?ss=${encodeURIComponent(destination + " " + name)}`,
    );
  const openAgoda = (name) =>
    Linking.openURL(
      `https://www.agoda.com/search?city=${encodeURIComponent(destination)}&searchText=${encodeURIComponent(name)}`,
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
          <Text style={styles.headerTitle}>🏨 Where to Stay</Text>
          <Text style={styles.headerSubtitle}>{destination}</Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={fetchHotels}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingTop: 110 }}
      >
        <View style={[styles.budgetCard, { backgroundColor: theme.primary }]}>
          <Text style={styles.budgetAmount}>${budget}</Text>
          <Text style={styles.budgetLabel}>Accommodation Budget</Text>
          <Text style={styles.budgetSub}>
            ${Math.round(budget / days)}/night · {days} nights
          </Text>
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
              Finding best hotels in {destination}...
            </Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.primary }]}
              onPress={fetchHotels}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading &&
          !error &&
          filtered.map((hotel, index) => (
            <View key={index} style={styles.card}>
              <View
                style={[
                  styles.tierBadge,
                  { backgroundColor: tierColors[hotel.tier] || theme.primary },
                ]}
              >
                <Text style={styles.tierText}>{hotel.tier?.toUpperCase()}</Text>
              </View>
              <View style={styles.cardTop}>
                <View style={styles.cardTopLeft}>
                  <Text style={styles.hotelName}>{hotel.name}</Text>
                  <Text style={styles.hotelType}>
                    {hotel.type} · 📍 {hotel.area}
                  </Text>
                </View>
                <View style={styles.ratingBox}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>{hotel.rating}</Text>
                </View>
              </View>
              <Text style={styles.hotelDesc}>{hotel.description}</Text>
              <Text style={styles.hotelPrice}>
                {hotel.price_per_night} / night
              </Text>
              {hotel.highlights && (
                <View style={styles.highlights}>
                  {hotel.highlights.map((h, i) => (
                    <View
                      key={i}
                      style={[
                        styles.highlightTag,
                        { backgroundColor: theme.primary + "18" },
                      ]}
                    >
                      <Text
                        style={[styles.highlightText, { color: theme.primary }]}
                      >
                        ✓ {h}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.bookBtn, { backgroundColor: theme.primary }]}
                  onPress={() => openBooking(hotel.name)}
                >
                  <Ionicons name="bed-outline" size={16} color="#fff" />
                  <Text style={styles.bookBtnText}>Booking.com</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.bookBtn, { backgroundColor: "#ff5722" }]}
                  onPress={() => openAgoda(hotel.name)}
                >
                  <Ionicons name="open-outline" size={16} color="#fff" />
                  <Text style={styles.bookBtnText}>Agoda</Text>
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
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  budgetAmount: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  budgetLabel: { fontSize: 14, color: "#e0e0e0", marginTop: 4 },
  budgetSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
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
  hotelName: { fontSize: 16, fontWeight: "700", color: "#333" },
  hotelType: { fontSize: 12, color: "#888", marginTop: 2 },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8DC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: { fontSize: 14, fontWeight: "600", color: "#333", marginLeft: 4 },
  hotelDesc: { fontSize: 14, color: "#666", lineHeight: 20, marginBottom: 8 },
  hotelPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00c853",
    marginBottom: 10,
  },
  highlights: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  highlightTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  highlightText: { fontSize: 12, fontWeight: "500" },
  buttonRow: { flexDirection: "row", gap: 8 },
  bookBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bookBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
