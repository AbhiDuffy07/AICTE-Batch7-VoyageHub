const fs = require("fs");
const https = require("https");

// Import your destinations
const data = require("./frontend/src/data/destinations_with_real_attractions_final.json");
const DESTINATIONS = data;

// Nominatim API
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Delay function (1 request per second)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetch GPS coordinates for an attraction
async function fetchGPS(city, country, attractionName) {
  const query = `${attractionName}, ${city}, ${country}`;
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;

  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "VoyageHub-App" } }, (res) => {
        let data = "";

        res.on("data", (chunk) => (data += chunk));

        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.length > 0) {
              console.log(
                `✅ Found: ${attractionName} → (${json[0].lat}, ${json[0].lon})`,
              );
              resolve({
                latitude: parseFloat(json[0].lat),
                longitude: parseFloat(json[0].lon),
              });
            } else {
              console.log(
                `❌ Not found: ${attractionName} (will use city center)`,
              );
              resolve(null);
            }
          } catch (error) {
            console.log(`⚠️ Error parsing: ${attractionName}`);
            resolve(null);
          }
        });
      })
      .on("error", (error) => {
        console.log(`⚠️ Network error: ${attractionName}`);
        resolve(null);
      });
  });
}

// Main function
async function addGPSToDestinations(testMode = true) {
  console.log("🚀 Starting GPS Fetch...\n");

  // Test mode: Only first 2 cities
  const citiesToProcess = testMode ? DESTINATIONS.slice(0, 2) : DESTINATIONS;
  console.log(`📍 Processing ${citiesToProcess.length} cities...\n`);

  const updatedDestinations = [];

  for (const destination of citiesToProcess) {
    console.log(`\n🏙️ Processing: ${destination.city}, ${destination.country}`);

    const updatedAttractions = [];

    for (const attraction of destination.attractions) {
      // Fetch GPS
      const gps = await fetchGPS(
        destination.city,
        destination.country,
        attraction.name,
      );

      // Add GPS to attraction
      updatedAttractions.push({
        ...attraction,
        latitude: gps ? gps.latitude : null,
        longitude: gps ? gps.longitude : null,
      });

      // Wait 1 second (Nominatim rate limit)
      await delay(1100);
    }

    // Update destination with new attractions
    updatedDestinations.push({
      ...destination,
      attractions: updatedAttractions,
    });

    console.log(`✅ ${destination.city} completed!\n`);
  }

  // If test mode, keep other cities unchanged
  if (testMode) {
    const remainingCities = DESTINATIONS.slice(2);
    updatedDestinations.push(...remainingCities);
  }

  // Save to new file
  const outputPath =
    "./frontend/src/data/destinations_with_real_attractions_final.json";
  const fileContent = JSON.stringify(updatedDestinations, null, 2);

  fs.writeFileSync(outputPath, fileContent, "utf8");

  console.log("\n🎉 SUCCESS!");
  console.log(`📁 File saved: ${outputPath}`);
  console.log(`✅ Processed ${citiesToProcess.length} cities`);
  console.log(
    `✅ Total attractions: ${citiesToProcess.reduce((sum, d) => sum + d.attractions.length, 0)}`,
  );
}
addGPSToDestinations(false);
