# VoyageHub Backend API 🚀

AI-powered travel itinerary generator. Flask + Gemini AI + Supabase.

## Base URL

https://voyagehub-backend.onrender.com

## Endpoints

### `POST /generate-trip`

**Generates AI itinerary**

```json
Body: {
  "destination": "Paris",
  "days": 5,
  "budget": 1500,
  "group_type": "couple",
  "members": 2
}
Returns:
{
  "itinerary": "Day 1: Morning - Eiffel Tower...\nDay 2...",
  "success": true
}
POST /save-trip
Saves trip to user's account
Body: {
  "destination": "Paris",
  "days": 5,
  "itinerary": "Full itinerary text...",
  "budget": 1500,
  "group_type": "couple"
}
Returns:
{
  "id": "trip-uuid",
  "success": true
}
GET /get-trips
Fetch user's saved trips
Headers: Authorization: Bearer user-token
Returns:
[
  {
    "id": "trip-uuid",
    "destination": "Paris",
    "days": 5,
    "created_at": "2026-02-27T10:00:00Z"
  }
]
POST /recommendations
Get hotels/food/transport for destination
Body: {
  "destination": "Paris",
  "type": "hotels" // or "food", "transport"
}
Returns:
{
  "success": true,
  "data": "[Hotel recommendations...]"
}
Tech Stack
Backend: Flask (Python)

AI: Google Gemini

Database: Supabase PostgreSQL

Deploy: Render.com (Free tier)

**Copy ALL above → Paste in README.md → Ctrl+S → DONE!**

**Your backend now looks professional on GitHub.** 🚀

**Next: Web deploy for live demo link?**
```
