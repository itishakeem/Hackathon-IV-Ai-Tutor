import asyncio
import sys
sys.path.insert(0, ".")

import bcrypt
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
pg_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

async def check_user():
    conn = await asyncpg.connect(pg_url, ssl="require", server_settings={"jit": "off"})
    try:
        row = await conn.fetchrow(
            "SELECT id, email, tier, hashed_password FROM users WHERE email = $1",
            "abdulhakeem7978@gmail.com"
        )
        if not row:
            print("RESULT: User NOT found in database")
            return

        print(f"RESULT: User found: {row['email']}")
        print(f"   Tier: {row['tier']}")
        print(f"   Hash prefix: {row['hashed_password'][:30]}...")

        hashed = row['hashed_password']
        test1 = bcrypt.checkpw(b"agent345", hashed.encode())
        test2 = bcrypt.checkpw(b"hakeem34", hashed.encode())
        print(f"   Password 'agent345' matches: {test1}")
        print(f"   Password 'hakeem34' matches: {test2}")

        codes = await conn.fetch(
            "SELECT code, expires_at, used FROM password_reset_codes WHERE email = $1 ORDER BY expires_at DESC LIMIT 5",
            "abdulhakeem7978@gmail.com"
        )
        print(f"\n   Reset codes ({len(codes)} found):")
        for c in codes:
            print(f"     code={c['code']}, expires={c['expires_at']}, used={c['used']}")

    finally:
        await conn.close()

asyncio.run(check_user())
