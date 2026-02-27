import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Image } from "react-native";

const { width, height } = Dimensions.get("window");

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("MainTabs"); // Go to tabs (or Login if no user)
    }, 2500); // 2.5 seconds

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/VH_splashscr2.png")}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  image: { width: width * 1.2, height: height * 1.2 },
});
