# Database Documentation - AI-Powered Mock Interview Platform

This document describes the PostgreSQL database schema design, table definitions, field constraints, indexes, and step-by-step setup instructions on the **Supabase Free Tier**.

---

## 1. Supabase Free Tier Setup Instructions

To obtain a free PostgreSQL database and object storage bucket:

### A. Creating the Database on Supabase
1. Go to the [Supabase Console](https://supabase.com/) and sign up for a free account (using GitHub is recommended).
2. Click **New Project**, choose a name (e.g. `AI-Mock-Interview`), set a secure database password, and select the region closest to you.
3. Wait 1–2 minutes for the database instance to provision.
4. Once created, go to **Project Settings** (gear icon at the bottom left) -> **Database**.
5. Under **Connection string**, select **URI** and copy the connection string. It will look like this:
   `postgresql://postgres.[username]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
   * *Note*: For Python async application drivers (SQLAlchemy + `asyncpg`), replace the protocol prefix `postgresql://` with `postgresql+asyncpg://`.

### B. Creating the Resumes Storage Bucket
1. From the Supabase sidebar, select **Storage**.
2. Click **New Bucket**.
3. Name the bucket `resumes`.
4. Toggle **Public** to **OFF** (Keep it private so candidate resumes are secure and not publicly downloadable).
5. Click **Create Bucket**.
6. Go to **Project Settings** -> **API** and copy your **Project URL** (`SUPABASE_URL`) and **service_role API Key** (`SUPABASE_SERVICE_ROLE_KEY`).
   * *Security Warning*: Keep the `service_role` key secret. It bypasses Row Level Security (RLS) policies, allowing your backend application to upload and download PDFs from your private `resumes` bucket.

### C. Configuring Environment Variables
Add these values to your local `.env` and Render dashboard backend setup:
```env
# Database Credentials (from Supabase Database settings)
DATABASE_URL=postgresql+asyncpg://postgres.[username]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Supabase Credentials (for file storage upload/download)
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[secret-service-role-key-goes-here]
```

### D. Executing the Schema Scripts
You can deploy tables, triggers, and indices using the Supabase SQL Editor:
1. In the Supabase sidebar, click on **SQL Editor**.
2. Click **New Query**.
3. Copy the entire contents of [database/schema.sql](file:///E:/AI-Mock-Interview/database/schema.sql) and paste it into the SQL editor window.
4. Click **Run**. All tables (`users`, `resumes`, `interviews`, `questions`, `responses`, `evaluations`) and indexes will be created.

---

## 2. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    users {
        uuid id PK
        varchar email UK
        varchar hashed_password
        varchar full_name
        timestamp created_at
        timestamp updated_at
    }

    resumes {
        uuid id PK
        uuid user_id FK
        varchar file_path
        varchar file_name
        text raw_text
        jsonb skills
        text experience_summary
        jsonb parsed_metadata
        timestamp uploaded_at
    }

    interviews {
        uuid id PK
        uuid user_id FK
        uuid resume_id FK
        varchar role
        varchar difficulty
        varchar status
        timestamp created_at
        timestamp updated_at
    }

    questions {
        uuid id PK
        uuid interview_id FK
        text question_text
        integer order_index
        jsonb expected_skills
        text ideal_answer
    }

    responses {
        uuid id PK
        uuid question_id FK, UK
        text user_answer
        integer duration_seconds
        decimal score
        text feedback
        timestamp submitted_at
    }

    evaluations {
        uuid id PK
        uuid interview_id FK, UK
        decimal overall_score
        jsonb strengths
        jsonb weaknesses
        text feedback_summary
        jsonb topic_scores
        timestamp created_at
    }

    users ||--o{ resumes : "uploads"
    users ||--o{ interviews : "takes"
    resumes ||--o{ interviews : "references"
    interviews ||--|{ questions : "contains"
    questions ||--o| responses : "has"
    interviews ||--o| evaluations : "gets"
```

---

## 3. Table Definitions & Schemas

### `users`
* **id**: `UUID` | **Primary Key** | Default: `gen_random_uuid()`
* **email**: `VARCHAR(255)` | **Unique** | **Not Null**
* **hashed_password**: `VARCHAR(255)` | **Nullable** | Hashed password (null for Google OAuth logins).
* **full_name**: `VARCHAR(255)` | **Not Null**
* **auth_provider**: `VARCHAR(50)` | **Not Null** | Login provider (`'local'`, `'google'`).
* **provider_id**: `VARCHAR(255)` | **Nullable** | User identifier returned from Google OAuth.
* **reset_token**: `VARCHAR(255)` | **Nullable** | Token sent via SMTP for password reset verification.
* **reset_token_expires_at**: `TIMESTAMPTZ` | **Nullable** | Expiry time of the reset token.
* **created_at**: `TIMESTAMPTZ` | Default: `CURRENT_TIMESTAMP`
* **updated_at**: `TIMESTAMPTZ` | Default: `CURRENT_TIMESTAMP`

### `resumes`
* **id**: `UUID` | **Primary Key** | Default: `gen_random_uuid()`
* **user_id**: `UUID` | **Foreign Key** | References `users(id)` ON DELETE CASCADE.
* **file_path**: `VARCHAR(512)` | **Not Null** | Path reference inside the Supabase Storage bucket.
* **file_name**: `VARCHAR(255)` | **Not Null** | Name of the PDF file.
* **raw_text**: `TEXT` | **Not Null** | Extracted text from PDF.
* **skills**: `JSONB` | **Not Null** | Extracted skills list.
* **experience_summary**: `TEXT` | **Nullable**
* **parsed_metadata**: `JSONB` | **Nullable**
* **uploaded_at**: `TIMESTAMPTZ` | Default: `CURRENT_TIMESTAMP`

### `interviews`
* **id**: `UUID` | **Primary Key** | Default: `gen_random_uuid()`
* **user_id**: `UUID` | **Foreign Key** | References `users(id)` ON DELETE CASCADE.
* **resume_id**: `UUID` | **Foreign Key** | References `resumes(id)` ON DELETE SET NULL.
* **role**: `VARCHAR(100)` | **Not Null**
* **difficulty**: `VARCHAR(50)` | **Not Null**
* **status**: `VARCHAR(50)` | **Not Null** | (e.g., `'Created'`, `'In-Progress'`, `'Completed'`, `'Cancelled'`).
* **created_at**: `TIMESTAMPTZ` | Default: `CURRENT_TIMESTAMP`
* **updated_at**: `TIMESTAMPTZ` | Default: `CURRENT_TIMESTAMP`

### `questions`
* **id**: `UUID` | **Primary Key** | Default: `gen_random_uuid()`
* **interview_id**: `UUID` | **Foreign Key** | References `interviews(id)` ON DELETE CASCADE.
* **question_text**: `TEXT` | **Not Null**
* **order_index**: `INTEGER` | **Not Null**
* **expected_skills**: `JSONB` | **Nullable**
* **ideal_answer**: `TEXT` | **Nullable**

### `responses`
* **id**: `UUID` | **Primary Key** | Default: `gen_random_uuid()`
* **question_id**: `UUID` | **Foreign Key** | **Unique** | References `questions(id)` ON DELETE CASCADE.
* **user_answer**: `TEXT` | **Not Null**
* **duration_seconds**: `INTEGER` | **Nullable**
* **score**: `DECIMAL(5, 2)` | **Nullable**
* **feedback**: `TEXT` | **Nullable**
* **submitted_at**: `TIMESTAMPTZ` | Default: `CURRENT_TIMESTAMP`

### `evaluations`
* **id**: `UUID` | **Primary Key** | Default: `gen_random_uuid()`
* **interview_id**: `UUID` | **Foreign Key** | **Unique** | References `interviews(id)` ON DELETE CASCADE.
* **overall_score**: `DECIMAL(5, 2)` | **Not Null**
* **strengths**: `JSONB` | **Not Null**
* **weaknesses**: `JSONB` | **Not Null**
* **feedback_summary**: `TEXT` | **Not Null**
* **topic_scores**: `JSONB` | **Nullable**
* **created_at**: `TIMESTAMPTZ` | Default: `CURRENT_TIMESTAMP`
