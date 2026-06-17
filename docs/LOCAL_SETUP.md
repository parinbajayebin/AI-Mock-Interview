# Local Setup Guide for AI Mock Interview Platform

This guide will walk you through setting up and running both the backend and frontend of the AI Mock Interview Platform on a new PC.

## Prerequisites
- **Git** installed
- **Node.js** (v18+) installed
- **Python** (v3.10+) installed
- Your `.env` credentials (ask your partner for the full `.env` file since it is not pushed to GitHub).

---

## 1. Clone the Repository

Open your terminal or command prompt and run:
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd AI-Mock-Interview
```

---

## 2. Backend Setup (FastAPI)

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Create a Virtual Environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate the Virtual Environment**:
   * **Windows**:
     ```bash
     venv\Scripts\activate
     ```
   * **Mac/Linux**:
     ```bash
     source venv/bin/activate
     ```

4. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the Backend Server**:
   Make sure your `.env` file is placed in the root `AI-Mock-Interview/` directory.
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The backend will now be running at `http://localhost:8000`*

---

## 3. Frontend Setup (React/Vite)

Open a **new terminal window** (keep the backend running in the first one).

1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install Node Modules**:
   ```bash
   npm install
   ```

3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   *The frontend will now be running at `http://localhost:5173`*

---

## Troubleshooting

- **Google OAuth Login Error (`invalid_client` or `no registered origin`)**: Ensure that `http://localhost:5173` is added as an Authorized JavaScript Origin in the Google Cloud Console for the OAuth Client ID.
- **SMTP Emails Not Sending**: Ensure the `SMTP_PASSWORD` is an App Password if using Gmail, and restart the backend server if you recently modified the `.env` file.
