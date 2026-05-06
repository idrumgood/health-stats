# Health Stats Dashboard

A full-stack, local-only dashboard to aggregate and visualize your health and fitness data from Strava and Whoop, with AI-powered insights using Google's Gemini.

## Prerequisites

- Node.js (v24 or newer recommended)
- A Windows Subsystem for Linux (WSL) environment, or macOS/Linux.

## Getting Started

1. **Install Dependencies**
   Navigate to the root folder of the project and install all necessary dependencies for both the root, frontend, and backend.

   ```bash
npm install
```
   ```bash
cd frontend && npm install
```
   ```bash
cd ../backend && npm install
```
   ```bash
cd ..
```

2. **Configure Environment Variables**
   Copy the provided `env.example` file to create your own local `.env` file in the `backend/` directory.

   ```bash
cp env.example backend/.env
```

   Open `backend/.env` and fill in the required API credentials:

   - **Strava**: You will need to create an API Application on [Strava Developers](https://developers.strava.com/). Set the Authorization Callback Domain to `localhost`.
   - **Whoop**: You will need to create an app in the [Whoop Developer Dashboard](https://developer.whoop.com/). Ensure the Redirect URI is set to `http://localhost:3000/api/auth/whoop/callback`.
   - **Gemini**: You will need an API key from Google AI Studio.

3. **Run the Application**
   From the root directory, run the development script. This utilizes `concurrently` to start both the Express backend (on port 3000) and the Vite React frontend (on port 5173).

   ```bash
npm run dev
```

4. **Setup Integrations**
   Open your browser and navigate to the frontend URL (typically `http://localhost:5173`). Click on "Setup" in the navigation bar to connect your Strava and Whoop accounts.

5. **Sync Data**
   Once connected, click "Sync Now" on the Setup page to fetch your historical data into the local SQLite database.

6. **View Dashboard**
   Navigate to the Dashboard view to see your data visualized and read the AI-generated insights!
