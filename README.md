# AI-Powered Mock Interview Platform

An advanced, production-inspired AI Mock Interview system designed for recruiters and candidates. The platform reads user resumes, parses key skills, asks highly customized questions matching specific career roles and difficulties using the Gemini API, evaluates responses in real-time, and generates progress dashboards.

---

## 🚀 Key Features
* **Resume Parse Engine**: Instantly extracts technology keywords and experiences from uploaded PDF resumes.
* **Intelligent Question Generator**: Synthesizes 5 tailored questions using the Google Gemini API based on resume profile, target role, and difficulty.
* **Interactive Interview Terminal**: Displays questions sequentially with active timer tracking.
* **Detailed AI Evaluation**: Provides overall scoring, technical breakdown by category, detailed feedback per response, and identifying strengths and weaknesses.
* **Analytics Dashboard**: Tracks historic performance, trends, and focus areas using data visualizations.
* **Containerized Deployment**: Managed via Docker Compose and Nginx.

---

## 🛠️ Tech Stack
* **Frontend**: React (Single Page Application via Vite), Tailwind CSS
* **Backend**: FastAPI (Python asynchronous framework), SQLAlchemy ORM, Pydantic
* **Database**: PostgreSQL (ACID-compliant relational storage)
* **AI Core**: Google Gemini Pro & Flash API
* **Gateway & Web server**: Nginx (reverse proxy and static files router)
* **DevOps**: Docker, Docker Compose

---

## 📂 Repository Structure

The code is organized according to clean, layered, and domain-driven architectural patterns:

```text
AI-Mock-Interview/
├── docs/                      # Technical Documentation
│   ├── PROJECT_DECISIONS.md   # Architectural & stack rationale
│   ├── API_DOCUMENTATION.md   # Endpoint specs
│   ├── DATABASE_DOCUMENTATION.md # Table schema details
│   └── ARCHITECTURE.md        # Core design and system data flows
├── frontend/                  # React SPA (Vite + Tailwind)
├── backend/                   # FastAPI Backend
│   └── app/
│       ├── auth/              # Registration & Login endpoints
│       ├── resume/            # PDF file upload & storage
│       ├── interview/         # Question generation & session state
│       ├── evaluation/        # AI Grading & feedback
│       ├── analytics/         # Aggregated performance stats
│       ├── models/            # SQLAlchemy Database Models
│       ├── schemas/           # Pydantic validation schemas
│       ├── services/          # Gemini API integrations & business logic
│       ├── repositories/      # Database CRUD layer
│       ├── core/              # Config, DB connection, Security helper
│       └── main.py            # FastAPI entry point
├── database/                  # SQL Schema scripts
│   ├── schema.sql             # SQL DDL script
│   └── seed.sql               # Initial test data
├── docker/                    # Web server configs
│   └── nginx.conf             # Nginx reverse proxy configuration
├── docker-compose.yml         # Container orchestrator config
├── .env.example               # Template for environment settings
└── README.md                  # This file
```

---

## 🗺️ Development Roadmap

### Phase 0: Design & Specifications (Current)
* Design Database DDL and Entity Relationships.
* Outline REST API endpoint specifications.
* Establish folder organization guidelines.
* Create technical project documentation.

### Phase 1: Authentication & User Accounts
* Setup FastAPI backend skeleton.
* Configure PostgreSQL ORM connections.
* Implement user signup, hashing (bcrypt), and token (JWT) endpoints.
* Create React sign-in and registration pages.

### Phase 2: Resume PDF Upload
* Enable PDF multipart file uploads.
* Configure local file volumes for file persistence.
* Build frontend drag-and-drop file upload UI.

### Phase 3: Resume Analysis
* Integrate Gemini API to extract skills and experience.
* Store resume profiles in database.
* Render resume parsing dashboard for candidates.

### Phase 4: Interview Question Generator
* Create prompt templates for target roles and difficulties.
* Enforce structured JSON responses from Gemini containing technical questions.
* Setup database tables for interview sessions and questions.

### Phase 5: Interview Session Terminal
* Create question navigation, typing terminal, and timing trackers.
* Record answers and durations sequentially.

### Phase 6: AI-Based Evaluation
* Grade responses against expected ideal answers using Gemini.
* Extract overall score, strengths, weaknesses, and key metrics.
* Display evaluation dashboard reports.

### Phase 7: Analytics & Progress Dashboard
* Write SQL aggregations to calculate historical performance.
* Visualize metrics on frontend with interactive charts.

### Phase 8: Mock Interview History
* Build history lists with filter, search, and pagination capabilities.

### Phase 9: DevOps, Proxying & Productionizing
* Compose Dockerfiles and Nginx routing configs.
* Deploy entire stack via `docker-compose up`.

---

## 💻 Setup & Installation (Local Development)

### Prerequisites
* Docker and Docker Compose installed.
* A Google Gemini API Key.

### Initial Configuration
1. Clone the repository and navigate to the project directory:
   ```bash
   cd AI-Mock-Interview
   ```
2. Create your `.env` file by copying the template:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in your details:
   * Generate a secure string for `JWT_SECRET_KEY`
   * Paste your `GEMINI_API_KEY`

### Running the System
We run the entire system inside Docker containers:
```bash
docker-compose up --build
```
* **Frontend Dashboard**: Open `http://localhost`
* **API Documentation**: Open `http://localhost/api/docs` or `http://localhost:8000/docs`
* **PostgreSQL Database**: Accessible internally via port `5432`.
