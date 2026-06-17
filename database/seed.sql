-- Seed Data for AI-Powered Mock Interview Platform

-- Add default mock user (Password: Password123)
-- The password hash here represents '$2b$12$R9h/lIPzNgb.O71IRev6x.e0N4fO3i9.sS2Lp3lJ7lUomH9vFqH.G' (for testing/development purposes)
INSERT INTO users (id, email, hashed_password, full_name)
VALUES (
    'a85c7f8a-92a4-4a42-8980-0a27a8bc611c',
    'demo@example.com',
    '$2b$12$R9h/lIPzNgb.O71IRev6x.e0N4fO3i9.sS2Lp3lJ7lUomH9vFqH.G',
    'Demo Candidate'
) ON CONFLICT (email) DO NOTHING;

-- Add a dummy resume for the demo user
INSERT INTO resumes (id, user_id, file_path, file_name, raw_text, skills, experience_summary, parsed_metadata)
VALUES (
    'c76d9e8b-82a1-432d-9051-fb189b88cf41',
    'a85c7f8a-92a4-4a42-8980-0a27a8bc611c',
    '/storage/resumes/demo_resume.pdf',
    'demo_resume.pdf',
    'Demo Candidate. Email: demo@example.com. Skills: Python, FastAPI, PostgreSQL, Docker, Git. Experience: 2 years building web apps.',
    '["Python", "FastAPI", "PostgreSQL", "Docker", "Git"]'::jsonb,
    'Software developer with 2 years of experience specializing in backend technologies.',
    '{"education": [{"degree": "B.S. Software Engineering", "school": "State Tech", "year": "2024"}]}'::jsonb
) ON CONFLICT DO NOTHING;
