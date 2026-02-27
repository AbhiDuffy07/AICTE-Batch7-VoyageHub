import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/ThemeContext";

const SLOT_COLORS = {
  morning: "#ff9800",
  afternoon: "#03a9f4",
  evening: "#7c4dff",
};
const SLOT_LABELS = {
  morning: "MORNING",
  afternoon: "AFTERNOON",
  evening: "EVENING",
};

export default function TripDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { trip } = route.params;
  const [expandedDay, setExpandedDay] = useState(1);

  let days = [];
  try {
    const raw =
      typeof trip.itinerary === "string"
        ? trip.itinerary
        : JSON.stringify(trip.itinerary);
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start !== -1 && end !== -1)
      days = JSON.parse(raw.substring(start, end + 1));
  } catch {}

  const budget = trip.budget || 1000;
  const members = trip.num_people || 1;
  const groupType = trip.group_type || "solo";

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my ${trip.days}-day trip to ${trip.destination}! 🌍✈️`,
      });
    } catch {}
  };

  const openMaps = () => {
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.destination)}`,
    );
  };

  // ✅ FIXED — removed cityData: null, screens handle fetching themselves
  const navigateToDetail = (screen) => {
    navigation.navigate(screen, {
      destination: trip.destination,
      budget: Math.round(budget * 0.25),
      days: trip.days,
      members,
    });
  };

  const pills = [
    {
      label: "Stay",
      sub: "Hotels",
      icon: "🏨",
      color: theme.primary,
      screen: "AccommodationDetail",
    },
    {
      label: "Food",
      sub: "Restaurants",
      icon: "🍽️",
      color: "#ff9800",
      screen: "FoodDetail",
    },
    {
      label: "Activities",
      sub: "Things to do",
      icon: "🎭",
      color: "#00897b",
      screen: "ActivitiesDetail",
    },
    {
      label: "Transport",
      sub: "Getting around",
      icon: "🚕",
      color: "#e53935",
      screen: "TransportDetail",
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>✈️ {trip.destination}</Text>
          <Text style={styles.headerSub}>{trip.days} Day Itinerary</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Trip Summary Strip */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Ionicons name="calendar-outline" size={20} color={theme.primary} />
            <Text style={styles.summaryValue}>{trip.days}</Text>
            <Text style={styles.summaryLabel}>Days</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Ionicons name="cash-outline" size={20} color="#00c853" />
            <Text style={styles.summaryValue}>${budget}</Text>
            <Text style={styles.summaryLabel}>Budget</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Ionicons name="people-outline" size={20} color="#ff9800" />
            <Text style={styles.summaryValue}>{members}</Text>
            <Text style={styles.summaryLabel}>{groupType}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryItem}>
            <Ionicons name="time-outline" size={20} color="#e53935" />
            <Text style={styles.summaryValue}>
              {new Date(trip.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </Text>
            <Text style={styles.summaryLabel}>Saved</Text>
          </View>
        </View>

        {/* Map Button */}
        <TouchableOpacity style={styles.mapButton} onPress={openMaps}>
          <Ionicons name="map" size={20} color="#fff" />
          <Text style={styles.mapButtonText}>
            View {trip.destination} on Map
          </Text>
          <Ionicons
            name="open-outline"
            size={16}
            color="rgba(255,255,255,0.7)"
          />
        </TouchableOpacity>

        {/* Explore Pills */}
        <Text style={styles.sectionTitle}>Explore More</Text>
        <View style={styles.pillsGrid}>
          {pills.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.pill, { backgroundColor: item.color }]}
              onPress={() => navigateToDetail(item.screen)}
            >
              <Text style={styles.pillIcon}>{item.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.pillTitle}>{item.label}</Text>
                <Text style={styles.pillSub}>{item.sub}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color="rgba(255,255,255,0.7)"
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Itinerary Days */}
        <Text style={styles.sectionTitle}>Your Itinerary</Text>
        {days.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>Itinerary data unavailable</Text>
          </View>
        ) : (
          days.map((day) => (
            <View key={day.day_number} style={styles.dayCard}>
              <TouchableOpacity
                style={styles.dayHeader}
                onPress={() =>
                  setExpandedDay(
                    expandedDay === day.day_number ? null : day.day_number,
                  )
                }
              >
                <View
                  style={[styles.dayBadge, { backgroundColor: theme.primary }]}
                >
                  <Ionicons name="calendar" size={14} color="#fff" />
                  <Text style={styles.dayBadgeText}>Day {day.day_number}</Text>
                </View>
                <Ionicons
                  name={
                    expandedDay === day.day_number
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>

              {expandedDay === day.day_number && (
                <View style={styles.dayContent}>
                  {["morning", "afternoon", "evening"].map((slot) => {
                    const s = day[slot];
                    if (!s) return null;
                    const isFree =
                      !s.cost ||
                      s.cost === "$0" ||
                      s.cost === 0 ||
                      s.cost === "0";
                    return (
                      <View key={slot} style={styles.slotRow}>
                        <View
                          style={[
                            styles.slotBar,
                            { backgroundColor: SLOT_COLORS[slot] },
                          ]}
                        />
                        <View style={styles.slotContent}>
                          <View style={styles.slotTop}>
                            <Text
                              style={[
                                styles.slotLabel,
                                { color: SLOT_COLORS[slot] },
                              ]}
                            >
                              {SLOT_LABELS[slot]}
                            </Text>
                            <Text
                              style={isFree ? styles.costFree : styles.costPaid}
                            >
                              {isFree ? "Free" : s.cost}
                            </Text>
                          </View>
                          <Text style={styles.slotActivity}>{s.activity}</Text>
                          <Text style={styles.slotDesc}>{s.description}</Text>
                          <TouchableOpacity
                            style={styles.locationRow}
                            onPress={() =>
                              Linking.openURL(
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  s.location + " " + trip.destination,
                                )}`,
                              )
                            }
                          >
                            <Ionicons
                              name="location-outline"
                              size={12}
                              color={theme.primary}
                            />
                            <Text
                              style={[
                                styles.locationText,
                                { color: theme.primary },
                              ]}
                            >
                              {s.location}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 44,
    paddingBottom: 14,
    paddingHorizontal: 16,
    elevation: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  headerSub: { fontSize: 13, color: "#e0e0e0", marginTop: 2 },
  content: { flex: 1, padding: 16 },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
    marginBottom: 12,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryValue: { fontSize: 14, fontWeight: "700", color: "#333" },
  summaryLabel: { fontSize: 11, color: "#888" },
  divider: { width: 1, height: 40, backgroundColor: "#eee" },
  mapButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    elevation: 2,
  },
  mapButtonText: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "600" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  pillsGrid: { gap: 8, marginBottom: 20 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    gap: 12,
    elevation: 2,
  },
  pillIcon: { fontSize: 22 },
  pillTitle: { fontSize: 14, fontWeight: "700", color: "#fff" },
  pillSub: { fontSize: 11, color: "rgba(255,255,255,0.85)" },
  dayCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  dayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dayBadgeText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  dayContent: { paddingHorizontal: 14, paddingBottom: 14 },
  slotRow: { flexDirection: "row", marginBottom: 16, gap: 12 },
  slotBar: { width: 3, borderRadius: 2, minHeight: 70 },
  slotContent: { flex: 1 },
  slotTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  slotLabel: { fontSize: 11, fontWeight: "700" },
  costFree: { fontSize: 12, color: "#00c853", fontWeight: "700" },
  costPaid: { fontSize: 12, color: "#ff9800", fontWeight: "700" },
  slotActivity: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  slotDesc: { fontSize: 13, color: "#666", lineHeight: 18, marginBottom: 6 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 12, fontWeight: "500" },
  emptyBox: { alignItems: "center", padding: 30 },
  emptyText: { fontSize: 14, color: "#999", marginTop: 8 },
});
