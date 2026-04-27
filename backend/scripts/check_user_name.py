import asyncio
import sys
sys.path.insert(0, ".")
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "").replace("postgresql+asyncpg://", "postgresql://")

async def check():
    conn = await asyncpg.connect(DATABASE_URL, ssl="require", server_settings={"jit": "off"})
    try:
        rows = await conn.fetch("SELECT email, name, tier FROM users ORDER BY email")
        print(f"Total users: {len(rows)}")
        for r in rows:
            print(f"  email={r['email']} name={r['name']!r} tier={r['tier']}")
    finally:
        await conn.close()

asyncio.run(check())
