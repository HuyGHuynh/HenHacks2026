# ByteMeQuickly

ByteMeQuickly is a food waste reduction project that combines AI-powered food analysis with a community sharing platform. The app helps users detect food condition, generate recipes from available ingredients, and share surplus food with nearby neighbors.

## What It Includes

- A React + Vite multi-page frontend
- A Flask backend API
- Gemini-powered food analysis and recipe generation
- ElevenLabs-powered text-to-speech support
- MongoDB-backed food detection storage

## Main Features

- Detect food freshness and condition from camera input
- Display AI detection results in the web interface
- Read detection results aloud with text-to-speech
- Generate recipe suggestions from available ingredients
- Share or request food through a community board
- Save and manage food detections through the backend

## Project Structure

```text
henhacks/
├── backend/
│   ├── main_api.py
│   ├── realtime_object_detection.py
│   ├── cooking_assistant_fixed.py
│   ├── app.py
│   └── requirements.txt
└── frontend/
    ├── src/
    ├── index.html
    ├── login.html
    ├── dashboard.html
    ├── recipe.html
    ├── social.html
    └── package.json
```

## Tech Stack

### Frontend

- React
- Vite
- CSS

### Backend

- Flask
- Flask-CORS
- PyMongo

### AI / ML

- Google Gemini (`google-genai`)
- OpenCV
- ElevenLabs

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/HuyGHuynh/HenHacks2026.git
cd HenHacks2026
```

### 2. Set up the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/` with the required keys:

```env
GEMINI_API_KEY=your_gemini_key
ELEVENLABS_API_KEY=your_elevenlabs_key
MONGODB_URI=your_mongodb_connection_string
```

Run the backend:

```bash
python main_api.py
```

The API runs on `http://localhost:5000`.

### 3. Set up the frontend

```bash
cd ../frontend
npm install
npm run dev
```

The frontend runs on the Vite dev server, typically:

`http://localhost:5173`

## Frontend Pages

- `login.html` - Sign-in screen
- `dashboard.html` - Main overview page
- `index.html` - Food detection page
- `recipe.html` - Recipe recommender
- `social.html` - Community board

## Core Backend Endpoints

- `GET /api/health`
- `GET /api/gemini-results`
- `POST /api/gemini-results`
- `POST /api/test-detection`
- `POST /api/text-to-speech`
- `GET /api/voices`

## Notes

- The frontend is built as a Vite multi-page app, not a single-page router app.
- The backend expects valid API keys for Gemini and ElevenLabs.
- MongoDB is optional for local UI work, but required for full persistence.

## Demo Flow

1. Sign in from `login.html`
2. Land on the dashboard
3. Open the detection page to analyze food
4. Open the recipe page for cooking suggestions
5. Use the community page to share or request food
