import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { DESTINATIONS } from "../../../data/destinations";
import {
  getCurrentUser,
  addFavorite,
  removeFavorite,
  getFavorites,
} from "../../../services/supabase";
import { useTheme } from "../../../context/ThemeContext";

const FILTERS = ["All", "Asia", "Europe", "Americas", "Africa", "Oceania"];
const FILTER_ICONS = {
  All: "🌍",
  Asia: "🏯",
  Europe: "🗼",
  Americas: "🗽",
  Africa: "🦁",
  Oceania: "🏄",
};
const HEADER_HEIGHT = 175;
const STICKY_HEIGHT = 100;

const CONTINENT_MAP = {
  Asia: [
    "japan",
    "india",
    "china",
    "thailand",
    "vietnam",
    "indonesia",
    "malaysia",
    "singapore",
    "cambodia",
    "myanmar",
    "nepal",
    "sri lanka",
    "philippines",
    "south korea",
    "taiwan",
    "hong kong",
    "mongolia",
    "uzbekistan",
    "maldives",
    "bhutan",
    "bangladesh",
    "pakistan",
    "turkey",
    "jordan",
    "israel",
    "uae",
    "dubai",
    "qatar",
    "saudi",
    "oman",
    "bahrain",
    "kuwait",
  ],
  Europe: [
    "france",
    "italy",
    "spain",
    "germany",
    "united kingdom",
    "netherlands",
    "greece",
    "portugal",
    "czech",
    "austria",
    "switzerland",
    "belgium",
    "sweden",
    "norway",
    "denmark",
    "poland",
    "hungary",
    "croatia",
    "ireland",
    "scotland",
    "england",
    "russia",
    "ukraine",
    "finland",
    "romania",
    "bulgaria",
    "serbia",
    "slovakia",
    "slovenia",
    "estonia",
    "latvia",
    "lithuania",
    "luxembourg",
    "malta",
    "cyprus",
    "iceland",
    "albania",
    "montenegro",
    "bosnia",
    "moldova",
    "georgia",
    "armenia",
    "azerbaijan",
  ],
  Americas: [
    "united states",
    "usa",
    "brazil",
    "argentina",
    "canada",
    "mexico",
    "colombia",
    "peru",
    "chile",
    "cuba",
    "jamaica",
    "costa rica",
    "panama",
    "ecuador",
    "bolivia",
    "venezuela",
    "guatemala",
    "bahamas",
    "dominican",
    "puerto rico",
    "trinidad",
    "barbados",
    "honduras",
    "el salvador",
    "nicaragua",
    "paraguay",
    "uruguay",
    "guyana",
    "suriname",
    "belize",
    "haiti",
    "antigua",
  ],
  Africa: [
    "egypt",
    "morocco",
    "south africa",
    "kenya",
    "tanzania",
    "ghana",
    "ethiopia",
    "nigeria",
    "tunisia",
    "senegal",
    "zimbabwe",
    "madagascar",
    "namibia",
    "botswana",
    "uganda",
    "rwanda",
    "cameroon",
    "ivory coast",
    "mozambique",
    "zambia",
    "mali",
    "algeria",
    "libya",
    "sudan",
    "somalia",
  ],
  Oceania: [
    "australia",
    "new zealand",
    "fiji",
    "papua new guinea",
    "samoa",
    "tonga",
    "vanuatu",
    "solomon",
    "kiribati",
    "micronesia",
    "palau",
    "marshall islands",
    "nauru",
    "tuvalu",
  ],
};

