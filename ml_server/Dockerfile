FROM python:3.11-slim

# Install system dependencies (curl is useful for container healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set up a new user named "user" with user ID 1000 for Hugging Face Spaces
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR $HOME/app

# Install PyTorch and Torchvision CPU-only first to keep the image extremely lightweight
RUN pip install --user --no-cache-dir --upgrade pip && \
    pip install --user --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Copy and install the remaining requirements
COPY --chown=user requirements.txt .
# Since torch/torchvision are already installed CPU-only, this installs fastapi, pillow, uvicorn, multipart
RUN pip install --user --no-cache-dir -r requirements.txt

# Copy model weights and application source code
COPY --chown=user best_effnet_b3_multilabel.pth .
COPY --chown=user model_loader.py .
COPY --chown=user app.py .

# Hugging Face Spaces exposes port 7860 by default
EXPOSE 7860

# Start FastAPI application using uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
