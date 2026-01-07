# MacroMini 🥗

![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20DB-orange?style=for-the-badge&logo=firebase)
![Gemini AI](https://img.shields.io/badge/AI-Gemini%20Flash-8E75B2?style=for-the-badge&logo=googlebard)

**MacroMini** is a modern, AI-powered nutrition assistant and macro tracker. It goes beyond simple calorie counting by utilizing **Generative AI (Google Gemini)** to create personalized recipes based on your specific macro targets (Protein, Carbs, Fats) and dietary preferences.

Built with performance and UX in mind, it features a responsive **React 19** frontend, **Firebase** for real-time data sync, and a containerized backend.

## ✨ Key Features

*   **👨‍🍳 ChefMini (AI Assistant)**:
    *   Generates custom recipes that *exactly* fit your remaining daily macros.
    *   Adjusts portion sizes dynamically.
    *   Creates instant shopping lists from generated recipes.
*   **📊 Smart Tracking**:
    *   Visual progress bars for Calories, Protein, Carbs, Fats, and Sugar.
    *   Support for multiple Diet Profiles (Cut, Bulk, Maintenance).
*   **🛍️ Integrated Workflow**:
    *   Seamless transition from **Recipe Generation** -> **Logging** -> **Shopping List**.
    *   Optimistic UI updates for a snappy feel.
*   **🌍 Localization**: Full support for multiple languages and themes (Dark/Light mode).

## 🏗️ Architecture

The application follows a **Serverless/Microservices** hybrid approach:

*   **Frontend**: React (Vite) + TypeScript. Uses **optimistic state management** for immediate user feedback.
*   **Backend**: Node.js/Express (served via Firebase Functions) handling specific business logic and AI orchestration.
*   **AI Layer**: Direct integration with Google's Gemini Flash model for low-latency recipe generation.
*   **Rate Limiting**: Custom Firestore-based rate limiting implementation to manage API costs.

## 🚀 Getting Started

### Prerequisites

*   Node.js 20+
*   Firebase CLI

### Installation

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    Create `.env.local` and add your Firebase and Gemini credentials:
    ```env
    VITE_FIREBASE_API_KEY=...
    VITE_GEMINI_API_KEY=...
    ```

3.  **Run Locally**:
    ```bash
    npm run dev
    ```

4.  **Docker Build** (Optional):
    ```bash
    docker build -t macromini .
    ```

## 🛠️ Tech Stack

*   **Frontend**: React 19, TailwindCSS, Lucide Icons, Recharts
*   **State**: React Hooks + Context API
*   **Backend Service**: Firebase (Auth, Firestore, Hosting), Google Gemini API
*   **Build Tool**: Vite