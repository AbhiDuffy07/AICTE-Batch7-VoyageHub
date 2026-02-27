import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getTrips, deleteTrip } from "../../../services/supabase";
import CommonHeader from "../../../components/CommonHeader";
import { useTheme } from "../../../context/ThemeContext";

export default function MyTripsScreen({ navigation }) {
  const { theme } = useTheme();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadTrips();
    });
    return unsubscribe;
  }, [navigation]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await getTrips();
      setTrips(data || []);
    } catch {
      Alert.alert("Error", "Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, destination) => {
    Alert.alert(
      "Delete Trip?",
      `Remove "${destination}" from your collection?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTrip(id);
              loadTrips();
              Alert.alert("Deleted! ✅", "Trip removed successfully");
            } catch {
              Alert.alert("Error", "Failed to delete trip");
            }
          },
        },
      ],
    );
  };

  const handleViewTrip = (trip) => {
    navigation.navigate("TripDetail", { trip });
  };

  const getSortedTrips = () => {
    if (filter === "recent")
      return [...trips].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
    if (filter === "oldest")
      return [...trips].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at),
      );
    return trips;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading your trips...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader
        appName="✈️ My Trips"
        tagline={
          trips.length > 0
            ? `${trips.length} saved adventure${trips.length > 1 ? "s" : ""}`
            : "Your adventures await"
        }
        showProfile={true}
        onProfilePress={() => navigation.navigate("Profile")}
      />

      {trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="airplane-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>No Trips Yet</Text>
          <Text style={styles.emptyText}>
            Start planning your adventures and save them here!
          </Text>
          <TouchableOpacity
            style={[styles.planButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate("Planner")}
          >
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={styles.planButtonText}>Plan a Trip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.filterContainer}>
            {["all", "recent", "oldest"].map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterButton,
                  filter === f && [
                    styles.filterButtonActive,
                    {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                  ],
                ]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === f && styles.filterTextActive,
                  ]}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {getSortedTrips().map((trip) => (
              <View key={trip.id} style={styles.tripCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Ionicons name="location" size={20} color={theme.primary} />
                    <Text style={styles.tripDestination}>
                      {trip.destination}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(trip.id, trip.destination)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>{trip.days} days</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      {new Date(trip.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      {trip.num_people || 1} · {trip.group_type || "solo"}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.viewButton,
                    { backgroundColor: theme.primary + "18" },
                  ]}
                  onPress={() => handleViewTrip(trip)}
                >
                  <Text
                    style={[styles.viewButtonText, { color: theme.primary }]}
                  >
                    View Full Itinerary
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              </View>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  filterContainer: { flexDirection: "row", padding: 20, gap: 12 },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterButtonActive: {},
  filterText: { fontSize: 14, color: "#666", fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  content: { flex: 1, paddingHorizontal: 20 },
  tripCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  tripDestination: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  deleteButton: { padding: 8 },
  cardContent: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 14, color: "#666" },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  viewButtonText: { fontSize: 14, fontWeight: "600" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  planButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  planButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
