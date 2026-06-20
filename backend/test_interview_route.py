import asyncio
import uuid
from httpx import AsyncClient
from app.main import app
from app.auth.routes import get_current_user
from app.models.user import User

# Override get_current_user for testing
class MockUser:
    id = uuid.uuid4()
    email = "test_user_interview_endpoint@example.com"
    full_name = "Alice Candidate"
    auth_provider = "supabase"

# Wait, we need the user to exist in the database to avoid foreign key violations.
# But for mock routing test, if we can run it, we can check.
# Wait, let's fetch a real user ID from the database if one exists! Or create one,
# or we can just catch the foreign key error to verify the logic flow.
# Let's write a database helper to retrieve a real user ID, or create one in the database.
# Let's do that!
from app.core.database import SessionLocal
from sqlalchemy import text

async def get_or_create_test_user():
    async with SessionLocal() as session:
        # Check if test user exists
        res = await session.execute(
            text("SELECT id FROM users LIMIT 1")
        )
        row = res.first()
        if row:
            return row[0]
        else:
            # Create a test user
            uid = uuid.uuid4()
            await session.execute(
                text("INSERT INTO users (id, email, full_name, auth_provider, is_active) VALUES (:id, :email, :full_name, 'local', true)"),
                {"id": uid, "email": "test_routing@example.com", "full_name": "Routing Tester"}
            )
            await session.commit()
            return uid

async def test_interview_endpoints():
    user_id = await get_or_create_test_user()
    print(f"Using Test User ID: {user_id}")

    class ActiveMockUser:
        id = user_id
        email = "test_routing@example.com"
        full_name = "Routing Tester"
        auth_provider = "local"

    app.dependency_overrides[get_current_user] = lambda: ActiveMockUser()

    async with AsyncClient(app=app, base_url="http://test") as ac:
        # 1. Test POST /api/interviews
        payload = {
            "resume_id": None,
            "role": "Fullstack Developer",
            "difficulty": "Senior"
        }
        print("Testing POST /api/interviews...")
        response = await ac.post("/api/interviews", json=payload, timeout=30.0)
        print("POST Status:", response.status_code)
        
        if response.status_code == 201:
            data = response.json()
            print("Successfully generated interview!")
            print(f"Interview ID: {data['id']}")
            print(f"Role: {data['role']}")
            print(f"Difficulty: {data['difficulty']}")
            print(f"Status: {data['status']}")
            print(f"Number of questions generated: {len(data['questions'])}")
            for idx, q in enumerate(data['questions'], 1):
                print(f"  Q{idx}: {q['question_text']}")
                print(f"  Skills expected: {q['expected_skills']}")

            # 2. Test GET /api/interviews
            print("\nTesting GET /api/interviews...")
            list_res = await ac.get("/api/interviews")
            print("GET List Status:", list_res.status_code)
            if list_res.status_code == 200:
                print(f"Found {len(list_res.json())} interviews in history.")

            # 3. Test GET /api/interviews/{id}
            print(f"\nTesting GET /api/interviews/{data['id']}...")
            get_res = await ac.get(f"/api/interviews/{data['id']}")
            print("GET Single Status:", get_res.status_code)
        else:
            print("POST Error:", response.text)

if __name__ == "__main__":
    asyncio.run(test_interview_endpoints())
