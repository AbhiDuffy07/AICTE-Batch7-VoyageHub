import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { ActivityIndicator, View } from "react-native";

import BottomTabs from "./BottomTabs";
import { getCurrentUser, onAuthStateChange } from "../services/supabase";
import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
import SignUpScreen from "../screens/Auth/SignUpScreen";
import PlannerScreen from "../screens/Main/Planner/PlannerScreen";
import ResultScreen from "../screens/Main/Planner/ResultScreen";
import TripDetailScreen from "../screens/Main/Trips/TripDetailScreen";
import DestinationDetailScreen from "../screens/Main/Home/DestinationdetailScreen";
import ProfileScreen from "../screens/Main/Profile/ProfileScreen";
import AccommodationDetailScreen from "../screens/Main/Planner/AccommodationDetailScreen";
import FoodDetailScreen from "../screens/Main/Planner/FoodDetailScreen";
import ActivitiesDetailScreen from "../screens/Main/Planner/ActivitesDetailScreen";
import TransportDetailScreen from "../screens/Main/Planner/TransportDetailScreen";
import FavoritesScreen from "../screens/Main/Profile/FavoritesScreen";

const Stack = createStackNavigator();

export default function RootNavigation() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    getCurrentUser().then(setUser);
    const sub = onAuthStateChange((u) => setUser(u));
    return () => sub?.unsubscribe?.();
  }, []);

  if (user === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen name="Planner" component={PlannerScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      <Stack.Screen
        name="DestinationDetail"
        component={DestinationDetailScreen}
      />
      <Stack.Screen
        name="AccommodationDetail"
        component={AccommodationDetailScreen}
      />
      <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
      <Stack.Screen
        name="ActivitiesDetail"
        component={ActivitiesDetailScreen}
      />
      <Stack.Screen name="TransportDetail" component={TransportDetailScreen} />
    </Stack.Navigator>
  );
}
