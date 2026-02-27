import { createClient } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";

WebBrowser.maybeCompleteAuthSession();

const SUPABASE_URL = "https://pzejmoyshpxmregemjed.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_L5S48kwF6gOeMBjt5vGnNQ_ivuvPYYv";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── AUTH ─────────────────────────────────────────────────────

export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
};

export const sendOTP = async (email) => {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
  return true;
};

export const verifyOTP = async (email, token) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token,
    type: "email",
  });
  if (error) throw error;
  return data.user;
};

export const signInWithGoogle = async () => {
  const redirectUrl = AuthSession.makeRedirectUri({ useProxy: true });
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
  });
  if (error) throw error;
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
  if (result.type === "success") {
    await supabase.auth.exchangeCodeForSession(result.url);
    return await getCurrentUser();
  }
  return null;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return true;
};

export const onAuthStateChange = (callback) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return subscription;
};

export const updateDisplayName = async (name) => {
  const { error } = await supabase.auth.updateUser({
    data: { display_name: name },
  });
  if (error) throw error;
  return true;
};

// ─── TRIPS ────────────────────────────────────────────────────

export const saveTrip = async (destination, days, itinerary) => {
  try {
    const user = await getCurrentUser();
    const { data, error } = await supabase
      .from("Trips")
      .insert([{ destination, days, itinerary, user_id: user?.id || null }])
      .select();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error saving trip:", error);
    throw error;
  }
};

export const getTrips = async () => {
  try {
    const user = await getCurrentUser();
    let query = supabase
      .from("Trips")
      .select("*")
      .order("created_at", { ascending: false });
    if (user?.id) query = query.eq("user_id", user.id);
    const { data, error } = await query;
    if (error) {
      console.error("Supabase error:", error);
      return []; // ← return empty instead of crashing
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching trips:", error);
    return []; // ← never crash the screen
  }
};

export const deleteTrip = async (id) => {
  try {
    const { error } = await supabase.from("Trips").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting trip:", error);
    throw error;
  }
};

export const getTripCount = async () => {
  try {
    const user = await getCurrentUser();
    let query = supabase
      .from("Trips")
      .select("id", { count: "exact", head: true });
    if (user?.id) query = query.eq("user_id", user.id);
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  } catch {
    return 0;
  }
};

// ─── FAVORITES ────────────────────────────────────────────────

export const addFavorite = async (destinationId, destinationName) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not logged in");
    const { data, error } = await supabase
      .from("favorites")
      .insert([
        {
          user_id: user.id,
          destination_id: destinationId,
          destination_name: destinationName,
        },
      ])
      .select();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding favorite:", error);
    throw error;
  }
};

export const removeFavorite = async (destinationId) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not logged in");
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("destination_id", destinationId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error removing favorite:", error);
    throw error;
  }
};

export const getFavorites = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
};

export const getFavoriteCount = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return 0;
    const { count, error } = await supabase
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error fetching favorite count:", error);
    return 0;
  }
};
