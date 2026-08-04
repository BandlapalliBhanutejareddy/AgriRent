# 🚀 AgroRent AI Launcher Guide

This guide details the single-command and single-click launch files built to run the entire AgroRent AI ecosystem effortlessly.

---

## 🛠️ The Core Services

The platform consists of three core backend/frontend services and one mobile ecosystem:
1. **AI Service** (Python FastAPI) — Port `8000`
2. **Backend API** (Node.js/Prisma/Supabase) — Port `4000`
3. **Web Dashboard** (Next.js/React) — Port `3000` (or `3001` if 3000 is busy)
4. **Mobile App** (React Native/Expo) — Expo Metro Bundler

---

## 🚦 Option A: Run Everything Automatically (Recommended)

We have created a master batch script **`run-all.bat`** in the root directory. This script spins up all three core services simultaneously in separate, color-coded, labeled terminal windows.

### How to use it:
- **Via File Explorer**: Just double-click the **`run-all.bat`** file in `D:\AgriRent_AI`.
- **Via Terminal**: Run this single command:
  ```powershell
  .\run-all.bat
  ```

### Labeled Terminal Windows:
When launched, three independent console windows will appear:
- **`AI Service`** (Teal console): Runs the FastAPI server on `http://localhost:8000`.
- **`Backend API`** (Red console): Runs the Express/Prisma API server on `http://localhost:4000`.
- **`Web Dashboard`** (Yellow console): Runs the Next.js Dev Server on `http://localhost:3000` (or `3001`).

---

## 📱 Option B: Run the Mobile Application

We have created a dedicated batch script **`run-mobile.bat`** in the root directory to launch the mobile application.

### How to use it:
- **Via File Explorer**: Double-click the **`run-mobile.bat`** file in `D:\AgriRent_AI`.
- **Via Terminal**: Run:
  ```powershell
  .\run-mobile.bat
  ```
This starts the Expo Metro Bundler. You can scan the displayed QR code with your phone (using the **Expo Go** app on Android or the Camera app on iOS) to immediately launch the app on your mobile device.

---

## 🌐 Verification Status (Currently Running)

We have successfully launched and verified the servers for you. They are currently online and fully responsive:

*   **AI Service**: 🟢 Up at [http://localhost:8000](http://localhost:8000)
*   **Backend API**: 🟢 Up at [http://localhost:4000/api/health](http://localhost:4000/api/health)
*   **Web Dashboard**: 🟢 Up at [http://localhost:3001](http://localhost:3001) (Port 3000 was occupied, so Next.js automatically fell back to 3001)

---

*Enjoy developing with AgroRent AI! 🌾🚀*
