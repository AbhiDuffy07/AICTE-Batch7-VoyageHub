import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigation from "./src/navigation/RootNavigation";
import { ThemeProvider } from "./src/context/ThemeContext";

export default function App() {
  useEffect(() => {
    fetch("https://voyagehub-backend.onrender.com/api/health")
      .then(() => console.log("Backend warmed up"))
      .catch(() => console.log("Backend warming up..."));
  }, []);

  return (
    <ThemeProvider>
      <NavigationContainer>
        <RootNavigation />
      </NavigationContainer>
    </ThemeProvider>
  );
}
