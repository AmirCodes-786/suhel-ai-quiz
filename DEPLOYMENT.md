# 🚀 Step-by-Step Beginner Deployment Guide: QuizForge AI

Welcome! This guide will walk you through hosting **QuizForge AI** online for free:
- **Backend (Server & WebSockets)** → Hosted on **Render**
- **Frontend (React UI)** → Hosted on **Vercel**
- **Database** → **MongoDB Atlas**
- **AI Models** → **Google Gemini & Groq**

---

## 📋 Overview of What We Are Doing
```
┌─────────────────────────┐          ┌──────────────────────────┐
│   Vercel (Frontend)     │ ──API──> │     Render (Backend)     │
│ https://yourapp.vercel.app│ <─WS─> │ https://yourapp.onrender │
└─────────────────────────┘          └─────────────┬────────────┘
                                                   │
                                     ┌─────────────┴────────────┐
                                     │  MongoDB Atlas Database  │
                                     │  & Gemini / Groq AI APIs │
                                     └──────────────────────────┘
```

> [!TIP]
> **Recommended Order**: Deploy the **Backend on Render first**, so you get your live backend URL, which you will then paste into Vercel as an environment variable!

---

## 🛠️ Step 1: Deploy Backend on Render

### 1. Create a Free Render Account
1. Go to [https://render.com](https://render.com).
2. Sign up or log in (you can use your GitHub account).

### 2. Create a New Web Service
1. On your Render dashboard, click the blue **New +** button in the top right.
2. Select **Web Service**.
3. Choose **Build and deploy from a Git repository** and click **Next**.
4. Search for your repository: **`suhel-ai-quiz`** (or paste `https://github.com/AmirCodes-786/suhel-ai-quiz`) and click **Connect**.

### 3. Configure the Web Service Settings
Fill in the fields exactly as shown below:

| Setting Field | What to Enter / Select |
| :--- | :--- |
| **Name** | `quizforge-ai-server` *(or any name you like)* |
| **Region** | Choose the one closest to you (e.g. `Singapore`, `Frankfurt`, `Oregon`) |
| **Branch** | `main` |
| **Root Directory** | `server` *(⚠️ Very Important: write `server` in lowercase)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` ($0/month) |

---

### 4. Add Environment Variables on Render
Scroll down to the **Environment Variables** section and click **Add Environment Variable** for each key:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Sets Node to production mode |
| `PORT` | `5000` | Port for the Express server |
| `MONGODB_URI` | `mongodb+srv://sohelmessi786_db_user:md5JOvz8NbsjicoX@cluster0.ve3jypl.mongodb.net/quizforge_ai?retryWrites=true&w=majority&appName=Cluster0` | Your MongoDB connection string |
| `GEMINI_API_KEY` | *(Your Gemini API Key starting with `AIzaSy...`)* | From [Google AI Studio](https://aistudio.google.com) |
| `GROQ_API_KEY` | *(Your Groq API Key starting with `gsk_...`)* | From [Groq Console](https://console.groq.com) |
| `JWT_SECRET` | `quizforge_ai_super_secret_jwt_key_2026_production` | Used to secure user sessions |
| `CLIENT_URL` | `http://localhost:5173` *(We will update this with your Vercel URL later)* | Allowed CORS origin |

---

### 5. Click Deploy & Copy Your URL
1. Click **Create Web Service** at the bottom.
2. Render will build and deploy your backend (it takes 1–2 minutes).
3. Once you see **`Live`** in green at the top left, copy your live Render URL:
   > 📌 Example: `https://quizforge-ai-server.onrender.com`
4. Test it in your browser: open `https://your-server-name.onrender.com/api/health`
   You should see:
   ```json
   { "status": "online", "platform": "QuizForge AI Engine" }
   ```

---

## ⚡ Step 2: Deploy Frontend on Vercel

### 1. Create a Free Vercel Account
1. Go to [https://vercel.com](https://vercel.com).
2. Sign in with your GitHub account.

### 2. Import Your Project
1. On your Vercel Dashboard, click **Add New…** → **Project**.
2. Find `suhel-ai-quiz` in your GitHub repository list and click **Import**.

### 3. Configure the Project Settings
1. **Framework Preset**: `Vite` *(Vercel usually detects this automatically)*.
2. **Root Directory**: Click **Edit** and select the **`client`** folder.
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

---

### 4. Add Environment Variables on Vercel
Expand the **Environment Variables** section and add the following 3 variables:

| Key | Value (Use your Render Backend URL!) | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://<YOUR-RENDER-BACKEND-URL>/api` | `https://quizforge-ai-server.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://<YOUR-RENDER-BACKEND-URL>` | `https://quizforge-ai-server.onrender.com` |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` *(Your Clerk key, if using Clerk)* | Optional / from Clerk Dashboard |

> [!IMPORTANT]
> - Note that `VITE_API_URL` ends with **`/api`**.
> - `VITE_SOCKET_URL` does **NOT** have `/api` at the end.
> - Do not put a trailing slash `/` at the very end.

---

### 5. Deploy!
1. Click the blue **Deploy** button.
2. Vercel will build your React application in ~30 seconds.
3. You will see a confetti screen saying **"Congratulations!"** with your live domain:
   > 🌐 Example: `https://suhel-ai-quiz.vercel.app`

---

## 🔗 Step 3: Link Vercel URL back to Render (CORS)

Now that you have your live Vercel URL (e.g. `https://suhel-ai-quiz.vercel.app`):
1. Go back to your [Render Dashboard](https://dashboard.render.com).
2. Click on your `quizforge-ai-server` service.
3. Click on **Environment** in the left menu.
4. Find the `CLIENT_URL` variable, edit it, and change its value to your Vercel URL:
   ```
   CLIENT_URL=https://suhel-ai-quiz.vercel.app
   ```
5. Click **Save Changes** (Render will automatically redeploy with the updated setting).

---

## ✅ How to Verify Everything is Working

1. Open your live Vercel website in your browser.
2. Click **AI Quiz Studio** in the sidebar.
3. Paste any study notes (or use sample notes) and select **5 Questions**.
4. Click **Generate 5 Questions**.
5. The loading tracker will show step-by-step progress and automatically open the **Quiz Player**.
6. Answer the quiz, click **Submit Quiz**, and verify your score, topic breakdown, and AI explanations!

---

## ❓ Frequently Asked Questions & Troubleshooting

### 1. Why does Render take 30–50 seconds on the first request after being idle?
* Render's Free tier spins down web services after 15 minutes of inactivity to save energy. When a user visits, it wakes up automatically in ~30 seconds.

### 2. What if I see a CORS error in the browser console?
* Check that your `CLIENT_URL` on Render matches your exact Vercel URL (including `https://` without a trailing slash).

### 3. How do I update my deployed site when I write new code?
* Just run:
  ```bash
  git add .
  git commit -m "update message"
  git push origin main
  ```
* Both **Vercel** and **Render** will automatically detect the new commit on GitHub and redeploy your live site automatically!
