import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { DESTINATIONS } from "../../../data/destinations";
import { getCurrentUser, getTrips } from "../../../services/supabase";
import { getMLRecommendations, predictBudget } from "../../../services/api";
import { useTheme } from "../../../context/ThemeContext";

const { width } = Dimensions.get("window");

const FEATURE_CARDS = [
  {
    id: "flights",
    title: "✈️ Inter-City Travel",
    subtitle: "Book buses, trains & flights",
    desc: "Compare prices across 500+ routes. Seamless connections between your destinations.",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
    color: "#1a237e",
    tag: "New Feature",
  },
  {
    id: "hotels",
    title: "🏨 Smart Accommodation",
    subtitle: "AI-matched hotels for you",
    desc: "Get recommendations based on your budget tier, group size, and travel style.",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    color: "#4a148c",
    tag: "AI Powered",
  },
  {
    id: "food",
    title: "🍜 Local Food Guide",
    subtitle: "Eat like a local, everywhere",
    desc: "Curated restaurants, street food spots and hidden gems at every destination.",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    color: "#e65100",
    tag: "1000+ Spots",
  },
];

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme(); // ← ADD THIS
  const [user, setUser] = useState(null);
  const [trending, setTrending] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [budgetPrediction, setBudgetPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const featuredRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, []),
  );

  const loadHomeData = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      const scored = [...DESTINATIONS].map((d) => ({
        ...d,
        popularityScore: d.rating * Math.log(1 + (d.totalAttractions || 1)),
      }));
      const trendingLocal = scored
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, 15);
      setTrending(trendingLocal);

      if (currentUser) {
        const trips = await getTrips();
        setRecentTrips(trips?.slice(0, 3) || []);
        const pastDests = trips?.map((t) => t.destination) || [];
        try {
          const recs = await getMLRecommendations(pastDests);
          setRecommended(recs?.length > 0 ? recs : trendingLocal.slice(5, 15));
        } catch {
          setRecommended(trendingLocal.slice(5, 15));
        }
        if (trips?.length > 0) {
          try {
            const pred = await predictBudget({
              destination: trips[0].destination,
              days: 3,
              members: trips[0].num_people || 2,
              group_type: trips[0].group_type || "Couple",
            });
            setBudgetPrediction(pred);
          } catch {}
        }
      } else {
        setRecommended(
          [...DESTINATIONS].sort((a, b) => b.rating - a.rating).slice(0, 10),
        );
      }
    } catch {
      const fallback = DESTINATIONS.slice(0, 15);
      setTrending(fallback);
      setRecommended(fallback);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getUserName = () => {
    if (!user) return "Traveler";
    return (
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "Traveler"
    );
  };

  const renderHorizCard = ({ item }) => (
    <TouchableOpacity
      style={styles.horizCard}
      onPress={() =>
        navigation.navigate("DestinationDetail", { destination: item })
      }
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.image }} style={styles.horizCardImage} />
      <View style={styles.horizCardOverlay}>
        <Text style={styles.horizCardCity} numberOfLines={1}>
          {item.city}
        </Text>
        <View style={styles.horizCardMeta}>
          <Ionicons name="star" size={11} color="#FFD700" />
          <Text style={styles.horizCardRating}> {item.rating}</Text>
          <Text style={styles.horizCardCost}> {item.avgCost}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFeaturedCard = ({ item }) => (
    <TouchableOpacity
      style={styles.featuredCard}
      onPress={() =>
        navigation.navigate("DestinationDetail", { destination: item })
      }
      activeOpacity={0.92}
    >
      <Image source={{ uri: item.image }} style={styles.featuredImage} />
      <View style={styles.featuredOverlay}>
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>⭐ Top Pick</Text>
        </View>
        <Text style={styles.featuredCity}>{item.city}</Text>
        <Text style={styles.featuredCountry}>{item.country}</Text>
        <View style={styles.featuredMeta}>
          <View style={styles.featuredMetaItem}>
            <Ionicons name="star" size={13} color="#FFD700" />
            <Text style={styles.featuredMetaText}> {item.rating}</Text>
          </View>
          <View style={styles.featuredMetaItem}>
            <Ionicons name="location-outline" size={13} color="#fff" />
            <Text style={styles.featuredMetaText}>
              {" "}
              {item.totalAttractions} spots
            </Text>
          </View>
          <Text style={styles.featuredCost}>{item.avgCost}</Text>
        </View>
        {/* ← theme.primary used inline here */}
        <TouchableOpacity
          style={[styles.featuredBtn, { backgroundColor: theme.primary }]}
          onPress={() =>
            navigation.navigate("Planner", {
              prefillDestination: item.city,
              country: item.country,
            })
          }
        >
          <Text style={styles.featuredBtnText}>Plan This Trip ✨</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFeatureCard = (item) => (
    <View key={item.id} style={styles.featureCard}>
      <Image source={{ uri: item.image }} style={styles.featureCardImage} />
      <View
        style={[
          styles.featureCardOverlay,
          { backgroundColor: item.color + "cc" },
        ]}
      >
        <View style={styles.featureTag}>
          <Text style={styles.featureTagText}>{item.tag}</Text>
        </View>
        <Text style={styles.featureCardTitle}>{item.title}</Text>
        <Text style={styles.featureCardSub}>{item.subtitle}</Text>
        <Text style={styles.featureCardDesc}>{item.desc}</Text>
      </View>
    </View>
  );

  // ← styles that use theme are moved INLINE using theme.primary / theme.accent
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER — uses theme.primary */}
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <View style={styles.appNameRow}>
            <Text style={styles.appName}>🚀 VoyageHub</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile")}
              style={styles.profileBtn}
            >
              <Ionicons name="person-circle-outline" size={36} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.greeting}>{getGreeting()} 👋</Text>
          <Text style={styles.userName}>{getUserName()}</Text>
          <TouchableOpacity
            style={styles.planCTA}
            onPress={() => navigation.navigate("Planner")}
            activeOpacity={0.9}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.planCTATitle}>✨ Plan Your Trip with AI</Text>
              <Text style={styles.planCTASub}>
                Personalized itinerary in seconds
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={34} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    🌟 Featured Destinations
                  </Text>
                  <Text style={[styles.sectionAlgo, { color: theme.primary }]}>
                    Swipe to explore
                  </Text>
                </View>
              </View>
              <FlatList
                ref={featuredRef}
                data={trending.slice(0, 6)}
                renderItem={renderFeaturedCard}
                keyExtractor={(item) => item.id?.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={width - 32}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 16 }}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / (width - 32),
                  );
                  setFeaturedIndex(index);
                }}
              />
              <View style={styles.dotsRow}>
                {trending.slice(0, 6).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === featuredIndex && [
                        styles.dotActive,
                        { backgroundColor: theme.primary },
                      ],
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.featureSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>🌍 Explore VoyageHub</Text>
                  <Text style={[styles.sectionAlgo, { color: theme.primary }]}>
                    Everything in one place
                  </Text>
                </View>
              </View>
              {FEATURE_CARDS.map(renderFeatureCard)}
            </View>

            {budgetPrediction && (
              <View
                style={[styles.budgetCard, { borderLeftColor: theme.accent }]}
              >
                <View style={styles.budgetLeft}>
                  <Text style={styles.budgetAlgoLabel}>
                    🤖 ML Budget Prediction
                  </Text>
                  <Text style={styles.budgetDest}>
                    3 days in {budgetPrediction.destination}
                  </Text>
                  <Text style={[styles.budgetAlgo, { color: theme.primary }]}>
                    Linear Regression Model
                  </Text>
                </View>
                <View style={styles.budgetRight}>
                  <Text style={[styles.budgetAmount, { color: theme.accent }]}>
                    ${budgetPrediction.predicted_budget}
                  </Text>
                  <Text style={styles.budgetTier}>{budgetPrediction.tier}</Text>
                </View>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
                  <Text style={[styles.sectionAlgo, { color: theme.primary }]}>
                    Popularity Score Algorithm
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Explore")}
                >
                  <Text style={[styles.seeAll, { color: theme.primary }]}>
                    See All →
                  </Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={trending}
                renderItem={renderHorizCard}
                keyExtractor={(item) => `trend-${item.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
                removeClippedSubviews
                initialNumToRender={5}
                maxToRenderPerBatch={5}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    🤖 Recommended For You
                  </Text>
                  <Text style={[styles.sectionAlgo, { color: theme.primary }]}>
                    {user
                      ? "TF-IDF + Cosine Similarity"
                      : "Top Rated Destinations"}
                  </Text>
                </View>
              </View>
              <FlatList
                data={recommended}
                renderItem={renderHorizCard}
                keyExtractor={(item) => `rec-${item.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
                removeClippedSubviews
                initialNumToRender={5}
                maxToRenderPerBatch={5}
              />
            </View>

            {recentTrips.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>📍 Your Recent Trips</Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("MyTrips")}
                  >
                    <Text style={[styles.seeAll, { color: theme.primary }]}>
                      See All →
                    </Text>
                  </TouchableOpacity>
                </View>
                {recentTrips.map((trip, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.recentCard}
                    onPress={() => navigation.navigate("TripDetail", { trip })}
                  >
                    <View
                      style={[
                        styles.recentIcon,
                        { backgroundColor: theme.primary + "22" },
                      ]}
                    >
                      <Ionicons
                        name="airplane"
                        size={20}
                        color={theme.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentDest}>{trip.destination}</Text>
                      <Text style={styles.recentSub}>
                        {trip.days} days · ${trip.budget || "—"} ·{" "}
                        {trip.group_type || "Trip"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {!user && (
              <TouchableOpacity
                style={[styles.loginBanner, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate("Profile")}
              >
                <Ionicons name="lock-open-outline" size={22} color="#fff" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.loginBannerTitle}>
                    Sign in for Personalized Trips
                  </Text>
                  <Text style={styles.loginBannerSub}>
                    ML recommendations based on your travel history
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

// Styles stay exactly the same — no changes needed here
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 24 },
  appNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  profileBtn: {},
  greeting: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 2 },
  userName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 18,
  },
  planCTA: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  planCTATitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  planCTASub: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  section: { marginTop: 22, paddingLeft: 16 },
  featureSection: { marginTop: 22, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
    paddingRight: 16,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#333" },
  sectionAlgo: { fontSize: 10, marginTop: 2 },
  seeAll: { fontSize: 12, fontWeight: "600" },
  featureCard: {
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 14,
    elevation: 4,
  },
  featureCardImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e0e0",
  },
  featureCardOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    justifyContent: "flex-end",
  },
  featureTag: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  featureTagText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  featureCardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 2,
  },
  featureCardSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 6,
    fontWeight: "600",
  },
  featureCardDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 18,
  },
  featuredCard: {
    width: width - 48,
    height: 260,
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 12,
    elevation: 5,
  },
  featuredImage: { width: "100%", height: "100%", backgroundColor: "#e0e0e0" },
  featuredOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: "rgba(0,0,0,0.38)",
    padding: 18,
    justifyContent: "flex-end",
  },
  featuredBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "#FFD700",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featuredBadgeText: { fontSize: 11, fontWeight: "700", color: "#333" },
  featuredCity: { fontSize: 26, fontWeight: "800", color: "#fff" },
  featuredCountry: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 10,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  featuredMetaItem: { flexDirection: "row", alignItems: "center" },
  featuredMetaText: { fontSize: 12, color: "#fff" },
  featuredCost: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00e676",
    marginLeft: "auto",
  },
  featuredBtn: { paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  featuredBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingRight: 16,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#ddd" },
  dotActive: { width: 18 },
  horizCard: {
    width: 140,
    height: 175,
    borderRadius: 14,
    marginRight: 12,
    overflow: "hidden",
    elevation: 3,
  },
  horizCardImage: { width: "100%", height: "100%", backgroundColor: "#e0e0e0" },
  horizCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.52)",
    padding: 10,
  },
  horizCardCity: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  horizCardMeta: { flexDirection: "row", alignItems: "center" },
  horizCardRating: { fontSize: 11, color: "#FFD700", fontWeight: "600" },
  horizCardCost: { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  budgetCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    borderLeftWidth: 4,
  },
  budgetLeft: { flex: 1 },
  budgetAlgoLabel: { fontSize: 11, color: "#888", marginBottom: 4 },
  budgetDest: { fontSize: 14, fontWeight: "700", color: "#333" },
  budgetAlgo: { fontSize: 10, marginTop: 2 },
  budgetRight: { alignItems: "flex-end" },
  budgetAmount: { fontSize: 24, fontWeight: "800" },
  budgetTier: { fontSize: 11, color: "#888" },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    marginRight: 16,
    elevation: 1,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  recentDest: { fontSize: 15, fontWeight: "700", color: "#333" },
  recentSub: { fontSize: 12, color: "#888", marginTop: 2 },
  loginBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
  },
  loginBannerTitle: { fontSize: 14, fontWeight: "700", color: "#fff" },
  loginBannerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
});
