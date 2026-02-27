import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../screens/Main/Home/HomeScreen";
import ExploreScreen from "../screens/Main/Explore/ExploreScreen";
import MyTripsScreen from "../screens/Main/Trips/MyTripsScreen";
import { useTheme } from "../context/ThemeContext"; // ← ADD

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  const { theme } = useTheme(); // ← ADD

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary, // ← WAS hardcoded #6200ee
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
          height: 62,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Home")
            iconName = focused ? "home" : "home-outline";
          else if (route.name === "Explore")
            iconName = focused ? "compass" : "compass-outline";
          else if (route.name === "MyTrips")
            iconName = focused ? "airplane" : "airplane-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ tabBarLabel: "Explore" }}
      />
      <Tab.Screen
        name="MyTrips"
        component={MyTripsScreen}
        options={{ tabBarLabel: "My Trips" }}
      />
    </Tab.Navigator>
  );
}
