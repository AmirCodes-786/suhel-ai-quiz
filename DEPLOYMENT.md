# 🚀 Quick Deployment Guide

Host your full-stack app for free:
- **Backend**: [Render.com](https://render.com)
- **Frontend**: [Vercel.com](https://vercel.com)

---

## 1️⃣ Deploy Backend on Render

1. Go to **[render.com](https://render.com)** → Click **New +** → **Web Service**.
2. Connect your repo: **`AmirCodes-786/suhel-ai-quiz`**.
3. Set the following:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. Add these **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://sohelmessi786_db_user:md5JOvz8NbsjicoX@cluster0.ve3jypl.mongodb.net/quizforge_ai?retryWrites=true&w=majority&appName=Cluster0
   GEMINI_API_KEY=your_gemini_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   JWT_SECRET=quizforge_ai_production_secret_2026
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
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Add these **Environment Variables** *(replace with your actual Render URL)*:
   ```env
   VITE_API_URL=https://your-render-app.onrender.com/api
   VITE_SOCKET_URL=https://your-render-app.onrender.com
   ```

5. Click **Deploy**.
6. Copy your live Vercel frontend URL (e.g. `https://suhel-ai-quiz.vercel.app`).

---

## 3️⃣ Final Step: Link Vercel to Render

1. Go back to your **Render Dashboard** → click your service → click **Environment**.
2. Update `CLIENT_URL` with your live Vercel URL:
   ```env
   CLIENT_URL=https://your-vercel-app.vercel.app
   ```
3. Click **Save Changes**.

---

🎉 **Done!** Your app is live and fully connected.
