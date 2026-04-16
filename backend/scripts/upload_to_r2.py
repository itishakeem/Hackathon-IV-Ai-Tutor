"""Upload all content and quiz files to Supabase Storage.

Run once (or re-run to update) from the backend/ directory:
    uv run python scripts/upload_to_r2.py

Requires .env to have valid SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv()

from supabase import create_client

BACKEND_DIR = Path(__file__).resolve().parent.parent
CONTENT_DIR = BACKEND_DIR / "content"
QUIZZES_DIR = BACKEND_DIR / "quizzes"

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
SUPABASE_BUCKET = os.environ["SUPABASE_BUCKET"]


def upload_file(client, local_path: Path, storage_path: str) -> bool:
    try:
        with open(local_path, "rb") as f:
            data = f.read()
        mime = "text/markdown" if local_path.suffix == ".md" else "application/json"
        client.storage.from_(SUPABASE_BUCKET).upload(
            storage_path,
            data,
            {"content-type": mime, "upsert": "true"},
        )
        print(f"  OK {storage_path}")
        return True
    except Exception as exc:
        print(f"  FAIL {storage_path} - {exc}")
        return False


def main():
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    uploaded = 0
    failed = 0

    print(f"Uploading to bucket: {SUPABASE_BUCKET}\n")

    print("Chapters:")
    for md_file in sorted(CONTENT_DIR.glob("chapter-*.md")):
        if upload_file(client, md_file, f"chapters/{md_file.name}"):
            uploaded += 1
        else:
            failed += 1

    print("\nQuizzes:")
    for json_file in sorted(QUIZZES_DIR.glob("quiz-*.json")):
        if upload_file(client, json_file, f"quizzes/{json_file.name}"):
            uploaded += 1
        else:
            failed += 1

    print(f"\nDone: {uploaded} uploaded, {failed} failed.")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
