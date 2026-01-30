#!/bin/bash

echo "=== Testing SAFE-8 Server Setup ==="

# Check if we're in the right directory
if [ ! -f "server/package.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

echo "✓ Project structure looks good"

# Check server dependencies
cd server
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "✓ Dependencies installed"

# Check environment variables
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: No .env file found"
    if [ -f ".env.production" ]; then
        echo "Using .env.production as template"
        cp .env.production .env
    fi
fi

echo "✓ Environment configuration ready"

# Test database connection
echo "Testing database connection..."
node -e "
import('./config/database.js').then(async (module) => {
  const db = module.default;
  await db.testConnection();
  console.log('✓ Database connection successful');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
});
"

if [ $? -eq 0 ]; then
    echo ""
    echo "=== All checks passed! ==="
    echo "You can now start the server with: cd server && npm start"
else
    echo ""
    echo "=== Some checks failed ==="
    echo "Please review the errors above"
fi
