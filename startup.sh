#!/bin/sh
set -e

echo "=== SAFE-8 Application Startup ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Determine correct path
if [ -d "/home/site/wwwroot/server" ]; then
    SERVER_DIR="/home/site/wwwroot/server"
    echo "Using Azure path: $SERVER_DIR"
elif [ -d "server" ]; then
    SERVER_DIR="server"
    echo "Using relative path: $SERVER_DIR"
else
    echo "Error: Cannot find server directory"
    echo "Available directories:"
    ls -la
    exit 1
fi

# Navigate to server directory
echo "Navigating to $SERVER_DIR..."
cd "$SERVER_DIR"

echo "Server directory contents:"
ls -la

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production --no-optional
else
    echo "Dependencies already installed"
fi

# Start the application
echo "Starting Node.js server..."
exec node index.js
