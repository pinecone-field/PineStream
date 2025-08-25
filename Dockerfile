# Multi-stage build to reduce final image size

# Stage 1: Build dependencies
FROM ubuntu:22.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

# Install build dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    python3 \
    make \
    g++ \
    sqlite3 \
    libsqlite3-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install Node.js 18.x
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Install pnpm globally
RUN npm install -g pnpm@10.14.0

# Clone repository and install dependencies
RUN git clone https://github.com/pinecone-field/PineStream.git /app
RUN cd /app/webapp && pnpm install --frozen-lockfile

# Stage 2: Runtime image - use smaller base
FROM node:18-slim AS runtime

ENV DEBIAN_FRONTEND=noninteractive

# Install runtime dependencies including build tools for better-sqlite3
RUN apt-get update && apt-get install -y \
    curl \
    git \
    python3 \
    make \
    g++ \
    sqlite3 \
    libsqlite3-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && rm -rf /tmp/* /var/tmp/*

# Install pnpm globally (needed for PineStream)
RUN npm install -g pnpm@10.14.0

# Install code-server with curl now available
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Create code-server user and directory
RUN useradd -m -s /bin/bash coder \
    && mkdir -p /home/coder/workspace \
    && chown -R coder:coder /home/coder

# Create code-server directories with proper permissions
RUN mkdir -p /home/coder/.local/share/code-server/extensions \
    && mkdir -p /home/coder/.local/share/code-server/user-data \
    && chown -R coder:coder /home/coder/.local

# Create container scripts directory
RUN mkdir -p /container-scripts

# Copy only essential project files (no pnpm store)
COPY --from=builder /app/webapp/package.json /app/webapp/package.json
COPY --from=builder /app/webapp/pnpm-lock.yaml /app/webapp/pnpm-lock.yaml

# Expose ports for Nuxt and code-server
EXPOSE 3000 8080

# Set environment variables
ENV NODE_ENV=development
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
ENV GITHUB_REPO="https://github.com/pinecone-field/PineStream.git"
ENV GITHUB_BRANCH="main"
ENV NUXT_TELEMETRY_DISABLED=1

# Create startup scripts in container-scripts directory
RUN echo '#!/bin/bash\n\
echo "🚀 Starting PineStream workshop environment"\n\
\n\
echo "📥 Cloning repository from GitHub..."\n\
echo "Repository: $GITHUB_REPO"\n\
echo "Branch: ${GITHUB_BRANCH:-main}"\n\
\n\
# Clean up existing directory and clone fresh\n\
echo "🧹 Cleaning up existing directory..."\n\
rm -rf /app\n\
\n\
# Clone the repository to /app\n\
echo "📥 Cloning repository..."\n\
git clone -b ${GITHUB_BRANCH:-main} $GITHUB_REPO /app\n\
\n\
# Install dependencies fresh (pnpm store approach was too large)\n\
echo "📦 Installing dependencies..."\n\
cd /app/webapp\n\
pnpm install --frozen-lockfile\n\
\n\
echo "🌐 Starting code-server with webapp folder..."\n\
cd /app\n\
code-server --bind-addr 0.0.0.0:8080 --auth none --user-data-dir /home/coder/.local/share/code-server/user-data --extensions-dir /home/coder/.local/share/code-server/extensions . &\n\
\n\
# Wait for code-server to start\n\
sleep 3\n\
\n\
echo "✅ PineStream workshop environment is ready!"\n\
echo "🌐 Access VS Code at: http://localhost:8080 (opens webapp folder directly)"\n\
echo "📱 Access Nuxt app at: http://localhost:3000 (when started)"\n\
echo "🔧 To start Nuxt dev server, run: pnpm dev"\n\
echo ""\n\
echo "🐚 Dropping into interactive shell..."\n\
echo "💡 You can now run commands, start services, or use the terminal"\n\
echo ""\n\
\n\
# Drop into interactive shell\n\
exec /bin/bash\n\
' > /container-scripts/start.sh && chmod +x /container-scripts/start.sh

# Default command
CMD ["/container-scripts/start.sh"]
