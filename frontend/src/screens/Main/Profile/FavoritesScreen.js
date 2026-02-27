import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  getFavorites,
  removeFavorite,
  getCurrentUser,
} from "../../../services/supabase";
import { DESTINATIONS } from "../../../data/destinations";
import { useTheme } from "../../../context/ThemeContext";

export default function FavoritesScreen({ navigation }) {
  const { theme } = useTheme();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, []),
  );

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (!currentUser) {
        setFavorites([]);
        return;
      }
      const favs = await getFavorites();
      const enriched = favs.map((fav) => {
        const dest = DESTINATIONS.find(
          (d) => d.id.toString() === fav.destination_id,
        );
        return { ...fav, destinationData: dest || null };
      });
      setFavorites(enriched);
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (fav) => {
    Alert.alert(
      "Remove Favourite",
      `Remove ${fav.destination_name} from favourites?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFavorite(fav.destination_id);
              setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
            } catch {
              Alert.alert("Error", "Could not remove favourite.");
            }
          },
        },
      ],
    );
  };

  const handleCardPress = (fav) => {
    if (fav.destinationData) {
      navigation.navigate("DestinationDetail", {
        destination: fav.destinationData,
      });
    }
  };

  const renderItem = ({ item }) => {
    const dest = item.destinationData;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleCardPress(item)}
        activeOpacity={0.9}
      >
        {dest?.image ? (
          <Image source={{ uri: dest.image }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.noImage]}>
            <Ionicons name="image-outline" size={40} color="#ccc" />
          </View>
        )}

        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemove(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="heart" size={20} color="#ff3b30" />
        </TouchableOpacity>

        <View style={styles.cardContent}>
          <Text style={styles.cityName}>{item.destination_name}</Text>
          {dest && (
            <>
              <Text style={styles.countryName}>{dest.country}</Text>
              <View style={styles.cardFooter}>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.ratingText}>{dest.rating}</Text>
                </View>
                <Text style={[styles.costText, { color: theme.primary }]}>
                  {dest.avgCost}
                </Text>
                <Text style={styles.attractionsText}>
                  {dest.totalAttractions} attractions
                </Text>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const Header = () => (
    <View style={[styles.header, { backgroundColor: theme.primary }]}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>My Favourites</Text>
      {favorites.length > 0 ? (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{favorites.length}</Text>
        </View>
      ) : (
        <View style={{ width: 40 }} />
      )}
    </View>
  );

  if (!loading && !user) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔒</Text>
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyDesc}>
            Sign in to save and view your favourite destinations.
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.actionBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!loading && favorites.length === 0) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>💔</Text>
          <Text style={styles.emptyTitle}>No Favourites Yet</Text>
          <Text style={styles.emptyDesc}>
            Tap the ❤️ on any destination to save it here.
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}
          >
            <Ionicons name="compass-outline" size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Explore Destinations</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 55,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: 180, backgroundColor: "#f0f0f0" },
  noImage: { justifyContent: "center", alignItems: "center" },
  removeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  cardContent: { padding: 14 },
  cityName: { fontSize: 20, fontWeight: "700", color: "#222", marginBottom: 2 },
  countryName: { fontSize: 14, color: "#888", marginBottom: 8 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 12 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 14, fontWeight: "600", color: "#333" },
  costText: { fontSize: 14, fontWeight: "700" },
  attractionsText: { fontSize: 13, color: "#888" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    elevation: 3,
  },
  actionBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
