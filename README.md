# 🌟 AI-Powered Mock Interview Platform

An advanced, production-grade SaaS-inspired platform designed to help candidates conquer their technical interviews. By reading uploaded resumes, parsing technology profiles, generating customized roles/difficulties, and utilizing Google Gemini for real-time grading, it delivers a feedback report and progress dashboard.

🔗 **Production Web App**: [ai-mock-interview-nu-eosin.vercel.app](https://ai-mock-interview-nu-eosin.vercel.app)  
🔗 **Production API Server**: [ai-mock-interview-do4p.onrender.com](https://ai-mock-interview-do4p.onrender.com)

---

## 🚀 Key Features

* **Resume Parser Engine**: Drag-and-drop PDF parsing that uses Gemini to extract technical skills, professional experience, contact details, and academic backgrounds.
* **Tailored Question Generator**: Dynamically compiles 5 tailored questions (Coding tasks, Scenario designs, and MCQs) based on the candidate's resume, target role, and career stage.
* **Interactive Terminal**: An immersive workspace featuring active progress timers, question navigation, and real-time response inputs.
* **Real-time AI Evaluator**: Comprehensively grades responses against ideal sample solutions, scoring answers, highlighting technical gaps, and listing core strengths/weaknesses.
* **Performance Analytics**: Visual tracking of performance trends with customized responsive SVG line charts, average response metrics, and skill proficiency breakdowns.
* **Session Recovery & History**: Complete mock history management. Easily search, filter, delete, or resume incomplete sessions.

---

## 🛠️ Technology Stack

* **Frontend**: React (Vite SPA) with Tailwind CSS for glassmorphic styling
* **Backend**: FastAPI (Python asynchronous framework) with SQLAlchemy ORM and Pydantic
* **Database**: PostgreSQL (relational ACID-compliant storage)
* **Proxy & Serving**: Nginx (used locally as a reverse proxy gateway)
* **AI Core**: Google Gemini 1.5 Flash / 2.5 Flash / 3.5 Flash APIs (with local heuristic fallbacks)
* **Deployment**: Docker & Docker Compose (Local), Render (Backend Web Service), Vercel (Frontend Static hosting)

---

## 📂 Project Structure

```text
AI-Mock-Interview/
├── docs/                      # Technical Documentation
│   ├── ARCHITECTURE.md        # Core design & system data flows
│   ├── API_DOCUMENTATION.md   # Complete REST API endpoint specs
│   ├── DATABASE_DOCUMENTATION.md # PostgreSQL Table schemas
│   └── PROJECT_DECISIONS.md   # Architectural & stack decisions
├── frontend/                  # React SPA (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/        # Resume Upload, Config, Active Terminal, History, Analytics
│   │   └── App.jsx            # Main app container & routing logic
│   └── vercel.json            # Vercel deployment & API rewrite config
├── backend/                   # FastAPI Server
│   ├── app/
│   │   ├── auth/              # JWT Registration & Authentication
│   │   ├── resume/            # PDF parsing & storage
│   │   ├── interview/         # Session config & state controllers
│   │   ├── analytics/         # SQL aggregates & performance data
│   │   ├── services/          # Gemini API integrations
│   │   └── main.py            # API gateway entry point
│   └── Dockerfile             # Production Python build instruction
├── database/                  # SQL DDL Schemas & initial seed datasets
├── docker/                    # Nginx reverse proxy configuration
└── docker-compose.yml         # Local container orchestration script
```

---

## ⚙️ Local Development (Running with Docker)

Running the entire system locally requires only **Docker** and a **Gemini API Key**.

### 1. Configure Environment
Clone the project, create a `.env` file in the root directory, and fill in the necessary keys:
```env
# Database Credentials
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_secure_pass
POSTGRES_DB=ai_mock_interview

# Database connection URL
DATABASE_URL=postgresql+asyncpg://postgres:postgres_secure_pass@db:5432/ai_mock_interview

# Gemini API Integration
GEMINI_API_KEY=your_gemini_api_key

# JWT Token Secret
JWT_SECRET_KEY=your_super_secure_jwt_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 2. Boot up the Containers
In the project root, launch the docker container stack:
```bash
docker-compose up --build
```

* **Frontend App**: Access [http://localhost](http://localhost) (routed via Nginx proxy).
* **API Documentation**: Open [http://localhost/api/docs](http://localhost/api/docs) or [http://localhost:8000/docs](http://localhost:8000/docs).
* **PostgreSQL Database**: Port `5432` internally.

---

## 🌐 Production Architecture & Deployment

The live system uses a split-tier architecture:

1. **Frontend Hosting (Vercel)**:
   * Serves static HTML/JS/CSS assets with maximum global delivery speed.
   * Leverages a rewrite rule inside `vercel.json` to proxy `/api/*` requests to Render, securing cookies/session states and avoiding cross-origin (CORS) header issues.
2. **Backend Web Service (Render)**:
   * Runs the containerized Python FastAPI backend using the project's `Dockerfile`.
   * Integrates with a managed database instance and communicates directly with the Google Gemini API.

---

## 👥 Authors & Contributors

Meet the developers behind the platform:

* **Parin Makwana**  
  🔗 [GitHub](https://github.com/parinbajayebin) | 🔗 [LinkedIn](https://www.linkedin.com/in/parin-makwana-b614a6333?utm_source=share_via&utm_content=profile&utm_medium=member_android)
* **Mayank Jayswal**  
  🔗 [GitHub](https://github.com/jayswal-mayank) | 🔗 [LinkedIn](https://www.linkedin.com/in/mayank-jayswal/)
