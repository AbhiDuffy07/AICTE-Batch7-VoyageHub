// Free alternative to Google Places API
const NOMINATIM_API = "https://nominatim.openstreetmap.org";

export const searchPlaces = async (query) => {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
      `${NOMINATIM_API}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
      {
        headers: {
          "User-Agent": "AITravelApp/1.0", // Required by Nominatim
        },
      },
    );

    const data = await response.json();

    // Format results
    return data.map((place) => ({
      name: place.display_name,
      city: place.address.city || place.address.town || place.address.village,
      country: place.address.country,
      lat: place.lat,
      lon: place.lon,
      displayName: `${place.address.city || place.address.town || place.name}, ${place.address.country}`,
    }));
  } catch (error) {
    console.error("Nominatim search error:", error);
    return [];
  }
};