export default function ExploreScreen({ navigation }) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [currentUser, setCurrentUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const scrollY = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadUserAndFavorites();
    }, []),
  );

  const loadUserAndFavorites = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    if (user) {
      const favs = await getFavorites();
      setFavoriteIds(new Set(favs.map((f) => f.destination_id)));
    } else {
      setFavoriteIds(new Set());
    }
  };

  const getFiltered = () => {
    let list = DESTINATIONS;
    if (activeFilter !== "All") {
      const keywords = CONTINENT_MAP[activeFilter] || [];
      list = list.filter((d) =>
        keywords.some(
          (kw) =>
            d.country?.toLowerCase().includes(kw) ||
            d.city?.toLowerCase().includes(kw),
        ),
      );
    }
    if (searchQuery.trim()) {
      list = list.filter(
        (d) =>
          d.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.country.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    return list;
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.length >= 2) {
      const results = DESTINATIONS.filter(
        (d) =>
          d.city.toLowerCase().includes(text.toLowerCase()) ||
          d.country.toLowerCase().includes(text.toLowerCase()),
      ).slice(0, 5);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleToggleFavorite = async (destination) => {
    if (!currentUser) {
      Alert.alert("Sign In Required", "Please sign in to save favourites.", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign In", onPress: () => navigation.navigate("Profile") },
      ]);
      return;
    }
    const isFav = favoriteIds.has(destination.id.toString());
    const newFavIds = new Set(favoriteIds);
    try {
      if (isFav) {
        newFavIds.delete(destination.id.toString());
        setFavoriteIds(newFavIds);
        await removeFavorite(destination.id.toString());
      } else {
        newFavIds.add(destination.id.toString());
        setFavoriteIds(newFavIds);
        await addFavorite(destination.id.toString(), destination.city);
      }
    } catch {
      setFavoriteIds(favoriteIds);
      Alert.alert("Error", "Could not update favourites.");
    }
  };

  // Header collapses upward
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: "clamp",
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT * 0.7],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // Sticky bar rises to top as header collapses
  const stickyTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [HEADER_HEIGHT, 0],
    extrapolate: "clamp",
  });

  const displayed = getFiltered();

  const FilterBar = () => (
    <View>
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(f) => f}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: 8,
          paddingVertical: 12,
        }}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[
              styles.filterPill,
              activeFilter === f && {
                backgroundColor: theme.primary,
                borderColor: theme.primary,
              },
            ]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={styles.filterPillIcon}>{FILTER_ICONS[f]}</Text>
            <Text
              style={[
                styles.filterText,
                activeFilter === f && styles.filterTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        )}
      />
      <View style={styles.resultsRow}>
        <Text style={styles.sectionTitle}>
          {searchQuery
            ? `Search: "${searchQuery}"`
            : activeFilter === "All"
              ? "🌍 All Destinations"
              : `${FILTER_ICONS[activeFilter]} ${activeFilter}`}
        </Text>
        <View
          style={[styles.countBadge, { backgroundColor: theme.primary + "18" }]}
        >
          <Text style={[styles.countText, { color: theme.primary }]}>
            {displayed.length} cities
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCard = ({ item }) => {
    const isFav = favoriteIds.has(item.id.toString());
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("DestinationDetail", { destination: item })
        }
        activeOpacity={0.9}
      >
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => handleToggleFavorite(item)}
        >
          <Ionicons
            name={isFav ? "heart" : "heart-outline"}
            size={22}
            color={isFav ? "#ff3b30" : "#fff"}
          />
        </TouchableOpacity>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.city}</Text>
          <Text style={styles.cardSubtitle}>
            {item.country} • {item.totalAttractions} attractions
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.rating}>{item.rating}</Text>
            </View>
            <Text style={[styles.cost, { color: theme.primary }]}>
              {item.avgCost}
            </Text>
            <TouchableOpacity
              style={[styles.planBtn, { backgroundColor: theme.primary }]}
              onPress={() =>
                navigation.navigate("Planner", {
                  prefillDestination: item.city,
                  country: item.country,
                })
              }
            >
              <Text style={styles.planBtnText}>Plan Trip ✨</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Collapsible Header */}
      <Animated.View
        style={[
          styles.header,
          {
            backgroundColor: theme.primary,
            transform: [{ translateY: headerTranslate }],
            opacity: headerOpacity,
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>🧭 Explore</Text>
            <Text style={styles.headerSubtitle}>
              Discover destinations worldwide
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
            <Ionicons name="person-circle-outline" size={34} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search cities or countries..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setShowSuggestions(false);
              }}
            >
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        {showSuggestions && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => {
                  setSearchQuery("");
                  setShowSuggestions(false);
                  navigation.navigate("DestinationDetail", {
                    destination: item,
                  });
                }}
              >
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={theme.primary}
                />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.suggCity}>{item.city}</Text>
                  <Text style={styles.suggCountry}>{item.country}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setShowSuggestions(false);
                    navigation.navigate("Planner", {
                      prefillDestination: item.city,
                      country: item.country,
                    });
                  }}
                >
                  <Text style={[styles.suggPlan, { color: theme.primary }]}>
                    Plan →
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>

      {/* Sticky Filter Bar — animates up with header */}
      <Animated.View
        style={[
          styles.stickyBar,
          { transform: [{ translateY: stickyTranslate }] },
        ]}
      >
        <FilterBar />
      </Animated.View>

      {/* Card List */}
      <Animated.FlatList
        data={displayed}
        renderItem={renderCard}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: HEADER_HEIGHT + STICKY_HEIGHT },
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        removeClippedSubviews
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={10}
      />
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
    zIndex: 100,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#fff" },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#333" },
  suggestionsBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 8,
    elevation: 4,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  suggCity: { fontSize: 14, fontWeight: "600", color: "#333" },
  suggCountry: { fontSize: 12, color: "#888" },
  suggPlan: { fontSize: 12, fontWeight: "700" },
  stickyBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    elevation: 4,
    zIndex: 99,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    gap: 5,
  },
  filterPillIcon: { fontSize: 13 },
  filterText: { fontSize: 13, color: "#666", fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  resultsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#333" },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: { fontSize: 12, fontWeight: "700" },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: 200, backgroundColor: "#e0e0e0" },
  heartBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 20,
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: { padding: 14 },
  cardTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  cardSubtitle: { fontSize: 13, color: "#666", marginBottom: 10 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rating: { fontSize: 14, fontWeight: "600", color: "#333" },
  cost: { fontSize: 15, fontWeight: "700" },
  planBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  planBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
});
