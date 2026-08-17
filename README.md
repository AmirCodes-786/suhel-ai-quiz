# QuizForge AI — SaaS Assessment & Active Recall Platform

QuizForge AI is a high-performance SaaS platform that converts learning material (text, PDFs, documents, YouTube lectures, web URLs) into verified, source-grounded quizzes, active recall flashcards, and real-time multiplayer battles.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide Icons
- **Backend**: Node.js, Express, Socket.io (Multiplayer Battle Arena), Mongoose
- **Database**: MongoDB Atlas
- **AI Engines**: Google Gemini (3.5/3.7/Flash), Groq (GPT-OSS 120B / Qwen 27B), A4F Gateway

---

## 🚀 Deployment Guide

### 1. Deploy Frontend on Vercel
1. Go to [Vercel](https://vercel.com) and import the repository (`suhel-ai-quiz`).
2. **Framework Preset**: Vite
3. **Root Directory**: `client` (or keep root with included `vercel.json`)
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Environment Variables**:
   - `VITE_API_URL`: `https://<your-render-backend-app>.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://<your-render-backend-app>.onrender.com`
   - `VITE_CLERK_PUBLISHABLE_KEY`: `pk_test_...`

---

### 2. Deploy Backend on Render
1. Go to [Render](https://render.com) and create a new **Web Service**.
2. Connect your GitHub repository.
3. **Root Directory**: `server`
4. **Environment**: `Node`
5. **Build Command**: `npm install`
6. **Start Command**: `npm start`
7. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `CLIENT_URL`: `https://<your-vercel-app>.vercel.app`
   - `MONGODB_URI`: `mongodb+srv://...`
   - `GEMINI_API_KEY`: `AIzaSy...`
   - `GROQ_API_KEY`: `gsk_...`
   - `JWT_SECRET`: `your-strong-production-jwt-secret`

---

## 🛠️ Local Development

### Server
```bash
cd server
npm install
npm run dev
```

### Client
```bash
cd client
npm install
npm run dev
```
