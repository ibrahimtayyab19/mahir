# Mahir AI Marketplace

## 📱 Download the App
[**Download the Android APK here!**](https://expo.dev/artifacts/eas/3w5m6GAYkfR2C3NXXnU9e2.apk)

## 💻 Running Locally (For Judges)
If you want to run the application on your own machine instead of using the APK, follow these steps to start both the backend server and the Expo frontend.

### 1. Start the Backend API
You will need the project `.env` file provided in our hackathon submission (which contains the MongoDB URI and AI API keys).
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create a .env file and paste the credentials provided in our submission

# Start the development server
npm run dev
```
*The backend will start running on `http://localhost:3000`.*

### 2. Start the Frontend App
Open a **new terminal window** to start the frontend.
```bash
# Navigate to the frontend directory
cd mahir

# Install dependencies
npm install

# Create a .env file to point to your local backend
echo "EXPO_PUBLIC_API_URL=http://localhost:3000" > .env
echo "EXPO_PUBLIC_SOCKET_URL=http://localhost:3000" >> .env

# Start the Expo server
npx expo start
```
*You can now press `w` to open the app in your web browser, or use the Expo Go app on your phone to scan the QR code.*

## 🔑 Demo Accounts

The database has been seeded with over 200 service providers and 200 job requests to simulate a fully active marketplace for the hackathon demonstration.

You can log into the app using any of the following accounts:

**Password for all accounts:** `123456`

### 🧑‍💼 Client Accounts (Use these to test the AI Request Chat)
- `admin@example.com`
- `client@mahir.demo`

### 🛠️ Provider Accounts (Use these to test the Jobs Board & Match Suggestions)
- `ali@example.com` (AC Technician)
- `usman@example.com` (AC Technician)
- `hassan@example.com` (Electrician)
- `tariq@example.com` (Plumber)
- `bilal@example.com` (Cleaner)
