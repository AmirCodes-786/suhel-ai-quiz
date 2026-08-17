# QuizForge AI — Client

QuizForge AI is a high-performance, minimalist AI-powered assessment & study platform built with React, Vite, Tailwind CSS, Framer Motion, and Clerk Authentication.

---

## 🔐 Clerk Authentication Configuration

QuizForge AI uses Clerk for authentication, user management, and session control.

### Required Environment Variables

Create a `.env` file in the `client/` directory (see `.env.example`):

```env
# Clerk Publishable Key (From https://dashboard.clerk.com)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Backend API Endpoint
VITE_API_URL=http://localhost:5000/api
```

> **Security Note**: Never expose your secret Clerk API keys in frontend client code. Only use the public publishable key prefixed with `VITE_CLERK_PUBLISHABLE_KEY`.

---

## 🧭 Authentication & Route Architecture

| Route | Access | Description |
|---|---|---|
| `/` | Public | Minimalist SaaS landing page |
| `/sign-in/*` | Public / Clerk | Clerk sign-in experience with auto-redirect to `/dashboard` |
| `/sign-up/*` | Public / Clerk | Clerk sign-up experience |
| `/dashboard` | Protected | Student learning metrics and recent quizzes |
| `/ai-studio` | Protected | Multi-modal AI quiz generator |
| `/library` | Protected | Saved quizzes with clone, search, and delete |
| `/quiz/:id` | Protected | Interactive quiz player with timer & immediate review |
| `/flashcards` | Protected | Active recall 3D flashcards studio |
| `/battles` | Protected | Real-time synchronized multiplayer challenges |
| `/analytics` | Protected | Cognitive dimension performance metrics |
| `/settings` | Protected | Clerk profile management & subscription tier |

---

## 🎨 Motion & UX System

* **Page Transitions**: Reusable `PageTransition` component (180ms easeOut fade & slight vertical slide) with automatic `prefers-reduced-motion` compliance.
* **Loading Experience**: Minimalist `AuthLoadingScreen` and component `SkeletonLoader` instances preventing auth flicker and giant spinners.
* **Feedback**: Lightweight, non-intrusive `ToastProvider` for instant action feedback.
* **Destructive Actions**: Accessible `ConfirmDialog` for reversible confirmations.
