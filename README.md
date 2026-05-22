# Mahir AI Marketplace

Mahir is a next-generation service marketplace powered by an advanced Agentic AI orchestration pipeline. It bridges the gap between clients and blue-collar service providers (plumbers, electricians, cleaners, etc.) by replacing manual forms and endless scrolling with a seamless, conversational, and deeply intelligent AI interface.

## 📱 Live Demo Links

- **Android App (APK):** [Download the App Here](https://expo.dev/artifacts/eas/dQRFF3kiujADvAS8w44T4T.apk)
- **Live Backend API (Render):** `https://mahir-backend.onrender.com`

---

## 🧠 The AI Agent Pipeline

At the core of Mahir is the **Agentic Orchestrator** pattern (`MahirOrchestrator`). Instead of a single massive prompt, Mahir routes client requests through a sequence of specialized LLM-powered agents to parse, match, and fulfill service requests seamlessly.

### 1. Parser Agent (Intent Extraction & Translation)
Acts as the "receptionist" of the marketplace. It takes messy, unstructured, and multilingual client input (e.g., voice notes or text in Urdu, Roman Urdu, or English) and structures it into a machine-readable format.
*   **Multilingual Support:** Translates input and automatically generates job post descriptions in English, Urdu script, and Roman Urdu.
*   **Context Extraction:** Accurately maps intent (e.g., "pani ka pipe masla") to strict service categories (e.g., "Plumber").
*   **Emotional Analysis:** Identifies the client's `urgency` level and `budgetSensitivity` based on the tone of the message.
*   **Clarification Gate:** If the intent confidence is below 70%, the agent will pause the pipeline and generate a native-language clarification question to ask the client.

### 2. Matchmaker Agent (Scoring & Ranking)
Responsible for finding the absolute best service providers for a specific job post. It receives the structured intent from the Parser and a list of nearby providers from a MongoDB `$geoNear` aggregation, then ranks them using an AI-driven suitability score.
*   **Multi-Factor Scoring:** Calculates a composite 0-100 score using a strict mathematical formula: Distance (25%), Rating (20%), On-Time Score (20%), Specialization (15%), Cancellation Rate (10%), and Review Sentiment (10%).
*   **Quality Control:** Automatically filters out unreliable providers (e.g., those with a cancellation rate > 40%).
*   **Explainable AI:** Provides human-readable reasoning for why specific providers were matched.

### 3. Quoter Agent (Pricing & Dispatch Management)
Handles the financial and scheduling logistics once a client selects a provider. It ensures fair pricing and clear communication for both parties.
*   **Dynamic Pricing:** Calculates a transparent price estimate (PKR) by analyzing base fees, distance charges, urgency surges, and peak-hour pricing algorithms.
*   **Smart Scheduling:** Determines the best booking slot based on the job's urgency (e.g., suggesting a slot within 2 hours for high-urgency jobs).
*   **Bilingual Notifications:** Generates confirmation messages (simulated SMS) tailored separately for the client and the provider.

### Automated Lifecycle Management
Mahir implements an automated lifecycle for Job Posts to keep the marketplace efficient. Unanswered job posts are automatically pruned from the database after 24 hours using a **MongoDB TTL (Time-To-Live) index**, ensuring the provider job feed is never cluttered with stale requests. Additionally, full agent traces are saved to an `AgentLog` collection for hackathon auditing and pipeline debugging.

---

## 🛠️ Tech Stack

- **Frontend:** React Native (Expo Router)
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB Atlas (Mongoose + GeoJSON/TTL Indexes)
- **Real-Time:** Socket.io (Bi-directional provider location and job tracking)
- **AI Models:** Llama-3 (Groq API) & Google Gemini (OpenRouter)

---

## 💻 Running Locally (For Judges)

If you want to run the application on your own machine instead of using the APK, follow these steps to start both the backend server and the Expo frontend.

### 1. Start the Backend API
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Start the development server
npm run dev
```
*(Note: The required `.env` file containing the MongoDB URI and API keys is already included in the repository for your convenience. **Disclaimer:** We are fully aware that committing `.env` files and API keys to source control is against security best practices, but we have included them here intentionally to make the local demo testing process as seamless as possible for the judges!)*

### 2. Start the Frontend App
Open a **new terminal window** to start the frontend.
```bash
# Navigate to the frontend directory
cd mahir

# Install dependencies
npm install

# The .env file is already configured to point to the live Render backend!
# Just start the Expo server:
npx expo start
```
*You can now press `w` to open the app in your web browser, or use the Expo Go app on your phone to scan the QR code.*

---

## 🔑 Demo Accounts

The database has been seeded with over 200 service providers and 200 job requests to simulate a fully active marketplace for the hackathon demonstration.

You can log into the app using any of the following accounts:

**Password for all accounts:** `123456`

### 🧑‍💼 Client Accounts (Use these to test the AI Chat Flow)
- `admin@example.com`
- `client@mahir.demo`

### 🛠️ Provider Accounts (Use these to test the Provider AI Assistant)
- `ali@example.com` (AC Technician)
- `usman@example.com` (AC Technician)
- `hassan@example.com` (Electrician)
- `tariq@example.com` (Plumber)
- `bilal@example.com` (Cleaner)
