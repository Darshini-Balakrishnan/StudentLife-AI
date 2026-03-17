# StudentLife AI - Setup Script (PowerShell)
# This script helps you set up the project for local development

Write-Host "🚀 StudentLife AI - Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Check if PostgreSQL is installed
try {
    $null = Get-Command psql -ErrorAction Stop
    Write-Host "✅ PostgreSQL found" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PostgreSQL not found in PATH" -ForegroundColor Yellow
    Write-Host "   Please ensure PostgreSQL is installed and running" -ForegroundColor Yellow
    Write-Host "   Download from: https://www.postgresql.org/download/" -ForegroundColor Yellow
}
Write-Host ""

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Cyan
npm install
Write-Host ""

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install
Set-Location ..
Write-Host ""

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install
Set-Location ..
Write-Host ""

# Setup environment files
Write-Host "🔧 Setting up environment files..." -ForegroundColor Cyan

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "✅ Created .env from .env.example" -ForegroundColor Green
} else {
    Write-Host "ℹ️  .env already exists" -ForegroundColor Yellow
}

if (-not (Test-Path frontend/.env.local)) {
    Copy-Item frontend/.env.local.example frontend/.env.local
    Write-Host "✅ Created frontend/.env.local from example" -ForegroundColor Green
} else {
    Write-Host "ℹ️  frontend/.env.local already exists" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Update .env with your PostgreSQL credentials"
Write-Host "   2. Run: cd backend; npm run db:setup"
Write-Host "   3. Run: npm run dev:backend (in one terminal)"
Write-Host "   4. Run: npm run dev:frontend (in another terminal)"
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - Quick Start: QUICKSTART.md"
Write-Host "   - Full Guide: docs/deployment-guide.md"
Write-Host "   - API Docs: docs/api-endpoints.md"
Write-Host ""
Write-Host "🚀 For deployment to production, see QUICKSTART.md" -ForegroundColor Cyan
Write-Host ""
