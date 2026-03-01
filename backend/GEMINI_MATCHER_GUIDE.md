# Gemini-Powered Ingredient Matcher

AI-driven matching system that intelligently connects users looking for ingredients with users offering ingredients.

## Overview

This system uses **Google Gemini AI** to:
- ✅ Match ingredient requests with offers based on semantic similarity
- ✅ Handle substitutes and related items (e.g., "tomatoes" matches "cherry tomatoes")
- ✅ Score matches by relevance (60-100%)
- ✅ Consider quantities and locations
- ✅ Exclude self-matching (users can't match with themselves)

## Files

### Backend Files

1. **`gemini_ingredient_matcher.py`** - Core matching logic
   - `CommunityPostsDatabase`: Retrieves posts from MongoDB
   - `GeminiIngredientMatcher`: AI-powered matching engine
   - `run_matcher()`: Standalone script to run matching

2. **`gemini_matcher_routes.py`** - Flask API endpoints
   - `/api/match-ingredients` - Match all requests with all offers
   - `/api/match-single-request` - Match one specific request
   - `/api/matcher-status` - Check service status

3. **`main_api.py`** - Integrated routes (already updated)

## How It Works

### Data Flow

```
MongoDB (freshloop_community.community_posts)
    ↓
Retrieve posts (separated by type: request vs offer)
    ↓
Gemini AI analyzes ingredient compatibility
    ↓
Return scored matches with reasons
    ↓
Frontend displays matches
```

### Matching Algorithm

1. **Retrieve posts** from local storage (MongoDB)
   - Requests: Users looking for ingredients
   - Offers: Users giving ingredients

2. **AI Analysis** via Gemini
   - Exact ingredient matches
   - Substitute detection (basil ↔ cilantro)
   - Related items (tomatoes ↔ cherry tomatoes)
   - Quantity compatibility

3. **Scoring** (0-100%)
   - 90-100%: Perfect match
   - 75-89%: Good match with substitutes
   - 60-74%: Partial match
   - <60%: Not included in results

4. **Results** include:
   - Match score
   - Matched ingredients
   - Reason for match
   - User details
   - Location info

## Usage

### Option 1: Command Line Script

Run the standalone matcher:

```powershell
cd "C:\Users\Amie Nguyen\Desktop\hackathon\HenHacks2026\backend"
python gemini_ingredient_matcher.py
```

Output:
- Console: Detailed matching process
- File: `ingredient_matches.json` with all results

### Option 2: API Endpoints

Start the server:

```powershell
cd "C:\Users\Amie Nguyen\Desktop\hackathon\HenHacks2026\backend"
python main_api.py
```

#### Match All Requests

```javascript
// Frontend JavaScript
const response = await fetch('http://localhost:5000/api/match-ingredients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});

const data = await response.json();
console.log(`Found ${data.stats.total_matches} matches`);
console.log(data.matches);
```

**Response:**
```json
{
  "success": true,
  "matches": {
    "post_id_1": [
      {
        "request": {
          "user_id": "alice123",
          "ingredients": "tomatoes, onions, garlic",
          "post_id": "post_id_1"
        },
        "offer": {
          "user_id": "bob456",
          "ingredients": "fresh tomatoes, red onions",
          "location": {"description": "Downtown"},
          "post_id": "post_id_5"
        },
        "match_score": 95,
        "matched_ingredients": ["tomatoes", "onions"],
        "reason": "Exact match for tomatoes and onions",
        "matched_at": "2026-03-01T10:30:00"
      }
    ]
  },
  "stats": {
    "total_requests": 5,
    "total_offers": 8,
    "total_matches": 12,
    "requests_with_matches": 4
  }
}
```

#### Match Single Request

```javascript
const response = await fetch('http://localhost:5000/api/match-single-request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    request_post_id: "post_id_1"
  })
});

const data = await response.json();
console.log(`Found ${data.stats.total_matches} matches for this request`);
```

#### Check Matcher Status

```javascript
const response = await fetch('http://localhost:5000/api/matcher-status');
const status = await response.json();

console.log(`Database: ${status.database}`);
console.log(`Requests: ${status.stats.request_posts}`);
console.log(`Offers: ${status.stats.offer_posts}`);
```

### PowerShell Examples

Match all:
```powershell
$result = Invoke-RestMethod -Uri "http://localhost:5000/api/match-ingredients" -Method Post -ContentType "application/json"
$result.stats
$result.matches | ConvertTo-Json -Depth 10
```

Match single:
```powershell
$body = @{ request_post_id = "post_id_1" } | ConvertTo-Json
$result = Invoke-RestMethod -Uri "http://localhost:5000/api/match-single-request" -Method Post -ContentType "application/json" -Body $body
$result.matches | ConvertTo-Json -Depth 10
```

Check status:
```powershell
$status = Invoke-RestMethod -Uri "http://localhost:5000/api/matcher-status"
$status | ConvertTo-Json
```

## Configuration

### Environment Variables

Required in `.env` file:

```env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb+srv://username:password@host/database
```

### Database Structure

**Collection:** `freshloop_community.community_posts`

**Post Schema:**
```json
{
  "_id": "unique_id",
  "user_id": "alice123",
  "type": "request",  // or "offer"
  "ingredients": [
    {
      "name": "tomatoes",
      "normalized_name": "tomato",
      "quantity": 2.0,
      "unit": "cups"
    }
  ],
  "location": {
    "lat": 40.7128,
    "lng": -74.0060,
    "description": "Downtown"
  },
  "original_text": "Need: 2 cups tomatoes",
  "status": "active",
  "created_at": "2026-03-01T10:00:00"
}
```

## Integration Examples

### React Component

```jsx
import { useState, useEffect } from 'react';

function IngredientMatcher() {
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);

  const runMatcher = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/match-ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        setMatches(data);
      }
    } catch (error) {
      console.error('Matching failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={runMatcher} disabled={loading}>
        {loading ? 'Matching...' : 'Find Matches'}
      </button>

      {matches && (
        <div>
          <h3>Found {matches.stats.total_matches} matches!</h3>
          {Object.entries(matches.matches).map(([requestId, matchList]) => (
            <div key={requestId}>
              <h4>Request from {matchList[0]?.request.user_id}</h4>
              {matchList.map((match, idx) => (
                <div key={idx}>
                  <p>Match Score: {match.match_score}%</p>
                  <p>Offer from: {match.offer.user_id}</p>
                  <p>Ingredients: {match.offer.ingredients}</p>
                  <p>Reason: {match.reason}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Features

### Smart Matching

| Request | Offer | Match Score | Reason |
|---------|-------|-------------|--------|
| tomatoes | fresh tomatoes | 95% | Exact match |
| basil | cilantro | 70% | Can be substituted in recipes |
| 2 cups flour | 500g flour | 85% | Quantity compatible |
| bell peppers | red peppers | 90% | Same ingredient, color variation |

### Exclusions

- ❌ Users can't match with their own posts
- ❌ Inactive posts are ignored
- ❌ Matches below 60% score are filtered out

## Troubleshooting

### Error: "Matcher not initialized"
**Solution:** Check that:
1. `GOOGLE_GEMINI_API_KEY` is in `.env`
2. `MONGODB_URI` is in `.env`
3. Server was restarted after adding env vars

### Error: "No posts found"
**Solution:** Add posts to MongoDB:
- Via frontend community tab
- Via import endpoints
- Manually insert test data

### Error: "Error parsing Gemini response"
**Solution:** 
- Check Gemini API quota/limits
- Verify API key is valid
- Try again (transient API issue)

### Low match scores
**Solution:** Gemini is conservative. Scores 60-75% are still valid matches. Adjust threshold if needed in `match_single_request_with_offers()`.

## API Response Times

- Single request match: ~2-4 seconds
- All matches (5 requests, 10 offers): ~10-20 seconds
- Status check: <100ms

**Note:** Gemini API calls add latency. Consider caching results.

## Cost Considerations

Gemini API usage:
- ~1 request per match operation
- Token usage depends on post lengths
- Use Gemini's free tier for development
- Monitor usage in production

## Next Steps

1. **Frontend Integration**
   - Add "Find Matches" button
   - Display match scores visually
   - Allow users to contact matched users

2. **Notifications**
   - Email users when matches are found
   - Push notifications for high-score matches

3. **Caching**
   - Cache match results for 5-10 minutes
   - Invalidate when new posts added

4. **Analytics**
   - Track match success rates
   - Identify common ingredient pairings
   - Improve AI prompts based on feedback

## Support

For issues or questions:
1. Check server logs: `python main_api.py`
2. Verify database connection
3. Test API endpoints individually
4. Check Gemini API status

---

**Created:** March 2026  
**Version:** 1.0.0  
**Dependencies:** Flask, PyMongo, google-generativeai
