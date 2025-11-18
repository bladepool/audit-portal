# Audit Portal Setup Script for Windows
Write-Host "🚀 Setting up Audit Portal..." -ForegroundColor Cyan

# Check if Node.js is installed
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green

# Check if MongoDB is installed
$mongoVersion = mongod --version 2>$null
if (-not $mongoVersion) {
    Write-Host "⚠️  MongoDB not found. Please install MongoDB or use MongoDB Atlas." -ForegroundColor Yellow
    Write-Host "   You can set MONGODB_URI in backend\.env to use a remote database." -ForegroundColor Yellow
}

# Install root dependencies
Write-Host "`n📦 Installing root dependencies..." -ForegroundColor Cyan
npm install

# Install frontend dependencies
Write-Host "`n📦 Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location frontend
npm install
Set-Location ..

# Install backend dependencies
Write-Host "`n📦 Installing backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install
Set-Location ..

# Create .env files from examples
Write-Host "`n⚙️  Setting up environment files..." -ForegroundColor Cyan

if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "✅ Created backend\.env" -ForegroundColor Green
} else {
    Write-Host "ℹ️  backend\.env already exists" -ForegroundColor Yellow
}

if (-not (Test-Path "frontend\.env.local")) {
    Copy-Item "frontend\.env.local.example" "frontend\.env.local"
    Write-Host "✅ Created frontend\.env.local" -ForegroundColor Green
} else {
    Write-Host "ℹ️  frontend\.env.local already exists" -ForegroundColor Yellow
}

Write-Host "`n🎉 Setup complete!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Update backend\.env with your MongoDB connection string"
Write-Host "   2. Update JWT_SECRET in backend\.env"
Write-Host "   3. Run 'npm run dev' to start both frontend and backend"
Write-Host "`n🌐 Access points:" -ForegroundColor Cyan
Write-Host "   - Frontend: http://localhost:3000"
Write-Host "   - Backend API: http://localhost:5000/api"
Write-Host "   - Admin Panel: http://localhost:3000/admin"
Write-Host "`n📚 Read README.md for more information" -ForegroundColor Cyan
