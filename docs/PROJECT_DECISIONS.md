# Project Decisions - AI-Powered Mock Interview Platform

This document outlines the architectural and technology decisions made for the AI-Powered Mock Interview Platform, detailing how we satisfy the zero-cost deployment requirements while maintaining high performance and clean code.

---

## 1. Free-Tier Cloud Stack Selection

### Frontend Hosting: Vercel (Free Tier)
* **Why**:
  * Seamless integration with Vite + React.
  * Free globally distributed CDN, yielding fast loading times.
  * Automated deployments on every Git push.
* **Alternates Considered**: Netlify, GitHub Pages. Vercel is chosen for its superior developer tools and faster preview builds.

### Backend Hosting: Render (Free Web Service Tier)
* **Why**:
  * Native Python support and easy setup for Uvicorn/FastAPI.
  * Free tier allows running public web service applications.
  * Direct integration with GitHub for continuous deployment.
* **Limitations & Mitigation**: Free tier web services spin down after 15 minutes of inactivity. When a new request arrives, it takes about 50 seconds to spin back up. We will handle this on the frontend by showing a friendly "Waking up server..." loading spinner during cold starts.

### Database & File Storage: Supabase (Free Tier)
* **Why**:
  * **Unified Console**: Combines a managed PostgreSQL database, user management capabilities, and S3-compatible Object Storage in a single dashboard.
  * **PostgreSQL DB**: Provides a free Postgres DB (500MB storage capacity), which is ideal for our relational data.
  * **Supabase Storage**: Provides 1GB of free object storage. This is perfect for storing candidate PDF resumes securely without setting up a separate cloud bucket service like AWS S3.
* **Alternates Considered**:
  * *Neon Serverless*: Offers free Postgres DB, but lacks file storage, meaning we would need a separate account for file uploads.
  * *Local Container Storage*: Ephemeral on Render's free tier (files vanish when container restarts). Supabase Storage provides persistent cloud storage.

### AI Engine: Gemini 1.5 Flash (via Google AI Studio Free Tier)
* **Why**:
  * **Free Tier availability**: 15 requests per minute (RPM) and 1,500 requests per day (RPD) for free.
  * **Performance**: Extremely fast response times (much faster than Gemini 1.5 Pro) and highly accurate structured JSON schema output, making it perfect for real-time chat and question generation.
  * **Large Context Window**: Handles large resume PDFs with ease.

---

## 2. Authentication Strategy

### FastAPI Self-Hosted JWT & OAuth2
* **Why**:
  * Completely open-source, free, and self-contained.
  * Does not rely on third-party commercial auth engines (like Auth0 or Clerk) which might force pricing transitions as users grow.
  * Highly customizable; security configuration is fully defined in backend repository code.
* **Google OAuth 2.0 Support**:
  * Integrates Google Client SDK on the frontend and OAuth2 token verification on the backend.
  * Allows one-click signup/login for recruiters and candidates, reducing barriers to entry.
  * Securely maps Google users to local profiles (marked with `auth_provider: 'google'`).
* **Forgot Password Recovery (SMTP)**:
  * Uses python's built-in `smtplib` to send HTML password reset links securely.
  * Links contain standard high-entropy UUID reset tokens with short expiration windows (e.g. 15 minutes) to ensure security.
  * Requires setting up free SMTP email and app passwords (e.g. via Gmail) in the `.env` configuration.
* **Workflow**:
  1. Frontend submits user credentials to `/api/auth/token` (local credentials) or requests Google OAuth redirection.
  2. Backend validates credentials/tokens, hashes passwords using `bcrypt`, and returns a JWT signed with `HS256`.
  3. Frontend stores token in memory/cookies and attaches it to `Authorization: Bearer <token>` header for secure endpoints.

---

## 3. Storage Architecture

We will configure the backend to use the **Supabase Python SDK** or **S3-compatible API client** (like `boto3`) to upload and retrieve PDFs.
* Uploads are sent to a private Supabase bucket called `resumes`.
* Backend retrieves PDFs securely using authenticated signed URLs, keeping candidate resumes private and secure.
