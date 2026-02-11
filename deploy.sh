#!/bin/bash

# Azure Custom Deployment Script for SAFE-8
set -e

echo "========================================="
echo "SAFE-8 Azure Deployment Build"
echo "========================================="

# Kudu deployment info
DEPLOYMENT_SOURCE="${DEPLOYMENT_SOURCE:-$PWD}"
DEPLOYMENT_TARGET="${DEPLOYMENT_TARGET:-/home/site/wwwroot}"
NEXT_MANIFEST_PATH="${NEXT_MANIFEST_PATH:-$DEPLOYMENT_TARGET/manifest}"
PREVIOUS_MANIFEST_PATH="${PREVIOUS_MANIFEST_PATH:-$NEXT_MANIFEST_PATH}"

echo "Source: $DEPLOYMENT_SOURCE"
echo "Target: $DEPLOYMENT_TARGET"

# 1. KuduSync - Copy files to target
echo ""
echo "==> Syncing files..."
if ! command -v kudusync &> /dev/null; then
    npm install -g kudusync
fi

kudusync -v 50 \
  -f "$DEPLOYMENT_SOURCE" \
  -t "$DEPLOYMENT_TARGET" \
  -n "$NEXT_MANIFEST_PATH" \
  -p "$PREVIOUS_MANIFEST_PATH" \
  -i ".git;.deployment;.gitignore;.env.local"

cd "$DEPLOYMENT_TARGET"

# 2. Build Frontend
echo ""
echo "==> Building frontend..."
if [ -f "package.json" ]; then
    # Fix for rollup optional dependency bug
    echo "Cleaning dependencies to fix rollup issue..."
    rm -rf node_modules package-lock.json
    
    echo "Installing dependencies..."
    npm install --legacy-peer-deps --loglevel=error
    
    echo "Building frontend..."
    npm run build
    echo "✓ Frontend built successfully"
else
    echo "⚠ No root package.json found"
fi

# 3. Install Server Dependencies
echo ""
echo "==> Installing server dependencies..."
if [ -d "server" ] && [ -f "server/package.json" ]; then
    cd server
    npm ci --prefer-offline --no-audit --omit=dev --loglevel=error 2>&1 | grep -E '(added|removed|ERR!)' || npm install --production --loglevel=error
    echo "✓ Server dependencies installed"
    cd ..
else
    echo "⚠ No server directory found"
fi

# 4. Cleanup
echo ""
echo "==> Cleaning up..."
npm prune --production 2>/dev/null || true

echo ""
echo "========================================="
echo "✓ Build complete!"
echo "========================================="
