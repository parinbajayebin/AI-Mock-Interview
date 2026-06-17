# API Documentation - AI-Powered Mock Interview Platform

This document describes all API endpoints exposed by the FastAPI backend, including request validation parameters and JSON response structures.

---

## Base URL
Local Development: `http://localhost/api` (via Nginx proxy) or `http://localhost:8000/api` (direct to FastAPI backend).

All endpoints consume and return `application/json` unless specified otherwise. Secured endpoints require a Bearer token in the HTTP Authorization header: `Authorization: Bearer <jwt_token>`.

---

## 1. Authentication Module

### POST `/auth/register`
Creates a new user account.
* **Authentication**: None
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123",
    "full_name": "Jane Doe"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": "a85c7f8a-92a4-4a42-8980-0a27a8bc611c",
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "created_at": "2026-06-17T18:24:46Z"
  }
  ```
* **Error Response (400 Bad Request)**: Email already registered or password weak.

### POST `/auth/token`
Generates a JWT token for authentication (OAuth2 standard).
* **Authentication**: None
* **Request Body (form-data)**:
  * `username`: `user@example.com`
  * `password`: `SecurePassword123`
* **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer"
  }
  ```
* **Error Response (401 Unauthorized)**: Invalid credentials.

### GET `/auth/google/login`
Redirects the user's browser to the Google OAuth Consent screen.
* **Authentication**: None
* **Parameters**:
  * `redirect_uri` (Optional): Custom URI to redirect the user after auth callback completes.
* **Response (307 Temporary Redirect)**: Redirects browser to Google accounts page.

### POST `/auth/google/callback`
Processes the Google authorization code, fetches the Google profile, links/creates the user in the database, and issues a standard platform JWT access token.
* **Authentication**: None
* **Request Body**:
  ```json
  {
    "code": "4/0AdQt8qi...",
    "redirect_uri": "http://localhost/login/callback"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "user": {
      "id": "a85c7f8a-92a4-4a42-8980-0a27a8bc611c",
      "email": "user@gmail.com",
      "full_name": "Google User"
    }
  }
  ```

