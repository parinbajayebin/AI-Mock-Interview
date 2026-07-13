# 🌟 AI-Powered Mock Interview & Job Targeting Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-0.109-emerald?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-blue?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-cyan?style=for-the-badge&logo=tailwind-css" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Docker-Enabled-blue?style=for-the-badge&logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/Premium-Razorpay-orange?style=for-the-badge&logo=razorpay" alt="Razorpay" />
</p>

An advanced, production-grade SaaS-inspired platform designed to help candidates prepare for technical interviews. The platform parses uploaded resumes, scrapes active job posting URLs, runs complete ATS gap analyses, and generates company-themed mock interviews utilizing Google Gemini for real-time grading, presenting a detailed evaluation report and interactive progress dashboard.

🔗 **Live Web Application**: [ai-mock-interview-nu-eosin.vercel.app](https://ai-mock-interview-nu-eosin.vercel.app)  
🔗 **API Server Gateway**: [ai-mock-interview-do4p.onrender.com](https://ai-mock-interview-do4p.onrender.com)

---

## ✨ Key Feature Deployments

### 🔑 1. Bring Your Own Key (BYOK) Engine
* **Token Independence**: Toggle dynamically between Google Gemini, OpenAI, or Groq models.
* **Privacy Focused**: Custom API keys are stored securely on the client-side (`localStorage`) with zero host database tracking.
* **Resource Limiting**: Users without custom keys receive a set of free mock interviews, after which they are seamlessly prompted to insert their own key or upgrade to Premium.

### 🎯 2. ATS & Job Targeting Analyzer (Premium)
* **Smart URL Scraper**: Fetches active job postings from Lever, Greenhouse, Workday, LinkedIn, or direct company career pages and extracts clean job description details.
* **ATS Scorecard**: Calculates a match score (%) indicating how well the candidate's resume aligns with the target job posting.
* **Keyword Gaps & Rewrite Tips**: Identifies missing technical/soft keywords and provides context-rich bullet point edits to upgrade the resume.

### 🎭 3. Premium Mock Practice Sessions
* **Company-Theme Generator**: Generates customized technical, behavioral, and system-design questions based on the candidate's chosen resume and the target company's specific job description.
* **Frosted-Glass Panel UI**: Features a beautiful, responsive iPhone-inspired layout with search filtering to quickly look up saved targets by company name or role.

### 📊 4. Visual Performance Analytics
* **Progress Tracking**: Responsive SVG charts tracking cumulative match scores, average grades, and interview performance over time.
* **Gaps Matrix**: Highlights recurring technical deficiency areas to suggest key focus topics.

### 💳 5. Razorpay Subscription Gateway
* **Premium Billing**: Integrates Razorpay checkout overlay offering instant upgrades to the Premium Tier (pricing: `₹199/month`).
* **Secure Webhooks**: Verifies order credentials and transaction signatures using robust SHA-256 HMAC verification.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons | Responsive SPA featuring premium glassmorphic UI |
| **Backend** | FastAPI, Python 3.11, Pydantic v2 | High-performance asynchronous REST API server |
| **Database** | PostgreSQL | Relation database managed via SQLAlchemy (asyncpg) |
| **Scraping** | HTTPX, BeautifulSoup4 | Asynchronous network scrapers targeting popular ATS layouts |
| **AI Integration** | Google Gemini (1.5 Flash / 2.5 Pro) | Prompts optimized for structured JSON generation |
| **Payments** | Razorpay SDK | Payment orders and backend signature verification webhooks |
| **Hosting** | Vercel (Frontend), Render (Backend), Docker | Multi-stage Dockerized container setups |

---

## 📂 Directory Layout

```text
AI-Mock-Interview/
├── docs/                      # Tech Specs & Architectural Docs
│   ├── ARCHITECTURE.md        # Core design & system data flows
│   ├── API_DOCUMENTATION.md   # Complete REST API endpoint specs
│   └── DATABASE_DOCUMENTATION.md # PostgreSQL Table schemas
├── frontend/                  # React SPA (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/        # ActiveTerminal, PerformanceAnalytics, PremiumMockInterviewTab
│   │   ├── context/           # AuthContext & Session management
│   │   └── App.jsx            # Routing, lock screens, and main layouts
│   └── vercel.json            # Deployment routing rules
├── backend/                   # FastAPI Server
│   ├── app/
│   │   ├── auth/              # JWT Registration & Authentication
│   │   ├── ats/               # Scraper controls & ATS analysis endpoints
│   │   ├── interview/         # Sessions, active prompts & AI grading
│   │   ├── payments/          # Razorpay order checkout integrations
│   │   ├── models/            # SQLAlchemy schemas (User, Resume, ATSHistory, Interview)
│   │   └── main.py            # FastAPI main gateway config
│   └── Dockerfile             # Multi-stage Python build recipe
└── docker-compose.yml         # Local container orchestration script
```

---

## ⚙️ Local Setup Instructions

### Option A: Running with Docker (Recommended)

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/parinbajayebin/AI-Mock-Interview.git
   cd AI-Mock-Interview
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   # Database Credentials
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres_secure_pass
   POSTGRES_DB=ai_mock_interview
   DATABASE_URL=postgresql+asyncpg://postgres:postgres_secure_pass@db:5432/ai_mock_interview

   # LLM Integration
   GEMINI_API_KEY=your_gemini_api_key

   # Authentication
   JWT_SECRET_KEY=your_super_secure_jwt_secret
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=60
   ```

3. **Boot Up the Stack**:
   ```bash
   docker-compose up --build
   ```

4. **Access Applications**:
   * **Frontend Dashboard**: [http://localhost](http://localhost) (routed via Nginx proxy).
   * **API Docs**: [http://localhost/api/docs](http://localhost/api/docs).

---

### Option B: Local Manual Setup

#### 1. Backend Server Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Development Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 👥 Product Authors & Contributors

* **Parin Makwana**  
  🔗 [GitHub](https://github.com/parinbajayebin) | 🔗 [LinkedIn](https://www.linkedin.com/in/parin-makwana-b614a6333)

* **Mayank Jayswal**  
  🔗 [GitHub](https://github.com/mayank-jayswal) | 🔗 [LinkedIn](https://in.linkedin.com/in/mayank-jayswal-3a7272378)
