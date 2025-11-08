#!/bin/bash

# Quick setup script for development

echo "🚀 Setting up Freelance Escrow Platform..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Prerequisites check passed"

# Setup blockchain
echo ""
echo "📦 Installing blockchain dependencies..."
cd blockchain
npm install
echo "✅ Blockchain dependencies installed"

# Setup backend
echo ""
echo "🐍 Installing backend dependencies..."
cd ../backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
echo "✅ Backend dependencies installed"

# Setup frontend
echo ""
echo "⚛️ Installing frontend dependencies..."
cd ../frontend
npm install
echo "✅ Frontend dependencies installed"

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Copy .env.example to .env and fill in your values"
echo "2. Get test MATIC from faucets (see SETUP.md)"
echo "3. Deploy smart contracts: cd blockchain && npm run deploy:mumbai"
echo "4. Start backend: cd backend && uvicorn app.main:app --reload"
echo "5. Start frontend: cd frontend && npm run dev"
echo ""
echo "📖 Read SETUP.md for detailed instructions"