### POST `/auth/forgot-password`
Initiates a password reset request. Generates a reset token and sends an email via SMTP.
* **Authentication**: None
* **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "message": "If the email is registered, a password reset link has been sent."
  }
  ```

### POST `/auth/reset-password`
Verifies the password reset token and updates the user's password.
* **Authentication**: None
* **Request Body**:
  ```json
  {
    "token": "d22e0f8c-22b4-4e92-bc10-efba70a5996b",
    "new_password": "NewSecurePassword123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "message": "Password updated successfully."
  }
  ```
* **Error Response (400 Bad Request)**: Invalid or expired password reset token.

### GET `/auth/me`
Retrieves currently logged-in user profile.
* **Authentication**: Required
* **Response (200 OK)**:
  ```json
  {
    "id": "a85c7f8a-92a4-4a42-8980-0a27a8bc611c",
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "created_at": "2026-06-17T18:24:46Z"
  }
  ```

---

## 2. Resume Module

### POST `/resumes/upload`
Uploads a PDF resume and triggers Gemini skill and details extraction.
* **Authentication**: Required
* **Request Body (Multipart Form-Data)**:
  * `file`: (Binary PDF file)
* **Response (201 Created)**:
  ```json
  {
    "id": "c76d9e8b-82a1-432d-9051-fb189b88cf41",
    "file_name": "jane_doe_resume.pdf",
    "uploaded_at": "2026-06-17T18:28:10Z",
    "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Git", "React"],
    "experience_summary": "Software Developer with 2 years of experience building backend systems in Python.",
    "parsed_metadata": {
      "education": [{"degree": "B.S. Computer Science", "school": "State University", "year": "2024"}],
      "projects": [{"name": "Mock Interview WebApp", "technologies": ["React", "FastAPI"]}]
    }
  }
  ```
* **Error Response (400 Bad Request)**: File type not PDF, or Gemini extraction failed.

### GET `/resumes`
Lists all resumes uploaded by the current user.
* **Authentication**: Required
* **Response (200 OK)**:
  ```json
  [
    {
      "id": "c76d9e8b-82a1-432d-9051-fb189b88cf41",
      "file_name": "jane_doe_resume.pdf",
      "uploaded_at": "2026-06-17T18:28:10Z",
      "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Git", "React"]
    }
  ]
  ```

---

## 3. Interview Session Module

### POST `/interviews`
Initializes a mock interview session. Triggers Gemini to generate 5 tailored technical questions based on the candidate's resume, targeted role, and difficulty.
* **Authentication**: Required
* **Request Body**:
  ```json
  {
    "resume_id": "c76d9e8b-82a1-432d-9051-fb189b88cf41",
    "role": "Backend Developer",
    "difficulty": "Mid-Level"
  }
  ```
* **Response (201 Created)**:
  ```json
  {
    "id": "d22e0f8c-22b4-4e92-bc10-efba70a5996b",
    "role": "Backend Developer",
    "difficulty": "Mid-Level",
    "status": "Created",
    "created_at": "2026-06-17T18:30:15Z",
    "questions": [
      {
        "id": "111a222b-333c-444d-555e-666666666661",
        "question_text": "Explain how you would optimize a slow database query in PostgreSQL using indexes and explain plans.",
        "order_index": 1,
        "expected_skills": ["PostgreSQL", "Query Optimization"]
      },
      {
        "id": "111a222b-333c-444d-555e-666666666662",
        "question_text": "How does FastAPI handle asynchronous requests under the hood, and when should you use 'async def'?",
        "order_index": 2,
        "expected_skills": ["FastAPI", "Concurrency"]
      }
    ]
  }
  ```

### POST `/interviews/{id}/responses`
Submits the user's answer to a specific interview question.
* **Authentication**: Required
* **Request Body**:
  ```json
  {
    "question_id": "111a222b-333c-444d-555e-666666666661",
    "user_answer": "I would run EXPLAIN ANALYZE on the query to find bottlenecks. Then I'd create indexes on columns used in WHERE clauses or JOIN keys. I'd also check if vacuuming is needed.",
    "duration_seconds": 95
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "id": "999a888b-777c-666d-555e-444444444441",
    "question_id": "111a222b-333c-444d-555e-666666666661",
    "user_answer": "...",
    "duration_seconds": 95,
    "submitted_at": "2026-06-17T18:32:00Z"
  }
  ```

---

## 4. Evaluation & Analytics Module

### POST `/interviews/{id}/evaluate`
Completes the interview and triggers the Gemini AI evaluation system. Validates all responses and provides detailed feedback and scores.
* **Authentication**: Required
* **Response (200 OK)**:
  ```json
  {
    "interview_id": "d22e0f8c-22b4-4e92-bc10-efba70a5996b",
    "overall_score": 82.50,
    "feedback_summary": "The candidate demonstrates solid knowledge of database optimization and FastAPI concepts. However, answers to system design questions lacked detail regarding load balancing.",
    "strengths": [
      "Excellent understanding of PostgreSQL indexing and query profiling.",
      "Clear explanation of async event loops in FastAPI."
    ],
    "weaknesses": [
      "Lacks depth in discussing horizontal scalability.",
      "Struggled to explain thread pools for blocking CPU operations."
    ],
    "topic_scores": {
      "Database": 95.0,
      "Asynchronous Python": 90.0,
      "System Design": 62.5
    },
    "question_evaluations": [
      {
        "question_id": "111a222b-333c-444d-555e-666666666661",
        "score": 95.00,
        "feedback": "Perfect response. You correctly identified EXPLAIN ANALYZE and targeting WHERE/JOIN clauses."
      },
      {
        "question_id": "111a222b-333c-444d-555e-666666666662",
        "score": 90.00,
        "feedback": "Great description of Starlette/Uvicorn runtime and use of async def."
      }
    ]
  }
  ```

### GET `/interviews/{id}/report`
Fetches the report for a previously evaluated interview.
* **Authentication**: Required
* **Response (200 OK)**: Same JSON structure as `POST /interviews/{id}/evaluate` response.
* **Error Response (404 Not Found)**: Interview not evaluated or doesn't exist.

### GET `/analytics/summary`
Retrieves aggregated statistics for the user's dashboard.
* **Authentication**: Required
* **Response (200 OK)**:
  ```json
  {
    "total_interviews": 12,
    "average_score": 78.4,
    "interviews_by_role": {
      "Backend Developer": 8,
      "Frontend Developer": 4
    },
    "category_scores": {
      "PostgreSQL": 88,
      "React": 72,
      "FastAPI": 84,
      "CSS": 68
    },
    "performance_trends": [
      {"date": "2026-06-01", "score": 70.5},
      {"date": "2026-06-05", "score": 75.0},
      {"date": "2026-06-17", "score": 82.5}
    ]
  }
  ```

---

## 5. History Module

### GET `/interviews`
List past interviews with search and filter functionality.
* **Authentication**: Required
* **Query Parameters**:
  * `role`: (Optional) e.g. `Backend Developer`
  * `difficulty`: (Optional) e.g. `Mid-Level`
  * `status`: (Optional) e.g. `Completed`
  * `limit`: (Optional, Default 10)
  * `offset`: (Optional, Default 0)
* **Response (200 OK)**:
  ```json
  {
    "total": 12,
    "items": [
      {
        "id": "d22e0f8c-22b4-4e92-bc10-efba70a5996b",
        "role": "Backend Developer",
        "difficulty": "Mid-Level",
        "status": "Completed",
        "created_at": "2026-06-17T18:30:15Z",
        "overall_score": 82.50
      }
    ]
  }
  ```
