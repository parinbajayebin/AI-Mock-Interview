# System Architecture - AI-Powered Mock Interview Platform

This document describes the high-level system components, application layer separation, deployment setup, directory tree layout, and key system data flows for our production-ready free-tier cloud deployment.

---

## 1. System Components Overview

The production architecture distributes components across free-tier hosting networks to minimize operation cost:

```mermaid
graph TD
    User([User's Browser])
    
    subgraph Vercel Hosting
        VercelCDN[Vercel Global CDN]
        ReactApp[React SPA Frontend]
    end
    
    subgraph Render Hosting
        FastAPIApp[FastAPI Application Backend]
    end
    
    subgraph Supabase Cloud
        PostgreSQL[(PostgreSQL Database)]
        S3Bucket[(Supabase Storage Bucket: resumes)]
    end
    
    GeminiAPI[Google AI Studio: Gemini 1.5 Flash]
    
    User <-->|HTTPS| VercelCDN
    VercelCDN <-->|Serves static files| ReactApp
    User <-->|REST HTTP Requests| FastAPIApp
    FastAPIApp <-->|SQLAlchemy ORM asyncpg| PostgreSQL
    FastAPIApp <-->|Supabase API Client| S3Bucket
    FastAPIApp <-->|HTTPS SDK Calls| GeminiAPI
```

1. **Presentation Layer (Vercel CDN / React SPA)**: Serves static CSS, HTML, and compiled JS files. Handles authentication tokens and dashboard navigation.
2. **Application Layer (Render Web Service)**: Runs the FastAPI web application. Exposes endpoint routers for auth, resumes, interviews, evaluations, and history.
3. **Data & Storage Layer (Supabase)**:
   - **PostgreSQL Database**: Relational storage for user tables, interview templates, responses, and scores.
   - **Supabase Storage Bucket**: Secure object bucket to store and retrieve candidate resume PDFs.
4. **Cognitive Layer (Google AI Studio)**: Free-tier Gemini 1.5 Flash endpoint used for fast text extraction, question generation, and answers grading.

---

## 2. Directory and Folder Structure

The repository structure remains clean and modular:

```text
AI-Mock-Interview/
├── docs/                      # Technical Documentation
│   ├── PROJECT_STATUS.md      # Live progress and task list
│   ├── PROJECT_DECISIONS.md   # Architectural & stack rationale
│   ├── API_DOCUMENTATION.md   # Endpoint specs
│   ├── DATABASE_DOCUMENTATION.md # Table schema details
│   └── ARCHITECTURE.md        # This file
├── frontend/                  # React SPA (Vite + Tailwind)
│   ├── src/
│   │   ├── components/        # Reusable UI elements (Buttons, Inputs, Cards)
│   │   ├── context/           # Auth Context, Interview Context
│   │   ├── pages/             # Login, Dashboard, ActiveSession, FeedbackReport
│   │   ├── services/          # API Client calls
│   │   ├── styles/            # Tailwind imports and theme
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── tailwind.config.js
├── backend/                   # FastAPI Backend
│   ├── app/
│   │   ├── auth/              # Registration, Login, JWT tokens
│   │   ├── resume/            # Resume file upload and analysis endpoints
│   │   ├── interview/         # Question generation & session state endpoints
│   │   ├── evaluation/        # Grading & feedback endpoints
│   │   ├── analytics/         # Aggregate dashboard stats
│   │   ├── models/            # SQLAlchemy Database Models
│   │   ├── schemas/           # Pydantic validation schemas
│   │   ├── services/          # Business logic & Gemini API integration
│   │   ├── repositories/      # Database CRUD layer
│   │   ├── core/              # Config, DB Setup, Security (Hashing, JWT)
│   │   └── main.py            # FastAPI entry point
│   ├── tests/                 # pytest backend test suite
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env
├── database/                  # SQL Schema scripts
│   ├── schema.sql             # SQL DDL Script
│   └── seed.sql               # Initial test data
├── docker/                    # Custom configuration files
│   └── nginx.conf             # Nginx reverse proxy configuration (for local Docker)
├── docker-compose.yml         # Container orchestrator (for local offline dev)
├── .env.example               # Template for environment settings
└── README.md                  # Quickstart manual
```

---

## 3. Core Data Flows

### A. Google OAuth 2.0 Login Flow
How candidates can authenticate with their Google accounts:

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant FE as Frontend React
    participant BE as Backend FastAPI
    participant GO as Google API Server
    participant DB as PostgreSQL

    User->>FE: Click "Login with Google"
    FE->>BE: GET /api/auth/google/login
    BE-->>FE: Return Google OAuth Consent URL
    FE->>User: Redirect browser to Google Authorization Screen
    User->>GO: Approve access consent
    GO-->>FE: Redirect back to Frontend Callback with auth 'code'
    FE->>BE: POST /api/auth/google/callback { code }
    BE->>GO: Exchange 'code' for Google Profile ID & Email
    GO-->>BE: Return profile payload (id, email, name)
    BE->>DB: Check if user exists. If not, insert user (auth_provider='google', provider_id=id)
    DB-->>BE: Return user record
    BE->>BE: Sign secure system JWT access token
    BE-->>FE: Return JWT token and user info
    FE->>User: Redirect to dashboard
