#!/bin/bash

# Audit Portal Setup Script
echo "🚀 Setting up Audit Portal..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found. Please install MongoDB or use MongoDB Atlas."
    echo "   You can set MONGODB_URI in backend/.env to use a remote database."
fi

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Create .env files from examples
echo ""
echo "⚙️  Setting up environment files..."

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
else
    echo "ℹ️  backend/.env already exists"
fi

if [ ! -f "frontend/.env.local" ]; then
    cp frontend/.env.local.example frontend/.env.local
    echo "✅ Created frontend/.env.local"
else
    echo "ℹ️  frontend/.env.local already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Update backend/.env with your MongoDB connection string"
echo "   2. Update JWT_SECRET in backend/.env"
echo "   3. Run 'npm run dev' to start both frontend and backend"
echo ""
echo "🌐 Access points:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000/api"
echo "   - Admin Panel: http://localhost:3000/admin"
echo ""
echo "📚 Read README.md for more information"
