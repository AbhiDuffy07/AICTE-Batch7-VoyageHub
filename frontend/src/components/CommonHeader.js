import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function CommonHeader({
  appName = "🚀 VoyageHub",
  tagline = "Your AI-powered travel companion",
  showProfile = true,
  onProfilePress,
  children,
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: theme.primary }]}>
      <View style={styles.headerTop}>
        <View style={styles.headerText}>
          <Text style={styles.appName}>{appName}</Text>
          <Text style={styles.tagline}>{tagline}</Text>
        </View>
        {showProfile && (
          <TouchableOpacity
            style={styles.profileButton}
            onPress={onProfilePress}
          >
            <Ionicons name="person-circle-outline" size={32} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: { flex: 1 },
  appName: {
    fontSize: 18,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 4,
    fontWeight: "600",
  },
  tagline: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
