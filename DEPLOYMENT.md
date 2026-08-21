# 🚀 Quick Deployment Guide

Host your full-stack app for free:
- **Backend**: [Render.com](https://render.com)
- **Frontend**: [Vercel.com](https://vercel.com)

---

## 1️⃣ Deploy Backend on Render

1. Go to **[render.com](https://render.com)** → Click **New +** → **Web Service**.
2. Connect your repo: **`AmirCodes-786/suhel-ai-quiz`**.
3. Set the following:
   - **Language / Runtime**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. Add these **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your_mongodb_atlas_connection_string
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   JWT_SECRET=quizforge_ai_super_secret_jwt_key_2026_production
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLIENT_URL=http://localhost:5173
   ```

5. Click **Create Web Service**.
6. When deployment finishes, copy your live backend URL (e.g. `https://suhel-ai-quiz.onrender.com`).

---

## 2️⃣ Deploy Frontend on Vercel

1. Go to **[vercel.com](https://vercel.com)** → Click **Add New…** → **Project**.
2. Import **`AmirCodes-786/suhel-ai-quiz`**.
3. Set the following:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - *(Leave all other build command override toggles OFF)*

4. Add these **Environment Variables** *(replace with your actual Render URL & Clerk Key)*:
   ```env
   VITE_API_URL=https://your-render-app.onrender.com/api
   VITE_SOCKET_URL=https://your-render-app.onrender.com
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
   ```

5. Click **Deploy**.
6. Copy your live Vercel frontend URL (e.g. `https://suhel-ai-quiz.vercel.app`).

---

## 3️⃣ Link URLs & Clerk Allowed Origin

1. Go to your **Render Dashboard** → click your service → click **Environment**.
2. Update `CLIENT_URL` with your live Vercel URL:
   ```env
   CLIENT_URL=https://your-vercel-app.vercel.app
   ```
3. Click **Save Changes**.
4. Go to **[clerk.com](https://dashboard.clerk.com)** → **Configure** → **Paths / Domains** → Add your Vercel domain (`https://your-vercel-app.vercel.app`).

---

🎉 **Done!** Your app is live with full Clerk authentication, MongoDB Atlas, and Gemini/Groq AI!
