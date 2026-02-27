import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEMES = {
  default: { primary: "#6200ee", accent: "#00c853", name: "Classic Purple" },
  warm: { primary: "#e65100", accent: "#ffb300", name: "Warm Sunset" },
  cool: { primary: "#0277bd", accent: "#00bcd4", name: "Cool Ocean" },
  rose: { primary: "#ad1457", accent: "#ff6f91", name: "Rose Gold" },
  forest: { primary: "#2e7d32", accent: "#81c784", name: "Forest Green" },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(THEMES.default);

  useEffect(() => {
    AsyncStorage.getItem("selectedTheme").then((val) => {
      if (val) {
        const saved = JSON.parse(val);
        if (THEMES[saved.id]) setTheme(THEMES[saved.id]);
      }
    });
  }, []);

  const changeTheme = async (themeId) => {
    const t = THEMES[themeId];
    if (t) {
      setTheme(t);
      await AsyncStorage.setItem(
        "selectedTheme",
        JSON.stringify({ id: themeId, ...t }),
      );
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
