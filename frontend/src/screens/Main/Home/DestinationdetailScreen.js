import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
  Share,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DESTINATIONS } from "../../../data/destinations";
import {
  getCurrentUser,
  addFavorite,
  removeFavorite,
  getFavorites,
} from "../../../services/supabase";
import { useTheme } from "../../../context/ThemeContext";

export default function DestinationDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { destination } = route.params;
  const [isSaved, setIsSaved] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [wikiDescription, setWikiDescription] = useState(null);
  const [wikiLoading, setWikiLoading] = useState(true);

  const recommendations = DESTINATIONS.filter(
    (d) => d.country === destination.country && d.id !== destination.id,
  ).slice(0, 6);

  const getAttractionImages = () => {
    if (destination.attractions && destination.attractions.length > 0) {
      return destination.attractions.slice(0, 6).map((attr, index) => ({
        id: index,
        uri: `https://source.unsplash.com/400x300/?${encodeURIComponent(attr.name)}`,
        name: attr.name,
      }));
    }
    return [
      {
        id: 1,
        uri: `https://source.unsplash.com/400x300/?${encodeURIComponent(destination.city + " tourism")}`,
        name: destination.city,
      },
      {
        id: 2,
        uri: `https://source.unsplash.com/400x300/?${encodeURIComponent(destination.country + " landmark")}`,
        name: destination.country,
      },
    ];
  };

  const reviews = [
    {
      id: 1,
      name: "Sarah M.",
      rating: 5,
      text: "Absolutely stunning! A must-visit destination.",
    },
    {
      id: 2,
      name: "John D.",
      rating: 5,
      text: "Amazing experience, beautiful architecture everywhere.",
    },
    {
      id: 3,
      name: "Emma W.",
      rating: 4,
      text: "Great food and culture. Would recommend!",
    },
  ];

  useEffect(() => {
    loadUserAndFavoriteStatus();
    fetchWikipediaDescription();
  }, []);

  const fetchWikipediaDescription = async () => {
    try {
      const query = destination.city.replace(/ /g, "_");
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${query}`,
      );
      const data = await response.json();
      if (data.extract && data.extract.length > 50) {
        setWikiDescription(data.extract);
      } else {
        setWikiDescription(destination.description);
      }
    } catch {
      setWikiDescription(destination.description);
    } finally {
      setWikiLoading(false);
    }
  };

  const loadUserAndFavoriteStatus = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const favs = await getFavorites();
      const isFav = favs.some(
        (f) => f.destination_id === destination.id.toString(),
      );
      setIsSaved(isFav);
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      Alert.alert("Sign In Required", "Please sign in to save favourites.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }
    try {
      if (isSaved) {
        setIsSaved(false);
        await removeFavorite(destination.id.toString());
        Alert.alert("Removed", `${destination.city} removed from favourites.`);
      } else {
        setIsSaved(true);
        await addFavorite(destination.id.toString(), destination.city);
        Alert.alert("❤️ Saved!", `${destination.city} added to favourites!`);
      }
    } catch {
      setIsSaved(!isSaved);
      Alert.alert("Error", "Could not update favourites.");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${destination.city}, ${destination.country}! 🌍\n\nBest season: ${destination.bestSeason}\nAvg cost: ${destination.avgCost}\n\nPlanned with VoyageHub ✈️`,
      });
    } catch {
      Alert.alert("Error", "Could not share");
    }
  };

  const handlePlanTrip = () => {
    navigation.navigate("Planner", {
      prefillDestination: destination.city,
      country: destination.country,
    });
  };

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < rating ? "star" : "star-outline"}
        size={16}
        color="#FFD700"
      />
    ));

  const attractionImages = getAttractionImages();

  return (
    <View style={styles.container}>
      <View style={styles.fixedHeader} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          pointerEvents="auto"
        >
          <Ionicons name="chevron-down" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerActions} pointerEvents="auto">
          <TouchableOpacity style={styles.iconButton} onPress={handleSave}>
            <Ionicons
              name={isSaved ? "heart" : "heart-outline"}
              size={24}
              color={isSaved ? "#ff3b30" : "#fff"}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
        bounces={true}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: destination.image }} style={styles.heroImage} />
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.title}>{destination.city}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color={theme.primary} />
            <Text style={styles.country}>{destination.country}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={[styles.type, { color: theme.primary }]}>
              {destination.totalAttractions} attractions
            </Text>
          </View>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {destination.rating || "4.5"}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{destination.avgCost}</Text>
              <Text style={styles.statLabel}>Avg Cost</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{destination.bestSeason}</Text>
              <Text style={styles.statLabel}>Best Season</Text>
            </View>
          </View>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📖 About</Text>
            {wikiLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.loadingText}>Loading description...</Text>
              </View>
            ) : (
              <Text style={styles.description}>{wikiDescription}</Text>
            )}
          </View>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📸 Popular Attractions</Text>
            <FlatList
              horizontal
              data={attractionImages}
              renderItem={({ item }) => (
                <View style={styles.galleryCard}>
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.galleryImage}
                  />
                  <Text style={styles.galleryLabel} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
              )}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryContent}
              nestedScrollEnabled={true}
            />
          </View>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.section}>
            <View style={styles.reviewHeader}>
              <Text style={styles.sectionTitle}>⭐ Reviews</Text>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>
                  {destination.rating || "4.8"}
                </Text>
                <Ionicons name="star" size={14} color="#FFD700" />
              </View>
            </View>
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <View style={styles.reviewStars}>
                    {renderStars(review.rating)}
                  </View>
                </View>
                <Text style={styles.reviewText}>{review.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {recommendations.length > 0 && (
          <View style={styles.contentSection}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                🌟 More in {destination.country}
              </Text>
              <FlatList
                horizontal
                data={recommendations}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.recCard}
                    onPress={() =>
                      navigation.push("DestinationDetail", {
                        destination: item,
                      })
                    }
                  >
                    <Image
                      source={{ uri: item.image }}
                      style={styles.recImage}
                    />
                    <View style={styles.recOverlay}>
                      <Text style={styles.recTitle} numberOfLines={1}>
                        {item.city}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recContent}
                nestedScrollEnabled={true}
              />
            </View>
          </View>
        )}

        <View style={styles.contentSection}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.planButton, { backgroundColor: theme.primary }]}
              onPress={handlePlanTrip}
            >
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.planButtonText}>
                Plan Trip to {destination.city}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollView: { flex: 1 },
  fixedHeader: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 100,
  },
  backButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: { flexDirection: "row", gap: 10 },
  iconButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: { width: "100%", height: 350 },
  heroImage: { width: "100%", height: "100%", backgroundColor: "#f0f0f0" },
  contentSection: { backgroundColor: "#fff", paddingHorizontal: 20 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 8,
    marginTop: 24,
  },
  locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  country: { fontSize: 16, color: "#666", marginLeft: 6 },
  dot: { marginHorizontal: 8, color: "#ccc" },
  type: { fontSize: 16, fontWeight: "600" },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statBox: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: "#666" },
  divider: { width: 1, backgroundColor: "#ddd", marginHorizontal: 12 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: { fontSize: 14, color: "#999" },
  description: { fontSize: 15, color: "#444", lineHeight: 24 },
  galleryContent: { paddingRight: 20 },
  galleryCard: { marginRight: 12 },
  galleryImage: {
    width: 200,
    height: 140,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  galleryLabel: {
    fontSize: 12,
    color: "#555",
    marginTop: 6,
    width: 200,
    textAlign: "center",
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8DC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginRight: 4,
  },
  reviewCard: {
    backgroundColor: "#f9f9f9",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  reviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  reviewName: { fontSize: 15, fontWeight: "600", color: "#333" },
  reviewStars: { flexDirection: "row" },
  reviewText: { fontSize: 14, color: "#666", lineHeight: 20 },
  recContent: { paddingRight: 20 },
  recCard: {
    width: 140,
    height: 100,
    marginRight: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  recImage: { width: "100%", height: "100%", backgroundColor: "#f0f0f0" },
  recOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
  },
  recTitle: { fontSize: 14, fontWeight: "600", color: "#fff" },
  buttonContainer: { marginTop: 20, marginBottom: 20 },
  planButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  planButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
