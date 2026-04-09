<div align="center">
  <h1>🎧 AI-Powered Music Recommendation System</h1>
  <p>A full-stack, AI-driven music recommendation platform that brings intelligent content searching, mood-based playlists, and emotion detection into a unified and dynamic frontend experience.</p>

  ![License](https://img.shields.io/badge/license-MIT-blue.svg)
  ![React](https://img.shields.io/badge/React-19.2-blue)
  ![Flask](https://img.shields.io/badge/Flask-3.1-blue)
  ![Python](https://img.shields.io/badge/Python-3.10+-yellow.svg)
  ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)
</div>

---

## 📌 1. Project Title & Overview

**AI-Powered Music Recommendation System** is a sophisticated full-stack application that provides users with highly personalized music recommendations. Going beyond basic genre-filtering, this application evaluates song tags using Machine Learning (TF-IDF & Cosine Similarity), curates playlists by analyzing facial expressions (via deep learning), and offers an AI chatbot for music-related queries. 

### Real-World Problem It Solves
Users often experience decision fatigue when choosing what to listen to among millions of tracks. They require intelligent discovery mechanisms—whether they need a song similar to their current favorite, an energetic mix to match a workout, or a playlist based on their current facial emotion. 

### Key Features
- **AI-Driven Song Recommendations:** Built-in NLP engine vectors track features and computes similarities instantly.
- **Emotion & Mood Detection:** Analyzes users' facial expressions through their camera to detect mood and suggest appropriate tracks (Premium Feature).
- **Embedded YouTube Player:** Seamless YouTube API integration automatically finds and plays the music videos for recommended tracks.
- **Spotify Integration:** Enriches recommendations with Spotify metadata (album arts, preview URLs).
- **Payment Gateway:** Razorpay integration for upgrading to Premium (unlocks emotion detection and extended recommendation results).
- **Interactive Chatbot:** Natural language chatbot to ask for songs by artist or mood directly.

---

## 🧠 2. System Architecture

The application strictly adheres to a modular Client-Server Architecture.

1. **Frontend (Client):** React handles the UI, component state, and global user/theme context. It makes HTTP requests to the backend server.
2. **Backend (Server):** A Flask (Python) server acts as the central brain. It exposes RESTful endpoints, handles ML models (scikit-learn & DeepFace), and communicates with the MongoDB cluster.
3. **Database:** MongoDB Atlas is used for scalable NoSQL document storage (Users, Subscriptions, Favorites).
4. **External APIs:**
   - **YouTube Data API:** Fetches video playback IDs.
   - **Razorpay API:** Processes subscription payments securely.

**Data Flow:**
User Action (UI) ➡️ React state changes ➡️ Axios API Request ➡️ Flask Blueprint ➡️ Flask Service (ML/DB/Auth) ➡️ MongoDB/External APIs ➡️ JSON Response ➡️ React Context/State Update ➡️ UI Renders.

---

## 📂 3. Folder Structure

```text
📦 Music_Recomendation_System
├── 📂 backend
│   ├── 📂 app
│   │   ├── 📂 blueprints       # API Route Handlers (music.py, auth.py, personalization.py)
│   │   ├── 📂 repositories     # Database logic & MongoDB interactions
│   │   ├── 📂 services         # Core Logic (recommendation, emotion, chatbot, payments, youtube)
│   │   ├── __init__.py         # Flask app factory and initialization
│   │   ├── config.py           # Environment variables & configurations
│   ├── 📄 requirements.txt     # Python dependencies
│   ├── 📄 run.py               # Application entry point
│   └── 📄 dataset.csv          # Huge Spotify music dataset used by the ML engine
└── 📂 frontend
    ├── 📂 src
    │   ├── 📂 api              # Axios client (client.js)
    │   ├── 📂 components       # React UI Components (auth, music, billing, pages, layout)
    │   ├── 📂 context          # Global Context Providers (AuthProvider, ThemeProvider)
    │   ├── 📄 App.jsx          # React Router configurations
    │   ├── 📄 main.jsx         # React DOM entry
    │   └── 📄 index.css        # Tailwind directives and custom UI variables
    ├── 📄 package.json         # Node.js dependencies
    ├── 📄 tailwind.config.js   # Tailwind configurations
    └── 📄 vite.config.js       # Vite bundler configurations
```

### Important Files:
- `backend/app/services/recommendation.py`: The heart of the ML logic. Loads the dataset, builds a TF-IDF matrix, and runs Cosine Similarity.
- `backend/app/blueprints/auth.py`: Handles JWT generation, login, signup, and user favorite management.
- `frontend/src/context/AuthProvider.jsx`: React Context dealing with JWT local storage parsing and authentication state.

---

## ⚙️ 4. Tech Stack

### Frontend
- **React.js (v19):** Modern component-based view library.
- **Vite:** Next-generation, lightning-fast frontend build tool.
- **Tailwind CSS:** Utility-first framework for rapid, responsive UI development.
- **Framer Motion:** High-performance animation library for smooth UI transitions.

### Backend
- **Flask (v3.1):** Lightweight and highly flexible Python web framework.
- **PyMongo:** Connects Flask to the MongoDB database.
- **Flask-JWT-Extended:** Secures endpoints using JSON Web Tokens.
- **scikit-learn / pandas:** Used for Natural Language Processing (NLP) vectorization and recommendation math.
- **DeepFace / OpenCV:** Used in the server to analyze images sent from the frontend to detect human emotion.

### External Libraries & APIs
- **YouTube API v3:** For searching and rendering music videos.
- **Spotify API (Client Credentials):** To retrieve track covers and Spotify links.
- **Razorpay API:** Checkout and subscription billing system.

---

## 🔄 5. Application Flow (Step-by-Step)

1. **User Landing & Onboarding:** The user visits the app, sees landing pages (Features, About). To use features, they register/login.
2. **Authentication:** React sends `POST /api/register`. Flask securely hashes the password via bcrypt, stores it in MongoDB, and returns a JWT. React saves the JWT in localStorage.
3. **Music Search:** User types "Shape of You" into the search bar. React fires `POST /search`. Flask queries the pandas DataFrame and returns matches.
4. **Getting Recommendations:** User selects the song. `POST /recommend` is fired. 
   - Backend creates a TF-IDF vector of the requested song's features (artist, genre, album).
   - Computes Cosine Similarity against all other 100,000+ tracks.
   - Extracts top 5 similar tracks.
   - Pings YouTube Data API to fetch matching video IDs.
5. **Playback & Engagement:** The backend returns the JSON objects. React dynamically loads YouTube iframes for playback.
6. **Favoriting:** User clicks a "heart" icon. React sends `POST /api/favorites`. The backend updates the user's document in MongoDB.

---

## 🔌 6. REST API Design

Here are the core backend endpoints:

### Authentication & Users (`/api`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/register` | Register a new user | No |
| `POST` | `/login` | Authenticate and retrieve JWT | No |
| `GET`  | `/me` | Get currently logged-in user profile | **Yes (JWT)** |

### Playlists & Favorites (`/api/favorites`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET`  | `/favorites` | Get user saved favorites | **Yes (JWT)** |
| `POST` | `/favorites` | Add song to favorites | **Yes (JWT)** |
| `DELETE` | `/favorites/<id>`| Remove favorite by ID | **Yes (JWT)** |

### Billing (`/api/payments`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/create-order`| Init Razorpay premium order | **Yes (JWT)** |
| `POST` | `/verify` | Verify Razorpay webhook signature| **Yes (JWT)** |

### Music Engine
| Method | Endpoint | Description | Request Format |
|--------|----------|-------------|----------------|
| `POST` | `/search` | Typeahead search | `{ "query": "string" }` |
| `POST` | `/recommend` | Similiarity Recs | `{ "song": "string" }` |
| `GET`  | `/recommend/mood/<mood>`| Dynamic mood curation| Query param |
| `POST` | `/recommend/emotion` | Face emotion detection | `{ "image": "base64" }`|
| `POST` | `/chatbot/query` | Conversational query | `{ "query": "string" }`|

 *(Note: Premium users get increased limits and unlock `/recommend/emotion`)*

---

## 🧩 7. Core Logic Explanation

### 1. TF-IDF & Cosine Similarity (Recommendation Engine)
When the server starts, it loads a massive `dataset.csv` into a Pandas DataFrame. It creates a `tags` column by combining track metrics (artist, genre, album name). 
It then uses `TfidfVectorizer` to convert these textual "tags" into numerical matrices. When a user requests a song, the system grabs its matrix vector, runs `cosine_similarity()` against ALL other tracks, sorts them descending, and slices the top matches.

### 2. Emotion Detection Pipeline (Premium)
When a user activates their camera, the frontend takes a webcam snapshot, shrinks it to base64, and POSTs it to the server. The server routes the image to the `DeepFace` neural network wrapper, which uses facial geometry to determine the dominant emotion (e.g. "happy", "sad"). The backend then queries the recommendation engine for songs that mathematically map to this mood criteria using acousticness, valence, and energy scores.

---

## 🗄️ 8. Database Schema

The project uses **MongoDB** as a NoSQL datastore focusing on a `Users` collection.

**Collection: `users`**
```json
{
  "_id": "ObjectId",
  "username": "String (Unique)",
  "password_hash": "String (Bcrypt)",
  "created_at": "ISODate",
  "is_premium": "Boolean",
  "subscription_expiry": "ISODate",
  "favorites": [
    {
      "favorite_id": "String (UUID)",
      "song_title": "String",
      "artist": "String",
      "youtube_video_id": "String (Nullable)",
      "added_at": "ISODate"
    }
  ]
}
```
*Because favorites are typically constrained to a few hundred per user, they are embedded directly into the User document for rapid retrieval operations.*

---

## 🔐 9. Authentication & Security

- **JWT (JSON Web Tokens):** Used for stateless authentication. Upon `/login`, the backend issues a signed JWT. The React frontend includes it as a `Bearer` token in the `Authorization` header for protected routes.
- **Bcrypt Hashing:** Passwords are never stored in plaintext. They are salted and cryptographically hashed upon registration using `bcrypt`, effectively neutralizing DB leak threats.
- **CORS Protection:** Configured in `app/__init__.py` to strictly allow cross-origin requests from explicitly defined frontend domains.
- **Route Protection (Backend):** The `@jwt_required()` decorator is heavily used to block unauthenticated access. 
- **Premium Gates:** Logic inside controllers checks `is_premium` status and subscription expiry before activating heavy machine-learning face detection APIs.

---

## 🎨 10. Frontend Architecture

The frontend follows a highly modular hierarchy using Vite and React.
- **Components Structure:**
  - `/auth`: Registration and Login pages.
  - `/music`: Contains `MusicPlayer`, `RecommendationSection`, `Favorites`.
  - `/layout`: App layout, `Navbar`, footers.
- **State Management:** Uses React Context (`AuthProvider`) to globally distribute user sessions preventing prop drilling. The `useTheme` context controls the Dark/Light application states.
- **API Integration:** All Axios calls are managed efficiently through a centralized `/api/client.js` file utilizing interceptors to attach the JWT seamlessly.

---

## 🚀 11. Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB running locally or MongoDB Atlas Cluster URL

### Backend Setup
```bash
cd backend
python -m venv .venv
# Activate the virtual environment:
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate

pip install -r requirements.txt

# Create environment configuration
cp .env.example .env
# Open .env and fill in MONGO_URI, SPOTIFY_CLIENT_ID, YOUTUBE_API_KEY, and a JWT_SECRET_KEY
```

### Frontend Setup
```bash
cd frontend
npm install
# Create environment configuration
echo "VITE_API_URL=http://localhost:5000" > .env
```

---

## ▶️ 12. How to Run the Project

Open 2 terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
# Make sure .venv is activated
python run.py
# Server starts on http://127.0.0.1:5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# Frontend starts on http://localhost:5173
```

Navigate to `http://localhost:5173` in your browser.

---

## 🌐 13. Deployment

This application is set to be deployed distinctly across platforms optimized for their environments:
- **Frontend (Vercel / Netlify):** The React Vite app will be built using `npm run build` and output static assets to `/dist`, automatically deployed via Vercel's caching edge network.
- **Backend (Render / Railway / Heroku):** The Flask application runs via `gunicorn` processing requests. Environment variables for production DB URIs, and production API integrations are securely managed in Render's dashboard. A `render.yaml` infrastructure-as-code file is included.

---

## 📸 14. Screenshots / Features
*(Feature capabilities demonstrated through UI screens)*
- **Dark Mode UI:** Glassmorphism and modern tailwind colors give a premium feel.
- **Smart Recommendations Screen:** Clean grid views showing Album artwork fetched live from Spotify with a Youtube play button overlay.
- **Premium Billing Flow:** Razorpay beautiful checkout modal natively embedded inside the application flow.

---

## 🧪 15. Future Improvements
- **Collaborative Filtering:** Introduce a second Matrix Factorization ML model incorporating likes and listen histories from multiple users, not just song tags.
- **Audio Feature Extraction:** Use `librosa` library to analyze user-uploaded MP3s instantly to determine BPM and recommend based directly on the waveform.
- **Redis Caching:** Introduce Redis memory caching on the `/recommend` endpoint to drastically reduce identical search load times.

---

## 💡 16. Interview Explanation Section

**The Short Pitch (Elevator format):**
> "I built an AI-powered Full-Stack Music Recommendation Platform using React, Flask, and MongoDB. It uses a custom TF-IDF content-based filtering algorithm to analyze hundreds of thousands of songs to provide instant, incredibly accurate music recommendations, while integrating external APIs like YouTube and Spotify for seamless playback. To stand out, I integrated DeepFace for computer vision to analyze a user's facial expression via webcam to algorithmically curate a playlist matching their actual recognized mood."

**Going Deep (Technical Follow-Up):**
- **Interviewer:** *"How did you handle the scale of your song dataset?"*
  **You:** "I had to handle large DataFrames efficiently. Upon Flask application boot, I initialize a Singleton `RecommendationService`. I pre-compute the vectorizing arrays so they sit warmly in memory RAM. This ensures that when a user requests a recommendation, there are zero DB reads or file I/O latency for math calculations; my server strictly performs rapid linear algebra using Cosine Similarity."
- **Interviewer:** *"Can you talk about application security?"*
  **You:** "Yes, I structured Auth completely statelessly using JSON Web Tokens. I configured a centralized Axios instance inside React to inject interceptors mapping the JWT standard Authorization headers. On the backend, passwords are cryptographically altered using `bcrypt`, completely decoupling sensitive logic from the front end, mitigating major OWASP severity risks."
