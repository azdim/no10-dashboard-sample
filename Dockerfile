# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and data
COPY app/ ./app/
COPY data/ ./data/

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash dashboard && \
    chown -R dashboard:dashboard /app
USER dashboard

# Expose port
EXPOSE 8050

# Set environment variables
ENV PYTHONPATH=/app
ENV DASH_DEBUG=false

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8050/ || exit 1

# Run the application with Gunicorn (production-ready WSGI server)
CMD ["gunicorn", "--bind", "0.0.0.0:8050", "--workers", "4", "--timeout", "120", "app.app:server"]