```

### B. Forgot Password Recovery Flow (SMTP)
How users can reset forgotten passwords using email verification:

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant FE as Frontend React
    participant BE as Backend FastAPI
    participant DB as PostgreSQL
    participant SM as SMTP Server (Gmail)

    User->>FE: Click "Forgot Password" & input email
    FE->>BE: POST /api/auth/forgot-password { email }
    BE->>DB: Check if email exists
    alt Email exists
        BE->>BE: Generate random UUID reset_token & expiry (15 mins)
        BE->>DB: Save reset_token and expiry to user record
        BE->>SM: Send reset link with token using SMTP TLS
        SM-->>User: Delivers password reset link in email
    end
    BE-->>FE: Return 200 OK (Generic success message)
    User->>FE: Click link in email, enter new password
    FE->>BE: POST /api/auth/reset-password { token, new_password }
    BE->>DB: Query user by reset_token & verify expiry
    alt Token valid and not expired
        BE->>BE: Hash new password using bcrypt
        BE->>DB: Update hashed_password, nullify reset_token & expiry
        BE-->>FE: Return success
        FE->>User: Display "Password reset successful. Please login."
    else Token invalid or expired
        BE-->>FE: Return 400 Bad Request error
        FE->>User: Display "Link invalid or expired."
    end
```

### C. Resume Upload & Analysis Flow
How resumes are stored in Supabase Storage and parsed by Gemini:

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant FE as Frontend React
    participant BE as Backend FastAPI
    participant SB as Supabase Storage
    participant DB as PostgreSQL
    participant AI as Gemini API

    User->>FE: Select and Upload PDF Resume
    FE->>BE: POST /api/resumes/upload (Multipart File)
    Note over BE: Validate file size & PDF header
    BE->>SB: Upload PDF to 'resumes' Bucket
    SB-->>BE: Return file reference path
    BE->>BE: Extract raw text from PDF bytes
    BE->>AI: Send prompt + Raw Text (Request Structured JSON)
    AI-->>BE: Return parsed JSON (skills, experience, metadata)
    BE->>DB: Insert into resumes (file_path, skills, raw_text, parsed_metadata)
    DB-->>BE: Return Resume ID
    BE-->>FE: HTTP 201 Created (Resume analysis results)
    FE->>User: Display skills summary & experience info
```

### B. Interview Flow (Generation -> Answers -> Evaluation)
How interview questions are served and evaluated:

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant FE as Frontend React
    participant BE as Backend FastAPI
    participant DB as PostgreSQL
    participant AI as Gemini API

    User->>FE: Select Role & Difficulty, Click "Start"
    FE->>BE: POST /api/interviews/ (role, difficulty, resume_id)
    BE->>DB: Retrieve Resume text & skills
    BE->>AI: Generate questions matching Resume, Role, & Difficulty (Structured JSON)
    AI-->>BE: Return 5 questions with expected skills and ideal answers
    BE->>DB: Save interview & save questions in questions table
    BE-->>FE: Return Interview ID & question details
    FE->>User: Display Question 1, start timer
    User->>FE: Type and Submit Answer
    FE->>BE: POST /api/interviews/{id}/responses (question_id, user_answer, duration)
    BE->>DB: Save user answer in responses table
    BE-->>FE: Return success, load next question
    Note over User, FE: Repeat for all 5 questions...
    FE->>BE: POST /api/interviews/{id}/evaluate
    BE->>DB: Retrieve all questions, user_answers, ideal_answers for interview
    BE->>AI: Grade answers, summarize strengths, weaknesses, overall score (Structured JSON)
    AI-->>BE: Return evaluations JSON
    BE->>DB: Insert overall stats into evaluations table
    BE->>DB: Update responses table with question-level scores/feedback
    BE->>DB: Set interview status = 'Completed'
    BE-->>FE: Return evaluation results
    FE->>User: Render Dashboard Feedback Report
```

---

## 4. Deployment Architecture

### Production Deployment
* **Frontend**: React client statically generated and hosted on **Vercel**.
* **Backend**: FastAPI running inside a Python container on **Render** (free tier).
* **Database**: PostgreSQL hosted on **Supabase**.
* **Object Storage**: S3-compatible cloud buckets hosted on **Supabase Storage**.

### Local Development Option
For local offline testing, the systems can be run using the provided [docker-compose.yml](file:///E:/AI-Mock-Interview/docker-compose.yml):
* **`db` (PostgreSQL container)**: Matches production database schema.
* **`backend` (FastAPI container)**: Connected to the database.
* **`frontend` (React web container)**: Exposes port `80` with Nginx reverse proxying.
