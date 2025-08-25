# Pinestream Docker Setup

This guide explains how to run the Pinestream project using Docker with Ubuntu, including code-server for browser-based development. The Docker image clones the project from GitHub on startup, ensuring you always have the latest code.

## 🐳 Prerequisites

- Docker installed on your system
- Git to clone the repository
- GitHub repository URL for your Pinestream project

## 🚀 Quick Start

### 1. Build the Docker Image

```bash
# Build the Docker image
docker build -t pinestream .
```

### 2. Set Environment Variables

Create a `.env` file in the root directory with your API keys and GitHub repository:

```bash
# GitHub Configuration
GITHUB_REPO=https://github.com/yourusername/pinestream.git
GITHUB_BRANCH=main

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=your_pinecone_index_name

# Groq Configuration
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Run the Container

```bash
# Run the container with both Nuxt and code-server
docker run -p 3000:3000 -p 8080:8080 \
  -e GITHUB_REPO=https://github.com/yourusername/pinestream.git \
  -e GITHUB_BRANCH=main \
  -e PINECONE_API_KEY=your_key \
  -e PINECONE_INDEX_NAME=your_index \
  -e GROQ_API_KEY=your_key \
  pinestream
```

The application will be available at:

- **Nuxt App**: `http://localhost:3000`
- **VS Code in Browser**: `http://localhost:8080`

### 4. Stop the Container

```bash
# Find running containers
docker ps

# Stop a specific container
docker stop <container_id>

# Or stop all containers
docker stop $(docker ps -q)
```

## 🔄 GitHub Integration

The Docker container automatically:

1. **Clones the repository** from GitHub on startup
2. **Pulls latest changes** if the repository already exists
3. **Installs dependencies** using pnpm
4. **Prepares Nuxt** for development
5. **Starts both services** (code-server and Nuxt)

### Required Environment Variables:

- **`GITHUB_REPO`**: Full GitHub repository URL (required)
- **`GITHUB_BRANCH`**: Branch to clone (defaults to `main`)

### Example Repository URLs:

```bash
# HTTPS
GITHUB_REPO=https://github.com/username/pinestream.git

# SSH (if you have SSH keys mounted)
GITHUB_REPO=git@github.com:username/pinestream.git

# Specific branch
GITHUB_BRANCH=develop
```

## 🌐 Code-Server (VS Code in Browser)

The Docker image includes code-server, which provides a full VS Code experience in your browser:

### Features:

- **Full VS Code Interface**: Complete IDE experience in the browser
- **Extensions Support**: Install and use VS Code extensions
- **Terminal Access**: Built-in terminal for running commands
- **File Management**: Full file explorer and editing capabilities
- **Git Integration**: Source control features
- **Debugging**: Set breakpoints and debug your code

### Accessing Code-Server:

1. Start the container with port 8080 exposed
2. Open `http://localhost:8080` in your browser
3. Start coding directly in the browser!

### Code-Server Only Mode:

If you only want to use code-server without starting Nuxt:

```bash
docker run -p 8080:8080 \
  -e GITHUB_REPO=https://github.com/yourusername/pinestream.git \
  -e GITHUB_BRANCH=main \
  -e PINECONE_API_KEY=your_key \
  -e PINECONE_INDEX_NAME=your_index \
  -e GROQ_API_KEY=your_key \
  --entrypoint /app/code-server.sh \
  pinestream
```

## 🔧 Docker Commands Reference

### Build the Image

```bash
docker build -t pinestream .
```

### Run the Container

```bash
# Basic run (both services)
docker run -p 3000:3000 -p 8080:8080 \
  -e GITHUB_REPO=https://github.com/yourusername/pinestream.git \
  pinestream

# With all environment variables
docker run -p 3000:3000 -p 8080:8080 \
  -e GITHUB_REPO=https://github.com/yourusername/pinestream.git \
  -e GITHUB_BRANCH=main \
  -e PINECONE_API_KEY=your_key \
  -e PINECONE_INDEX_NAME=your_index \
  -e GROQ_API_KEY=your_key \
  pinestream

# With custom branch
docker run -p 3000:3000 -p 8080:8080 \
  -e GITHUB_REPO=https://github.com/yourusername/pinestream.git \
  -e GITHUB_BRANCH=feature/new-feature \
  pinestream
```

### Container Management

```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# View container logs
docker logs <container_id>

# Follow logs in real-time
docker logs -f <container_id>

# Execute commands in running container
docker exec -it <container_id> bash

# Stop container
docker stop <container_id>

# Remove container
docker rm <container_id>

# Remove image
docker rmi pinestream
```

## 📁 Volume Mounts

The Docker setup supports volume mounts for data persistence:

- **`./data:/app/data`**: Mounts your local data directory to persist databases and CSV files
- **`./webapp:/app/webapp`**: Mounts the webapp directory for live development (optional)

