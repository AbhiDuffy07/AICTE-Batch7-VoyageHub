import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

export default function DestinationCard({ destination, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image source={{ uri: destination.image }} style={styles.cardImage} />
      <View style={styles.cardOverlay}>
        <Text style={styles.cardTitle}>{destination.name}</Text>
        <Text style={styles.cardSubtitle}>{destination.country}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardDescription}>{destination.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardCost}>{destination.avgCost}</Text>
          <Text style={styles.cardLink}>View Details →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    width: "100%",
    height: 220,
  },
  cardOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  cardSubtitle: {
    fontSize: 16,
    color: "#fff",
    marginTop: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCost: {
    fontSize: 18,
    color: "#6200ee",
    fontWeight: "bold",
  },
  cardLink: {
    fontSize: 14,
    color: "#6200ee",
    fontWeight: "600",
  },
});
