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

export default function ActivitiesDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { destination, budget, days, cityData } = route.params;
  const [selectedType, setSelectedType] = useState("All");
  const [aiAttractions, setAiAttractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasLocalData = cityData?.attractions?.length > 0;

  useEffect(() => {
    if (!hasLocalData) fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, type: "activities", budget, days }),
      });
      const json = await res.json();
      if (json.success) {
        let raw = json.data;
        const start = raw.indexOf("[");
        const end = raw.lastIndexOf("]");
        if (start !== -1 && end !== -1) raw = raw.substring(start, end + 1);
        setAiAttractions(JSON.parse(raw));
      } else {
        setError("Could not load activities");
      }
    } catch {
      setError("Network error — check backend");
    } finally {
      setLoading(false);
    }
  };

  const attractions = hasLocalData ? cityData.attractions : aiAttractions;
  const types = ["All", ...new Set(attractions.map((a) => a.type))];
  const filtered =
    selectedType === "All"
      ? attractions
      : attractions.filter((a) => a.type === selectedType);

  const openViator = (name) =>
    Linking.openURL(
      `https://www.viator.com/searchResults/all?text=${encodeURIComponent(destination + " " + name)}`,
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
          <Text style={styles.headerTitle}>🎭 Activities</Text>
          <Text style={styles.headerSubtitle}>{destination}</Text>
        </View>
        {!hasLocalData ? (
          <TouchableOpacity style={styles.backButton} onPress={fetchActivities}>
            <Ionicons name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingTop: 110 }}
      >
        <View style={[styles.budgetInfo, { backgroundColor: theme.primary }]}>
          <Text style={styles.budgetInfoText}>
            Activities Budget: ${budget}
          </Text>
          <Text style={styles.budgetInfoSubtext}>
            {loading ? "Loading..." : `${attractions.length} attractions found`}
          </Text>
        </View>

        {attractions.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {types.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  selectedType === type && [
                    styles.filterButtonActive,
                    {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                  ],
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedType === type && styles.filterTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>
              Finding activities in {destination}...
            </Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.primary }]}
              onPress={fetchActivities}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading &&
          !error &&
          filtered.map((item, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: theme.primary + "18" },
                    ]}
                  >
                    <Text style={[styles.typeText, { color: theme.primary }]}>
                      {item.type}
                    </Text>
                  </View>
                </View>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              </View>
              <Text style={styles.cardDesc}>{item.description}</Text>
              {item.isUNESCO && (
                <View style={styles.unescoTag}>
                  <Text style={styles.unescoText}>
                    🏛️ UNESCO World Heritage
                  </Text>
                </View>
              )}
              {item.cost > 0 ? (
                <Text style={styles.costText}>💰 ~${item.cost} entry</Text>
              ) : (
                <Text style={styles.freeText}>✅ Free to visit</Text>
              )}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => openViator(item.name)}
                >
                  <Ionicons name="ticket-outline" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Book Tour</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#00c853" }]}
                  onPress={() => openMaps(item.name)}
                >
                  <Ionicons name="map-outline" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Maps</Text>
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
  budgetInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
  },
  budgetInfoText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  budgetInfoSubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  filterScroll: { marginBottom: 16 },
  filterButton: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  filterButtonActive: {},
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardHeaderLeft: { flex: 1, marginRight: 8 },
  cardName: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 4 },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  typeText: { fontSize: 11, fontWeight: "600" },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8DC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: { fontSize: 14, fontWeight: "600", color: "#333", marginLeft: 4 },
  cardDesc: { fontSize: 14, color: "#666", lineHeight: 20, marginBottom: 8 },
  unescoTag: {
    backgroundColor: "#fff3cd",
    padding: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  unescoText: { fontSize: 12, color: "#856404", fontWeight: "600" },
  costText: {
    fontSize: 13,
    color: "#ff9800",
    fontWeight: "600",
    marginBottom: 8,
  },
  freeText: {
    fontSize: 13,
    color: "#00c853",
    fontWeight: "600",
    marginBottom: 8,
  },
  buttonRow: { flexDirection: "row", gap: 8 },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