Note: When using GitHub cloning, the webapp directory is automatically populated from the repository.

## 🌍 Environment Variables

| Variable              | Description                             | Required |
| --------------------- | --------------------------------------- | -------- |
| `GITHUB_REPO`         | GitHub repository URL                   | Yes      |
| `GITHUB_BRANCH`       | Branch to clone (default: main)         | No       |
| `PINECONE_API_KEY`    | Your Pinecone API key                   | Yes      |
| `PINECONE_INDEX_NAME` | Your Pinecone index name                | Yes      |
| `GROQ_API_KEY`        | Your Groq API key                       | Yes      |
| `NODE_ENV`            | Node environment (default: development) | No       |
| `NUXT_HOST`           | Host binding (default: 0.0.0.0)         | No       |
| `NUXT_PORT`           | Port number (default: 3000)             | No       |

## 🛠️ Development Workflow

### Live Code Changes

The GitHub cloning approach ensures you always have the latest code:

1. **Push changes** to your GitHub repository
2. **Restart the container** to pull the latest changes
3. **Or manually pull** from within the container:
   ```bash
   docker exec -it <container_id> bash
   cd /app
   git pull origin main
   cd webapp
   pnpm install
   ```

### Using Code-Server for Development

1. **Access VS Code**: Open `http://localhost:8080` in your browser
2. **Open Terminal**: Use ` Ctrl+``  ` or go to Terminal → New Terminal
3. **Install Extensions**: Install your favorite VS Code extensions
4. **Run Commands**: Use the terminal to run pnpm commands, tests, etc.
5. **Debug**: Set breakpoints and debug your code directly in the browser

### Running Tests

```bash
# Run tests inside the container
docker exec -it <container_id> bash
cd /app/webapp
pnpm test:run

# Or run a specific test
pnpm test:run text-splitter.test.ts

# Or use code-server terminal to run tests
```

### Installing New Dependencies

```bash
# Install a new package
docker exec -it <container_id> bash
cd /app/webapp
pnpm add package-name

# Install dev dependencies
pnpm add -D package-name

# Or use code-server terminal to install packages
```

## 🔍 Troubleshooting

### Common Issues

1. **GitHub repository not found**: Check the repository URL and ensure it's public or you have proper access

   ```bash
   # Test the repository URL
   git ls-remote https://github.com/username/pinestream.git
   ```

2. **Port already in use**: Change the port mapping

   ```bash
   docker run -p 3001:3000 -p 8081:8080 pinestream  # Use different ports
   ```

3. **Permission issues**: Ensure your user has access to the mounted directories

4. **Container won't start**: Check logs for errors

   ```bash
   docker logs <container_id>
   ```

5. **Code-server not accessible**: Ensure port 8080 is exposed and not blocked by firewall

6. **Git clone fails**: Check network connectivity and repository access
   ```bash
   # Test from within container
   docker exec -it <container_id> bash
   git clone https://github.com/username/pinestream.git /tmp/test
   ```

### Viewing Logs

```bash
# View logs
docker logs <container_id>

# Follow logs in real-time
docker logs -f <container_id>
```

### Accessing the Container

```bash
# Open a bash shell in the running container
docker exec -it <container_id> bash

# Or start a new container with shell access
docker run -it --rm pinestream bash
```

## 🏗️ Production Considerations

For production deployment:

1. **Use specific commit/tag**: Set `GITHUB_BRANCH` to a specific tag for stability
2. **Set NODE_ENV=production**: Change the environment variable
3. **Use multi-stage builds**: Optimize the Dockerfile for production
4. **Add health checks**: Include health check endpoints
5. **Configure reverse proxy**: Use nginx or similar for production
6. **Remove code-server**: Don't expose port 8080 in production

## 🐧 Why Ubuntu?

This Dockerfile uses Ubuntu 22.04 LTS because:

- **Better compatibility**: More packages and libraries available
- **Familiar environment**: Most developers are familiar with Ubuntu/Debian
- **Native dependencies**: Better support for native Node.js modules like `better-sqlite3`
- **Stability**: LTS version ensures long-term support and security updates
- **Code-server support**: Better compatibility with code-server and its dependencies
- **Git operations**: Better Git support and compatibility

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Ubuntu Documentation](https://ubuntu.com/tutorials)
- [Code-Server Documentation](https://coder.com/docs/code-server/latest)
- [Git Documentation](https://git-scm.com/doc)
- [Nuxt.js Documentation](https://nuxt.com/docs)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [Groq Documentation](https://console.groq.com/docs)

## 🤝 Contributing

When contributing to the Docker setup:

1. Test your changes locally
2. Update this README if needed
3. Ensure the Dockerfile follows best practices
4. Test with different Node.js versions if applicable
5. Verify code-server functionality works as expected
6. Test GitHub cloning with different repository types
