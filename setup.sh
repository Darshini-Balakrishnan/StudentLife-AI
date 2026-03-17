#!/bin/bash

# StudentLife AI - Setup Script
# This script helps you set up the project for local development

echo "🚀 StudentLife AI - Setup Script"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found in PATH"
    echo "   Please ensure PostgreSQL is installed and running"
    echo "   Download from: https://www.postgresql.org/download/"
    echo ""
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..
echo ""

# Setup environment files
echo "🔧 Setting up environment files..."

if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env from .env.example"
else
    echo "ℹ️  .env already exists"
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.local.example frontend/.env.local
    echo "✅ Created frontend/.env.local from example"
else
    echo "ℹ️  frontend/.env.local already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Update .env with your PostgreSQL credentials"
echo "   2. Run: cd backend && npm run db:setup"
echo "   3. Run: npm run dev:backend (in one terminal)"
echo "   4. Run: npm run dev:frontend (in another terminal)"
echo ""
echo "📚 Documentation:"
echo "   - Quick Start: QUICKSTART.md"
echo "   - Full Guide: docs/deployment-guide.md"
echo "   - API Docs: docs/api-endpoints.md"
echo ""
echo "🚀 For deployment to production, see QUICKSTART.md"
echo ""
