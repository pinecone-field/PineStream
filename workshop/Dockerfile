# Multi-stage build to reduce final image size
# Build for AMD64 (x86_64) to ensure compatibility with Instruqt

# Stage 1: Build dependencies
FROM --platform=linux/amd64 ubuntu:22.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

# Install build dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    python3 \
    python3-pip \
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
FROM --platform=linux/amd64 node:18-slim AS runtime

ENV DEBIAN_FRONTEND=noninteractive

# Install only essential runtime dependencies
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

# Verify python3 is available
RUN python3 --version && which python3

# Install pnpm globally
RUN npm install -g pnpm@10.14.0

# Install code-server
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Create code-server user and directory
RUN useradd -m -s /bin/bash coder \
    && mkdir -p /home/coder/workspace \
    && chown -R coder:coder /home/coder

# Create container scripts directory
RUN mkdir -p /container-scripts

# Create code-server directories with proper permissions
RUN mkdir -p /home/coder/.local/share/code-server/extensions \
    && mkdir -p /home/coder/.local/share/code-server/user-data \
    && mkdir -p /home/coder/.local/share/code-server/user-data/User \
    && echo '{' > /home/coder/.local/share/code-server/user-data/User/settings.json \
    && echo '  "security.workspace.trust.enabled": false,' >> /home/coder/.local/share/code-server/user-data/User/settings.json \
    && echo '  "git.openRepositoryInParentFolders": false,' >> /home/coder/.local/share/code-server/user-data/User/settings.json \
    && echo '  "git.confirmSync": false,' >> /home/coder/.local/share/code-server/user-data/User/settings.json \
    && echo '  "git.promptToSaveFilesBeforeCommit": false' >> /home/coder/.local/share/code-server/user-data/User/settings.json \
    && echo '}' >> /home/coder/.local/share/code-server/user-data/User/settings.json \
    && chown -R coder:coder /home/coder/.local

# Copy pre-installed dependencies from builder stage
COPY --from=builder /app/webapp/package.json /container-scripts/deps/package.json
COPY --from=builder /app/webapp/pnpm-lock.yaml /container-scripts/deps/pnpm-lock.yaml
COPY --from=builder /root/.local/share/pnpm /root/.local/share/pnpm

# Expose ports for Nuxt and code-server
EXPOSE 3000 8080

# Set environment variables
ENV NODE_ENV=development
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
ENV GITHUB_REPO="https://github.com/pinecone-field/PineStream.git"
ENV GITHUB_BRANCH="main"
ENV NUXT_TELEMETRY_DISABLED=1

# Create startup script
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
    # Copy pre-installed dependencies from container image to fresh repo\n\
    echo "📦 Restoring pre-installed dependencies..."\n\
    cp -r /container-scripts/deps/package.json /app/webapp/\n\
    cp -r /container-scripts/deps/pnpm-lock.yaml /app/webapp/\n\
    \n\
    # Use pnpm store to restore dependencies (faster than full install)\n\
    echo "📦 Restoring dependencies from pnpm store..."\n\
    cd /app/webapp\n\
    pnpm install --frozen-lockfile --offline\n\
    \n\
    echo "🌐 Starting code-server with webapp folder..."\n\
    cd /app/webapp\n\
    exec code-server --bind-addr 0.0.0.0:8080 --auth none --user-data-dir /home/coder/.local/share/code-server/user-data --extensions-dir /home/coder/.local/share/code-server/extensions .\n\
    ' > /container-scripts/start.sh && chmod +x /container-scripts/start.sh

# Default command
CMD ["/container-scripts/start.sh"]
