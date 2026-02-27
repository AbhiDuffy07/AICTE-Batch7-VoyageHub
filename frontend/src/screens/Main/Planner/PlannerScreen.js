import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { getTravelSuggestions } from "../../../services/api";
import { getCurrentUser } from "../../../services/supabase";
import { searchPlaces } from "../../../services/nominatim";
import { DESTINATIONS } from "../../../data/destinations";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../../context/ThemeContext";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar", rate: 1 },
  { code: "INR", symbol: "₹", label: "Indian Rupee", rate: 83.5 },
  { code: "EUR", symbol: "€", label: "Euro", rate: 0.92 },
  { code: "GBP", symbol: "£", label: "British Pound", rate: 0.79 },
  { code: "JPY", symbol: "¥", label: "Japanese Yen", rate: 149.5 },
  { code: "AUD", symbol: "A$", label: "Australian Dollar", rate: 1.53 },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar", rate: 1.36 },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar", rate: 1.34 },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham", rate: 3.67 },
  { code: "THB", symbol: "฿", label: "Thai Baht", rate: 35.1 },
];

export default function PlannerScreen({ navigation, route }) {
  const { theme } = useTheme();
  const prefillDestination = route.params?.prefillDestination || "";

  const [destination, setDestination] = useState(prefillDestination);
  const [interests, setInterests] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [budget, setBudget] = useState("");
  const [budgetError, setBudgetError] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [groupType, setGroupType] = useState("Solo");
  const [members, setMembers] = useState(1);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [cityData, setCityData] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const groupTypes = ["Solo", "Couple", "Family", "Friends"];

  useFocusEffect(
    useCallback(() => {
      checkLoginStatus();
    }, []),
  );

  const checkLoginStatus = async () => {
    const user = await getCurrentUser();
    setIsLoggedIn(!!user);
  };

  useEffect(() => {
    if (prefillDestination) {
      setDestination(prefillDestination);
      searchCoordinates(prefillDestination);
      const city = DESTINATIONS.find(
        (d) => d.city.toLowerCase() === prefillDestination.toLowerCase(),
      );
      if (city) setCityData(city);
    }
  }, [prefillDestination]);

  const searchCoordinates = async (place) => {
    const results = await searchPlaces(place);
    if (results.length > 0) {
      setDestinationCoords({
        latitude: parseFloat(results[0].lat),
        longitude: parseFloat(results[0].lon),
      });
    }
  };

  const handleDestinationChange = async (text) => {
    setDestination(text);
    const cityMatch = DESTINATIONS.find(
      (d) => d.city.toLowerCase() === text.toLowerCase(),
    );
    setCityData(cityMatch || null);
    if (text.length >= 2) {
      const results = await searchPlaces(text);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setDestination(suggestion.displayName);
    setDestinationCoords({
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
    });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const calculateDays = () => {
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
  };

  const onStartDateChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      if (selectedDate > endDate) setEndDate(selectedDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) {
      const diffDays = Math.ceil(
        (selectedDate - startDate) / (1000 * 60 * 60 * 24),
      );
      if (diffDays < 1) {
        Alert.alert("Invalid Date", "End date must be after start date.");
        return;
      }
      setEndDate(selectedDate);
    }
  };

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const incrementMembers = () => {
    if (members < 20) setMembers(members + 1);
  };
  const decrementMembers = () => {
    if (members > 1) setMembers(members - 1);
  };

  const getBudgetInUSD = () => {
    const raw = parseInt(budget);
    if (isNaN(raw)) return 0;
    return Math.round(raw / selectedCurrency.rate);
  };

  const getBudgetTier = () => {
    const days = calculateDays();
    const budgetUSD = getBudgetInUSD();
    if (!budgetUSD || !days || !members) return null;
    const ppd = Math.round(budgetUSD / (days * members));
    if (ppd < 15) return { label: "⚠️ Very Tight", color: "#ff3b30", ppd };
    if (ppd < 50) return { label: "🎒 Budget Travel", color: "#00c853", ppd };
    if (ppd < 150) return { label: "✈️ Mid-Range", color: theme.primary, ppd };
    return { label: "💎 Luxury", color: "#ff9500", ppd };
  };

  const validateBudget = () => {
    if (!budget || budget.trim() === "") {
      setBudgetError("Budget is required");
      return false;
    }
    const raw = parseInt(budget);
    if (isNaN(raw) || raw <= 0) {
      setBudgetError("Enter a valid amount");
      return false;
    }
    setBudgetError("");
    return true;
  };

  const handleBudgetChange = (text) => {
    setBudget(text);
    if (budgetError) setBudgetError("");
  };

  const handleGenerate = async () => {
    if (!destination.trim()) {
      Alert.alert("Missing Destination", "Please enter a destination first.");
      return;
    }
    const user = await getCurrentUser();
    if (!user) {
      Alert.alert(
        "Login Required ✈️",
        "Create a free account to generate and save your itinerary. It only takes 30 seconds!",
        [
          { text: "Not Now", style: "cancel" },
          {
            text: "Login / Sign Up",
            onPress: () => navigation.navigate("Profile"),
          },
        ],
      );
      return;
    }
    if (!validateBudget()) {
      Alert.alert(
        "Budget Required",
        "Please enter your total budget to continue.",
      );
      return;
    }
    const days = calculateDays();
    const budgetUSD = getBudgetInUSD();
    const minBudget = days * members * 15;

    if (budgetUSD < minBudget) {
      Alert.alert(
        "Budget Too Low ⚠️",
        `For ${days} day${days > 1 ? "s" : ""} with ${members} ${members === 1 ? "person" : "people"}, the minimum recommended budget is $${minBudget} ($15/person/day).\n\nYour budget: $${budgetUSD} USD\n\nWant to continue with a tight budget?`,
        [
          { text: "Adjust Budget", style: "cancel" },
          {
            text: "Continue Anyway",
            onPress: () => generateItinerary(days, budgetUSD),
          },
        ],
      );
      return;
    }
    if (days < 2) {
      Alert.alert("Too Short! ⏱️", "Pick at least 2 days to explore a city!", [
        { text: "OK, fix dates", style: "cancel" },
      ]);
      return;
    }
    generateItinerary(days, budgetUSD);
  };

  const generateItinerary = async (days, budgetUSD) => {
    setLoading(true);
    try {
      const interestsArray = interests
        .split(",")
        .map((i) => i.trim())
        .filter((i) => i);
      const response = await getTravelSuggestions(
        destination,
        days,
        interestsArray,
        members,
        budgetUSD,
      );
      navigation.navigate("Result", {
        itinerary: response.itinerary,
        destination,
        days,
        budget: budgetUSD,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        coordinates: destinationCoords,
        groupType,
        members,
        cityData,
      });
    } catch {
      Alert.alert(
        "Error",
        "Failed to generate itinerary. Check if backend is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  const budgetTier = getBudgetTier();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>✨ AI Travel Planner</Text>
          <Text style={styles.headerSub}>Plan your perfect trip</Text>
        </View>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate("Profile")}
        >
          <Ionicons name="person-circle-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formSection}>
          {cityData && (
            <View
              style={[
                styles.cityInfoCard,
                {
                  backgroundColor: theme.primary + "18",
                  borderLeftColor: theme.primary,
                },
              ]}
            >
              <View style={styles.cityInfoHeader}>
                <Ionicons name="location" size={20} color={theme.primary} />
                <Text style={styles.cityInfoTitle}>{cityData.city}</Text>
              </View>
              <Text style={styles.cityInfoCountry}>{cityData.country}</Text>
              <View style={styles.cityInfoStats}>
                <View style={styles.cityInfoStat}>
                  <Ionicons name="business-outline" size={16} color="#666" />
                  <Text style={styles.cityInfoStatText}>
                    {cityData.totalAttractions} attractions
                  </Text>
                </View>
                <View style={styles.cityInfoStat}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.cityInfoStatText}>{cityData.rating}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>📍 Destination</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="location-outline"
                size={20}
                color={theme.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g., Paris, Tokyo, New York"
                value={destination}
                onChangeText={handleDestinationChange}
                placeholderTextColor="#999"
              />
            </View>
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ScrollView style={styles.suggestionsList} nestedScrollEnabled>
                  {suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionItem}
                      onPress={() => selectSuggestion(suggestion)}
                    >
                      <Ionicons
                        name="location"
                        size={16}
                        color={theme.primary}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.suggestionText} numberOfLines={1}>
                        {suggestion.displayName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>📅 Travel Dates</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>From</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={theme.primary}
                  />
                  <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>To</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={theme.primary}
                  />
                  <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View
              style={[
                styles.durationBadge,
                { backgroundColor: theme.primary + "18" },
              ]}
            >
              <Ionicons name="time-outline" size={16} color={theme.primary} />
              <Text style={[styles.durationText, { color: theme.primary }]}>
                {calculateDays()} {calculateDays() === 1 ? "day" : "days"}
              </Text>
            </View>
          </View>

          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={onStartDateChange}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              minimumDate={startDate}
              onChange={onEndDateChange}
            />
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>👥 Travel Group</Text>
            <View style={styles.groupRow}>
              <View style={styles.groupTypeBox}>
                <Text style={styles.dateLabel}>Type</Text>
                <TouchableOpacity
                  style={styles.groupTypeButton}
                  onPress={() => setShowGroupPicker(true)}
                >
                  <Text style={styles.groupTypeText}>{groupType}</Text>
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.membersBox}>
                <Text style={styles.dateLabel}>Members</Text>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={decrementMembers}
                  >
                    <Ionicons name="remove" size={20} color={theme.primary} />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{members}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={incrementMembers}
                  >
                    <Ionicons name="add" size={20} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>💰 Total Budget *</Text>
            <View style={styles.budgetRow}>
              <TouchableOpacity
                style={[
                  styles.currencySelector,
                  {
                    backgroundColor: theme.primary + "18",
                    borderColor: theme.primary,
                  },
                ]}
                onPress={() => setShowCurrencyPicker(true)}
              >
                <Text style={[styles.currencySymbol, { color: theme.primary }]}>
                  {selectedCurrency.symbol}
                </Text>
                <Text style={[styles.currencyCode, { color: theme.primary }]}>
                  {selectedCurrency.code}
                </Text>
                <Ionicons name="chevron-down" size={14} color={theme.primary} />
              </TouchableOpacity>
              <View
                style={[
                  styles.budgetInputContainer,
                  budgetError ? styles.inputError : null,
                ]}
              >
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color={theme.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 500"
                  value={budget}
                  onChangeText={handleBudgetChange}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {budgetError ? (
              <Text style={styles.errorText}>⚠️ {budgetError}</Text>
            ) : null}

            {budget && selectedCurrency.code !== "USD" && (
              <Text style={[styles.conversionText, { color: theme.primary }]}>
                ≈ ${getBudgetInUSD()} USD
              </Text>
            )}

            {budgetTier && (
              <View
                style={[
                  styles.budgetTierCard,
                  { borderLeftColor: budgetTier.color },
                ]}
              >
                <Text
                  style={[styles.budgetTierLabel, { color: budgetTier.color }]}
                >
                  {budgetTier.label}
                </Text>
                <Text style={styles.budgetTierDetail}>
                  ${budgetTier.ppd}/person/day · {calculateDays()} days ·{" "}
                  {members} {members === 1 ? "person" : "people"}
                </Text>
                <Text style={styles.budgetTierNote}>
                  * Covers in-destination costs only (hotels, food, local
                  transport, activities)
                </Text>
              </View>
            )}

            <Text style={styles.hint}>
              💡 Budget covers in-destination expenses only — flights to get
              there are excluded
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>🎯 Interests</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="heart-outline"
                size={20}
                color={theme.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="e.g., food, museums, adventure"
                value={interests}
                onChangeText={setInterests}
                placeholderTextColor="#999"
              />
            </View>
            <Text style={styles.hint}>
              Separate multiple interests with commas
            </Text>
          </View>

          {!isLoggedIn && (
            <View
              style={[
                styles.loginHintCard,
                { backgroundColor: theme.primary + "18" },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={theme.primary}
              />
              <Text style={styles.loginHintText}>
                You'll need to sign in before generating — it's free & instant!
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                <Text style={[styles.loginHintLink, { color: theme.primary }]}>
                  Sign In →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.generateButton,
              { backgroundColor: theme.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleGenerate}
            disabled={loading}
          >
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.generateButtonText}>
              {loading ? "Generating..." : "Generate Itinerary"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.myTripsButton}
            onPress={() =>
              navigation.navigate("MainTabs", { screen: "MyTrips" })
            }
          >
            <Ionicons name="book-outline" size={20} color="#00c853" />
            <Text style={styles.myTripsButtonText}>My Saved Trips</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      <Modal
        visible={showGroupPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGroupPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Group Type</Text>
              <TouchableOpacity onPress={() => setShowGroupPicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {groupTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.groupOption,
                  groupType === type && [
                    styles.groupOptionSelected,
                    {
                      backgroundColor: theme.primary + "18",
                      borderColor: theme.primary,
                    },
                  ],
                ]}
                onPress={() => {
                  setGroupType(type);
                  setShowGroupPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.groupOptionText,
                    groupType === type && [
                      styles.groupOptionTextSelected,
                      { color: theme.primary },
                    ],
                  ]}
                >
                  {type}
                </Text>
                {groupType === type && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCurrencyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.groupOption,
                    selectedCurrency.code === c.code && [
                      styles.groupOptionSelected,
                      {
                        backgroundColor: theme.primary + "18",
                        borderColor: theme.primary,
                      },
                    ],
                  ]}
                  onPress={() => {
                    setSelectedCurrency(c);
                    setShowCurrencyPicker(false);
                  }}
                >
                  <View>
                    <Text
                      style={[
                        styles.groupOptionText,
                        selectedCurrency.code === c.code && [
                          styles.groupOptionTextSelected,
                          { color: theme.primary },
                        ],
                      ]}
                    >
                      {c.symbol} {c.code}
                    </Text>
                    <Text style={styles.currencyLabelSmall}>{c.label}</Text>
                  </View>
                  {selectedCurrency.code === c.code && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={theme.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  scrollView: { flex: 1 },
  formSection: { padding: 20, backgroundColor: "#fff" },
  cityInfoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  cityInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  cityInfoTitle: { fontSize: 20, fontWeight: "700", color: "#333" },
  cityInfoCountry: { fontSize: 14, color: "#666", marginBottom: 12 },
  cityInfoStats: { flexDirection: "row", gap: 16 },
  cityInfoStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  cityInfoStatText: { fontSize: 13, color: "#666", fontWeight: "500" },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 10 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 16,
  },
  inputError: { borderColor: "#ff3b30", borderWidth: 1.5 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: "#333" },
  errorText: {
    fontSize: 13,
    color: "#ff3b30",
    marginTop: 6,
    fontWeight: "500",
  },
  budgetRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  currencySelector: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: 1,
    gap: 4,
  },
  currencySymbol: { fontSize: 16, fontWeight: "700" },
  currencyCode: { fontSize: 13, fontWeight: "600" },
  budgetInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 16,
  },
  conversionText: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    marginLeft: 4,
  },
  budgetTierCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderLeftWidth: 4,
  },
  budgetTierLabel: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  budgetTierDetail: { fontSize: 12, color: "#666", marginBottom: 4 },
  budgetTierNote: { fontSize: 11, color: "#aaa", fontStyle: "italic" },
  suggestionsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    maxHeight: 200,
    elevation: 3,
  },
  suggestionsList: { maxHeight: 200 },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  suggestionText: { fontSize: 14, color: "#333", flex: 1 },
  dateRow: { flexDirection: "row", gap: 12 },
  dateBox: { flex: 1 },
  dateLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
    fontWeight: "500",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 14,
    gap: 8,
  },
  dateText: { fontSize: 14, color: "#333", fontWeight: "500", flex: 1 },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  durationText: { fontSize: 14, fontWeight: "600" },
  groupRow: { flexDirection: "row", gap: 12 },
  groupTypeBox: { flex: 1 },
  groupTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 14,
  },
  groupTypeText: { fontSize: 14, color: "#333", fontWeight: "500" },
  membersBox: { flex: 1 },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 8,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  counterValue: { fontSize: 16, fontWeight: "600", color: "#333" },
  hint: {
    fontSize: 12,
    color: "#888",
    marginTop: 8,
    fontStyle: "italic",
    lineHeight: 18,
  },
  loginHintCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  loginHintText: { flex: 1, fontSize: 13, color: "#555", lineHeight: 18 },
  loginHintLink: { fontSize: 13, fontWeight: "700" },
  generateButton: {
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    elevation: 4,
    gap: 8,
  },
  buttonDisabled: { backgroundColor: "#999" },
  generateButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  myTripsButton: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#00c853",
    gap: 8,
  },
  myTripsButtonText: { color: "#00c853", fontSize: 16, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  groupOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
  },
  groupOptionSelected: { borderWidth: 2 },
  groupOptionText: { fontSize: 16, color: "#333", fontWeight: "500" },
  groupOptionTextSelected: { fontWeight: "600" },
  currencyLabelSmall: { fontSize: 11, color: "#888", marginTop: 2 },
});
