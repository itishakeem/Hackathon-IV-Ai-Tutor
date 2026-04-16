FROM python:3.11-slim

# Install uv
RUN pip install uv

WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies (no dev deps)
RUN uv sync --no-dev --frozen

# Copy application code
COPY alembic/ ./alembic/
COPY alembic.ini ./
COPY app/ ./app/

# Run migrations then start server
CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port 8080 --workers 2"]
