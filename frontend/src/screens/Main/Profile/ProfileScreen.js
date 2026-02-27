import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import {
  getCurrentUser,
  signOut,
  onAuthStateChange,
  updateDisplayName,
  getTripCount,
  getFavoriteCount,
} from "../../../services/supabase";
import { useTheme } from "../../../context/ThemeContext"; // ← ADD

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

const THEMES = [
  {
    id: "default",
    label: "🟣 Classic Purple",
    primary: "#6200ee",
    accent: "#00c853",
  },
  {
    id: "warm",
    label: "🟠 Warm Sunset",
    primary: "#e65100",
    accent: "#ffb300",
  },
  { id: "cool", label: "🔵 Cool Ocean", primary: "#0277bd", accent: "#00bcd4" },
  { id: "rose", label: "🌸 Rose Gold", primary: "#ad1457", accent: "#ff6f91" },
  {
    id: "forest",
    label: "🌿 Forest Green",
    primary: "#2e7d32",
    accent: "#81c784",
  },
];

export default function ProfileScreen({ navigation }) {
  const { theme, changeTheme } = useTheme(); // ← ADD changeTheme here

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tripCount, setTripCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [newName, setNewName] = useState("");
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPreferences();
    initProfile();
    const subscription = onAuthStateChange((updatedUser) => {
      setUser(updatedUser);
      if (updatedUser) {
        const name =
          updatedUser.user_metadata?.display_name ||
          updatedUser.user_metadata?.full_name ||
          updatedUser.email?.split("@")[0] ||
          "Traveller";
        setDisplayName(name);
        loadCounts();
      } else {
        setTripCount(0);
        setFavoriteCount(0);
        setDisplayName("");
      }
    });
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    return () => subscription?.unsubscribe?.();
  }, []);

  const loadPreferences = async () => {
    try {
      const currency = await AsyncStorage.getItem("selectedCurrency");
      const notifs = await AsyncStorage.getItem("notificationsEnabled");
      if (currency) setSelectedCurrency(JSON.parse(currency));
      if (notifs !== null) setNotificationsEnabled(JSON.parse(notifs));
      // NOTE: theme is now handled by ThemeContext — no need to load it here
    } catch {}
  };

  const initProfile = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser) {
        const name =
          currentUser.user_metadata?.display_name ||
          currentUser.user_metadata?.full_name ||
          currentUser.email?.split("@")[0] ||
          "Traveller";
        setDisplayName(name);
        await loadCounts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async () => {
    const [trips, favs] = await Promise.all([
      getTripCount(),
      getFavoriteCount(),
    ]);
    setTripCount(trips);
    setFavoriteCount(favs);
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            setUser(null);
            setTripCount(0);
            setFavoriteCount(0);
            setDisplayName("");
          } catch {
            Alert.alert("Error", "Failed to sign out.");
          }
        },
      },
    ]);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    try {
      await updateDisplayName(newName.trim());
      setDisplayName(newName.trim());
      setEditingName(false);
      Alert.alert("✅ Updated!", "Display name saved.");
    } catch {
      Alert.alert("Error", "Could not update name.");
    }
  };

  const selectCurrency = async (currency) => {
    setSelectedCurrency(currency);
    await AsyncStorage.setItem("selectedCurrency", JSON.stringify(currency));
    setShowCurrencyModal(false);
  };

  // ✅ THE REAL FIX — calls changeTheme() from context so ALL screens update instantly
  const selectTheme = async (t) => {
    await changeTheme(t.id); // ← This updates ThemeContext state → all screens re-render
    setShowThemeModal(false);
    Alert.alert(
      "Theme Applied! 🎨",
      `${t.label} is now active across the app!`,
    );
  };

  const toggleNotifications = async () => {
    const newVal = !notificationsEnabled;
    setNotificationsEnabled(newVal);
    await AsyncStorage.setItem("notificationsEnabled", JSON.stringify(newVal));
  };

  const getInitials = () => {
    if (!displayName) return "?";
    const parts = displayName.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return displayName[0].toUpperCase();
  };

  // Helper — find current theme in THEMES list for showing selected checkmark
  const currentThemeId =
    THEMES.find((t) => t.primary === theme.primary)?.id || "default";

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* HEADER — uses theme.primary */}
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {user ? (
            <>
              <View style={styles.avatarSection}>
                {/* AVATAR — uses theme.primary */}
                <View
                  style={[styles.avatar, { backgroundColor: theme.primary }]}
                >
                  <Text style={styles.avatarText}>{getInitials()}</Text>
                </View>
                {editingName ? (
                  <View style={styles.nameEditRow}>
                    <TextInput
                      style={styles.nameInput}
                      value={newName}
                      onChangeText={setNewName}
                      placeholder="Display name"
                      autoFocus
                      placeholderTextColor="#aaa"
                    />
                    <TouchableOpacity
                      style={[
                        styles.saveNameBtn,
                        { backgroundColor: theme.primary },
                      ]}
                      onPress={handleSaveName}
                    >
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cancelNameBtn}
                      onPress={() => setEditingName(false)}
                    >
                      <Ionicons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.nameRow}
                    onPress={() => {
                      setNewName(displayName);
                      setEditingName(true);
                    }}
                  >
                    <Text style={styles.displayName}>{displayName}</Text>
                    <Ionicons
                      name="pencil-outline"
                      size={16}
                      color={theme.primary}
                      style={{ marginLeft: 8 }}
                    />
                  </TouchableOpacity>
                )}
                <Text style={styles.emailText}>{user.email}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#00c853" />
                  <Text style={styles.verifiedText}>Verified Account</Text>
                </View>
              </View>

              {/* STATS — uses theme.primary */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={[styles.statNum, { color: theme.primary }]}>
                    {tripCount}
                  </Text>
                  <Text style={styles.statLbl}>Trips Saved</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCard}>
                  <Text style={[styles.statNum, { color: theme.primary }]}>
                    {favoriteCount}
                  </Text>
                  <Text style={styles.statLbl}>Favourites</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCard}>
                  <Text style={[styles.statNum, { color: theme.primary }]}>
                    110
                  </Text>
                  <Text style={styles.statLbl}>Destinations</Text>
                </View>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => navigation.navigate("Planner")}
                >
                  <View
                    style={[
                      styles.actionIcon,
                      { backgroundColor: theme.primary + "22" },
                    ]}
                  >
                    <Ionicons name="sparkles" size={20} color={theme.primary} />
                  </View>
                  <Text style={styles.actionLabel}>Plan a New Trip</Text>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() =>
                    navigation.navigate("MainTabs", { screen: "MyTrips" })
                  }
                >
                  <View
                    style={[styles.actionIcon, { backgroundColor: "#e6f4ff" }]}
                  >
                    <Ionicons name="airplane" size={20} color="#0066cc" />
                  </View>
                  <Text style={styles.actionLabel}>My Saved Trips</Text>
                  <View
                    style={[
                      styles.countBadge,
                      { backgroundColor: theme.primary + "22" },
                    ]}
                  >
                    <Text
                      style={[styles.countBadgeText, { color: theme.primary }]}
                    >
                      {tripCount}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() =>
                    navigation.navigate("MainTabs", { screen: "Explore" })
                  }
                >
                  <View
                    style={[styles.actionIcon, { backgroundColor: "#fff3e6" }]}
                  >
                    <Ionicons name="compass" size={20} color="#ff9500" />
                  </View>
                  <Text style={styles.actionLabel}>Explore Destinations</Text>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionRow, { borderBottomWidth: 0 }]}
                  onPress={() => navigation.navigate("Favorites")}
                >
                  <View
                    style={[styles.actionIcon, { backgroundColor: "#fff0f0" }]}
                  >
                    <Ionicons name="heart" size={20} color="#ff3b30" />
                  </View>
                  <Text style={styles.actionLabel}>My Favourites</Text>
                  <View
                    style={[
                      styles.countBadge,
                      { backgroundColor: theme.primary + "22" },
                    ]}
                  >
                    <Text
                      style={[styles.countBadgeText, { color: theme.primary }]}
                    >
                      {favoriteCount}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>⚙️ Settings</Text>
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => setShowCurrencyModal(true)}
                >
                  <View
                    style={[styles.actionIcon, { backgroundColor: "#e8f5e9" }]}
                  >
                    <Ionicons name="cash-outline" size={20} color="#2e7d32" />
                  </View>
                  <Text style={styles.actionLabel}>Currency</Text>
                  <Text style={[styles.settingValue, { color: theme.primary }]}>
                    {selectedCurrency.symbol} {selectedCurrency.code}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => setShowThemeModal(true)}
                >
                  <View
                    style={[styles.actionIcon, { backgroundColor: "#fce4ec" }]}
                  >
                    <Ionicons
                      name="color-palette-outline"
                      size={20}
                      color="#ad1457"
                    />
                  </View>
                  <Text style={styles.actionLabel}>App Theme</Text>
                  <Text style={[styles.settingValue, { color: theme.primary }]}>
                    {THEMES.find((t) => t.id === currentThemeId)
                      ?.label.split(" ")
                      .slice(1)
                      .join(" ")}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionRow, { borderBottomWidth: 0 }]}
                  onPress={toggleNotifications}
                >
                  <View
                    style={[styles.actionIcon, { backgroundColor: "#e3f2fd" }]}
                  >
                    <Ionicons
                      name={
                        notificationsEnabled
                          ? "notifications"
                          : "notifications-off"
                      }
                      size={20}
                      color="#0277bd"
                    />
                  </View>
                  <Text style={styles.actionLabel}>Notifications</Text>
                  <View
                    style={[
                      styles.toggleTrack,
                      {
                        backgroundColor: notificationsEnabled
                          ? theme.primary
                          : "#ccc",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        {
                          alignSelf: notificationsEnabled
                            ? "flex-end"
                            : "flex-start",
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>About</Text>
                {[
                  { icon: "rocket-outline", text: "VoyageHub v1.0.0" },
                  {
                    icon: "globe-outline",
                    text: "110 cities • 1,870 attractions",
                  },
                  { icon: "sparkles-outline", text: "Powered by Gemini AI" },
                ].map((item, i) => (
                  <View key={i} style={styles.aboutRow}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={styles.aboutText}>{item.text}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={handleSignOut}
              >
                <Ionicons name="log-out-outline" size={20} color="#ff3b30" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.avatarSection}>
                <View style={[styles.avatar, { backgroundColor: "#e0e0e0" }]}>
                  <Ionicons name="person" size={40} color="#999" />
                </View>
                <Text style={styles.displayName}>Not Signed In</Text>
                <Text style={styles.emailText}>
                  Sign in to save & sync your trips
                </Text>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Why Sign In?</Text>
                {[
                  { icon: "sparkles-outline", text: "Generate AI itineraries" },
                  {
                    icon: "heart-outline",
                    text: "Save favourite destinations",
                  },
                  { icon: "sync-outline", text: "Sync trips across devices" },
                  {
                    icon: "shield-checkmark-outline",
                    text: "Your data stays private",
                  },
                ].map((item, i) => (
                  <View key={i} style={styles.aboutRow}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={styles.aboutText}>{item.text}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>⚙️ Settings</Text>
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => setShowCurrencyModal(true)}
                >
                  <View
                    style={[styles.actionIcon, { backgroundColor: "#e8f5e9" }]}
                  >
                    <Ionicons name="cash-outline" size={20} color="#2e7d32" />
                  </View>
                  <Text style={styles.actionLabel}>Currency</Text>
                  <Text style={[styles.settingValue, { color: theme.primary }]}>
                    {selectedCurrency.symbol} {selectedCurrency.code}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionRow, { borderBottomWidth: 0 }]}
                  onPress={() => setShowThemeModal(true)}
                >
                  <View
                    style={[styles.actionIcon, { backgroundColor: "#fce4ec" }]}
                  >
                    <Ionicons
                      name="color-palette-outline"
                      size={20}
                      color="#ad1457"
                    />
                  </View>
                  <Text style={styles.actionLabel}>App Theme</Text>
                  <Text style={[styles.settingValue, { color: theme.primary }]}>
                    {THEMES.find((t) => t.id === currentThemeId)
                      ?.label.split(" ")
                      .slice(1)
                      .join(" ")}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Get Started</Text>
                <TouchableOpacity
                  style={[styles.signUpBtn, { backgroundColor: theme.primary }]}
                  onPress={() => navigation.navigate("SignUp")}
                >
                  <Ionicons name="person-add-outline" size={20} color="#fff" />
                  <Text style={styles.signUpBtnText}>Create Account</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.loginBtn, { borderColor: theme.primary }]}
                  onPress={() => navigation.navigate("Login")}
                >
                  <Ionicons
                    name="log-in-outline"
                    size={20}
                    color={theme.primary}
                  />
                  <Text style={[styles.loginBtnText, { color: theme.primary }]}>
                    Log In
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>About VoyageHub</Text>
                {[
                  { icon: "rocket-outline", text: "v1.0.0 — Built with ❤️" },
                  {
                    icon: "globe-outline",
                    text: "110 cities • 1,870 attractions",
                  },
                  { icon: "sparkles-outline", text: "Powered by Gemini AI" },
                ].map((item, i) => (
                  <View key={i} style={styles.aboutRow}>
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={styles.aboutText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>

      {/* CURRENCY MODAL */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.modalOption,
                    selectedCurrency.code === c.code && [
                      styles.modalOptionSelected,
                      {
                        borderColor: theme.primary,
                        backgroundColor: theme.primary + "11",
                      },
                    ],
                  ]}
                  onPress={() => selectCurrency(c)}
                >
                  <View>
                    <Text
                      style={[
                        styles.modalOptionText,
                        selectedCurrency.code === c.code && {
                          color: theme.primary,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {c.symbol} {c.code}
                    </Text>
                    <Text style={styles.modalOptionSub}>{c.label}</Text>
                  </View>
                  {selectedCurrency.code === c.code && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={theme.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* THEME MODAL */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Theme</Text>
              <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {THEMES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.modalOption,
                  currentThemeId === t.id && [
                    styles.modalOptionSelected,
                    {
                      borderColor: t.primary,
                      backgroundColor: t.primary + "11",
                    },
                  ],
                ]}
                onPress={() => selectTheme(t)}
              >
                <View style={styles.themePreviewRow}>
                  <View
                    style={[
                      styles.themeColorDot,
                      { backgroundColor: t.primary },
                    ]}
                  />
                  <View
                    style={[
                      styles.themeColorDot,
                      { backgroundColor: t.accent, marginLeft: -8 },
                    ]}
                  />
                  <Text
                    style={[
                      styles.modalOptionText,
                      { marginLeft: 12 },
                      currentThemeId === t.id && {
                        color: t.primary,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {t.label}
                  </Text>
                </View>
                {currentThemeId === t.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={t.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 55,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    elevation: 4,
  },
  avatarText: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  nameRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  displayName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  emailText: { fontSize: 14, color: "#888", marginBottom: 8 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e6f9ee",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  verifiedText: { fontSize: 12, color: "#00c853", fontWeight: "600" },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: "#6200ee",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: "#333",
    minWidth: 160,
    backgroundColor: "#fff",
  },
  saveNameBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelNameBtn: {
    backgroundColor: "#f0f0f0",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
  },
  statCard: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  statLbl: { fontSize: 12, color: "#888" },
  statDivider: { width: 1, backgroundColor: "#eee", marginHorizontal: 8 },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
    gap: 12,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: { flex: 1, fontSize: 15, color: "#333", fontWeight: "500" },
  settingValue: { fontSize: 13, fontWeight: "600", marginRight: 4 },
  countBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
  },
  countBadgeText: { fontSize: 12, fontWeight: "700" },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, padding: 2 },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 7,
  },
  aboutText: { fontSize: 14, color: "#555" },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#ff3b30",
    elevation: 1,
  },
  signOutText: { fontSize: 16, color: "#ff3b30", fontWeight: "600" },
  signUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 12,
    elevation: 3,
  },
  signUpBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1.5,
    elevation: 1,
  },
  loginBtnText: { fontSize: 16, fontWeight: "700" },
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
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
  },
  modalOptionSelected: { borderWidth: 1.5 },
  modalOptionText: { fontSize: 15, color: "#333", fontWeight: "500" },
  modalOptionSub: { fontSize: 12, color: "#888", marginTop: 2 },
  themePreviewRow: { flexDirection: "row", alignItems: "center" },
  themeColorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 2,
  },
});
