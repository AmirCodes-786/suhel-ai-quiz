# ⚡ QuizForge AI — Next-Gen AI Assessment & Active Recall Platform

<div align="center">

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Groq](https://img.shields.io/badge/Groq_LPU-F55036?style=for-the-badge&logo=fastapi&logoColor=white)](https://groq.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br/>

**Transform raw study notes, PDFs, YouTube video lectures, and web articles into grounded quizzes, interactive flashcards, live multiplayer battles, and verifiable mastery certificates — powered by multi-model AI.**

[Explore Live Demo](https://quizforge-ai.vercel.app) • [Report Bug](https://github.com/AmirCodes-786/suhel-ai-quiz/issues) • [Request Feature](https://github.com/AmirCodes-786/suhel-ai-quiz/issues)

</div>

---

## 📖 Table of Contents

- [✨ Key Highlights](#-key-highlights)
- [🎯 Core Features](#-core-features)
  - [1. 🔮 Multi-Source AI Quiz Generator Studio](#1--multi-source-ai-quiz-generator-studio)
  - [2. ⚔️ Real-Time Multiplayer Battle Arena](#2-️-real-time-multiplayer-battle-arena)
  - [3. 🧠 Active Recall & 3D Flashcard Studio](#3--active-recall--3d-flashcard-studio)
  - [4. 📊 Performance & Mastery Analytics](#4--performance--mastery-analytics)
  - [5. 📜 Verifiable Certificates of Mastery](#5--verifiable-certificates-of-mastery)
  - [6. 🗺️ AI Personalized Study Planner](#6-️-ai-personalized-study-planner)
- [🏗️ System Architecture & Data Flow](#-system-architecture--data-flow)
- [💻 Tech Stack Breakdown](#-tech-stack-breakdown)
- [🚀 Quick Start & Local Setup](#-quick-start--local-setup)
- [🔐 Environment Variables Configuration](#-environment-variables-configuration)
- [🌐 REST API & WebSocket Specifications](#-rest-api--websocket-specifications)
- [🚢 Deployment Guide](#-deployment-guide)
- [🤝 Contributing](#-contributing)
- [📄 License & Credits](#-license--credits)

---

## ✨ Key Highlights

- ⚡ **Multi-Modal AI Ingestion**: Ingest raw notes, PDFs, `.docx` files, YouTube URLs, or live websites into clean, high-yield learning content.
- 🎯 **Bloom’s Taxonomy Alignment**: Calibrate questions from basic recall (*Remember/Understand*) to advanced application (*Analyze/Evaluate/Synthesize*).
- 🎮 **Live Socket.io Battle Arena**: Create custom room codes, invite peers, and compete in real-time with synchronized question timers and live leaderboards.
- 🎴 **3D Interactive Flashcards**: Active recall study studio with customizable depth profiles (Mechanisms, Edge Cases, Formulas).
- 🏆 **Tamper-Proof Verification**: Earn unique cryptographic certification credentials with instant public URL verification.
- 📈 **Granular Skill Telemetry**: Radar charts, accuracy heatmaps, XP progression, and weakness diagnostics via Recharts.
- 🛡️ **Fault-Tolerant AI Engine**: Multi-tiered fallback architecture spanning Google Gemini 2.0 / Flash and Groq LPU (Llama 3 / Mixtral).

---

## 🎯 Core Features

### 1. 🔮 Multi-Source AI Quiz Generator Studio
Transform any learning asset into a structured, pedagogical assessment with custom difficulty and question count:
- **Raw Text & Markdown**: Paste lecture notes, textbook excerpts, or code documentation.
- **PDF & Document Parsing**: Upload multi-page PDFs or Word documents with intelligent section chunking.
- **YouTube Video Ingestion**: Paste any educational YouTube URL to automatically extract transcripts and generate relevant questions.
- **Web & Wikipedia Scraping**: Supply any article or Wikipedia link to strip noise and synthesize key concepts.
- **Cognitive Depth Configuration**: Toggle Bloom's Taxonomy tiers, customize question types (Multiple Choice, True/False, Fill in the Blanks, Code Snippets), and specify target difficulty levels.

```
┌─────────────────┐     ┌───────────────────────┐     ┌──────────────────────┐
│  Raw Content    │ ──> │ Chunking & Extraction │ ──> │ AI Prompt Engine     │
│ (PDF/YT/Web/Txt)│     │ Engine                │     │ (Gemini/Groq LPUs)   │
└─────────────────┘     └───────────────────────┘     └──────────────────────┘
                                                                 │
                                                                 ▼
                                                      ┌──────────────────────┐
                                                      │ Validated Quiz JSON  │
                                                      │ + Citations & Hints  │
                                                      └──────────────────────┘
```

---

### 2. ⚔️ Real-Time Multiplayer Battle Arena
Turn study sessions into high-octane competitive quizzes:
- **Private Room Codes**: Generate 6-character room codes for quick peer invites.
- **Host Controls**: Host selects topic, difficulty, and question count.
- **Synchronized Gameplay**: Real-time Socket.io countdown timers, live response locks, and anti-cheat mechanism.
- **Dynamic Leaderboards**: Instant score recalculation based on accuracy and answer speed.
- **Podium & Trophy Ceremony**: Crown winners with celebratory sound FX and XP rewards.

---

### 3. 🧠 Active Recall & 3D Flashcard Studio
Supercharge long-term memory retention with active recall mechanics:
- **3D Card Flip Motion**: Seamless flip physics powered by Framer Motion.
- **Depth Presets**:
  - 🔍 *Comprehensive*: Balanced conceptual coverage.
  - ⚙️ *Mechanisms & Algorithms*: Deep-dive logic pipelines.
  - 🧪 *Scenarios & Edge Cases*: Real-world debugging trade-offs.
  - ⚡ *High-Yield Definitions*: High-velocity exam prep.
- **Confidence Tagging**: Mark cards as *Mastered*, *Reviewing*, or *Needs Work* to customize repeat intervals.

---

### 4. 📊 Performance & Mastery Analytics
Turn test attempts into actionable learning insights:
- **Accuracy Tracking**: Global and per-category accuracy percentages.
- **Bloom's Cognitive Distribution**: Visual analysis of performance across conceptual vs. analytical problem tiers.
- **XP & Streak System**: Daily streak calendar and level progression.
- **Weakness Diagnosis**: Auto-generates targeted review recommendations based on missed concepts.

---

### 5. 📜 Verifiable Certificates of Mastery
Celebrate achievement with auditable digital credentials:
- **Mastery Threshold**: Unlocks automatically upon scoring 80%+ on any qualifying assessment.
- **Unique Verification Code**: Alphanumeric verification code embedded with candidate, date, topic, and score data.
- **Public Verification Portal**: Accessible via `/verify/:code` for recruiters, instructors, and peers.
- **Vector PDF Export**: One-click high-resolution PDF download with custom watermarks and seals.

---

### 6. 🗺️ AI Personalized Study Planner
- Generate multi-week learning roadmaps tailored to your goal timeline, target exam, and daily available study hours.
- Daily module checklists with integrated quiz checkpoints.

---

## 🏗️ System Architecture & Data Flow

```mermaid
graph TD
    subgraph Client ["Client Layer (React 19 + Vite)"]
        UI[Tailwind & Framer Motion UI]
        Router[React Router DOM]
        AuthCtx[Clerk Auth Context]
        SoundCtx[Sound FX & Toast System]
        SocketClient[Socket.io Client]
    end

    subgraph Server ["Server Layer (Node.js & Express)"]
        API[Express REST API Gateway]
        BattleSocket[Socket.io Battle Engine]
        Middlewares[Helmet, CORS, Rate Limiters, JWT Auth]
    end

    subgraph AI_Engine ["AI Orchestration Tier"]
        Gemini[Google Gemini 2.0 / Flash]
        Groq[Groq LPU (Llama 3 / Mixtral)]
        Parser[PDF/Docx/YouTube/Web Extractors]
    end

    subgraph Data ["Data Persistence (MongoDB Atlas)"]
        Users[(Users & Streaks)]
        Quizzes[(Quizzes & Questions)]
        Attempts[(Attempts & Analytics)]
        Battles[(Battle Rooms & History)]
        Certificates[(Certificates & Verification)]
    end

    UI --> Router
    Router --> AuthCtx
    AuthCtx --> API
    SocketClient <--> BattleSocket
    API --> Middlewares
    Middlewares --> AI_Engine
    AI_Engine --> Parser
    AI_Engine --> Gemini
    AI_Engine --> Groq
    API --> Data
    BattleSocket --> Data
```

---

## 💻 Tech Stack Breakdown

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite, React Router 6 |
| **Styling & Motion** | Tailwind CSS, Framer Motion, Lucide Icons, Canvas Confetti |
| **Data Visualization** | Recharts (Radar, Bar, Line & Area charts) |
| **Backend Runtime** | Node.js, Express.js |
| **Real-Time Engine** | Socket.io (Rooms, Namespaces, Sync Timers) |
| **Database & ODM** | MongoDB Atlas, Mongoose ODM |
| **AI Providers** | Google Gemini API (gemini-1.5-flash / gemini-2.0), Groq Cloud API |
| **Authentication** | Clerk Authentication & Custom JWT Bearer Tokens |
| **Document Processing**| `pdf-parse`, `mammoth`, `youtube-transcript`, `cheerio` |
| **PDF Generation** | `html2canvas`, `jspdf` |
| **Security & Quality** | Helmet, Express Rate Limit, CORS Whitelisting |

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn** / **pnpm**
- **MongoDB Atlas** database connection string
- **Google Gemini API Key** and/or **Groq API Key**
- **Clerk Publishable & Secret Keys** (optional for auth)

---

### Step 1: Clone Repository
```bash
git clone https://github.com/AmirCodes-786/suhel-ai-quiz.git
cd suhel-ai-quiz
```

---

### Step 2: Configure Server
```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/quizforge?retryWrites=true&w=majority

# AI Credentials
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Security
JWT_SECRET=your_super_secret_jwt_key_here

# Clerk Auth (Optional/Production)
CLERK_SECRET_KEY=your_clerk_secret_key
```

Start the backend server:
```bash
npm run dev
```
*(Server will start on `http://localhost:5000`)*

---

### Step 3: Configure Client
Open a new terminal window:
```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
```

Start the Vite development client:
```bash
npm run dev
```
*(Client will run on `http://localhost:5173`)*

---

## 🔐 Environment Variables Configuration

### Server Environment (`server/.env`)
| Variable | Required | Description |
| :--- | :--- | :--- |
| `PORT` | No | Port number for Express server (Default: `5000`) |
| `NODE_ENV` | Yes | Application environment (`development` \| `production`) |
| `CLIENT_URL` | Yes | Allowed frontend origin for CORS & WebSockets |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Yes | API key from Google AI Studio |
| `GROQ_API_KEY` | Optional | Groq API Key for high-speed inference fallback |
| `JWT_SECRET` | Yes | Secret salt used for signing access tokens |
| `CLERK_SECRET_KEY` | Optional | Clerk authentication backend verification key |

### Client Environment (`client/.env`)
| Variable | Required | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | Yes | Full URL pointing to backend `/api` endpoint |
| `VITE_SOCKET_URL` | Yes | Base URL for Socket.io WebSocket connection |
| `VITE_CLERK_PUBLISHABLE_KEY` | Optional | Clerk frontend publishable key |

---

## 🌐 REST API & WebSocket Specifications

### REST Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/generate` | Generate AI quiz from text, file, YouTube or URL | Yes |
| `GET` | `/api/generate/status` | Fetch user daily generation quota status | Yes |
| `GET` | `/api/quizzes` | Fetch user's generated quizzes | Yes |
| `GET` | `/api/quizzes/:id` | Get specific quiz details & question payload | Yes |
| `POST` | `/api/attempts` | Record quiz attempt, answers, time spent & score | Yes |
| `POST` | `/api/flashcards/generate` | Generate custom active-recall flashcard set | Yes |
| `GET` | `/api/flashcards` | Retrieve all user flashcard decks | Yes |
| `GET` | `/api/analytics` | Fetch holistic performance, Bloom stats & XP | Yes |
| `POST` | `/api/certificates/generate` | Claim certificate for quiz passed with 80%+ | Yes |
| `GET` | `/api/certificates/verify/:code` | Public validation of certificate code | No |
| `POST` | `/api/studyplan/generate` | Generate milestone-based AI learning plan | Yes |

### WebSocket Events (Battle Arena)

| Event | Direction | Payload / Purpose |
| :--- | :--- | :--- |
| `create_room` | Client ➔ Server | Host creates battle lobby with topic, count, difficulty |
| `join_room` | Client ➔ Server | Player joins lobby via 6-digit room code |
| `room_created` | Server ➔ Client | Returns room code, player list, and settings |
| `player_joined` | Server ➔ Client | Broadcasts updated participant list to all in lobby |
| `start_battle` | Client ➔ Server | Host triggers synchronized start countdown |
| `question_start` | Server ➔ Client | Broadcasts synchronized question & timer to all clients |
| `submit_answer` | Client ➔ Server | Player sends selected option & response latency |
| `leaderboard_update` | Server ➔ Client | Live rank updates broadcasted at end of each question |
| `battle_finished` | Server ➔ Client | Final podium standings, XP awarded & winner coronation |

---

## 🚢 Deployment Guide

### Deploy Backend on [Render](https://render.com)
1. Create a new **Web Service** and link your GitHub repository.
2. Set **Root Directory** to `server`.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `npm start`.
5. Under **Environment Variables**, add all keys from `server/.env` (ensuring `CLIENT_URL` matches your deployed Vercel domain).

### Deploy Frontend on [Vercel](https://vercel.com)
1. Import the repository in Vercel.
2. Set **Root Directory** to `client` (or use the root `vercel.json` configuration).
3. Set **Framework Preset** to **Vite**.
4. Set **Build Command** to `npm run build` and **Output Directory** to `dist`.
5. Under **Environment Variables**, configure:
   - `VITE_API_URL` = `https://your-render-backend.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://your-render-backend.onrender.com`
   - `VITE_CLERK_PUBLISHABLE_KEY` = `pk_live_...`

---

## 🤝 Contributing

Contributions, feature suggestions, and pull requests are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License & Credits

Distributed under the **MIT License**. See `LICENSE` for more information.

Built with ❤️ by **[Amir Sohel](https://github.com/AmirCodes-786)** and the Open Source Community.
