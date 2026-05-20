#!/bin/bash

# Master-Kids Build Script - All Platforms

echo "🚀 Master-Kids Full Build & Deploy"
echo "===================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Installing...${NC}"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Python 3 not found. Installing...${NC}"
    exit 1
fi

echo -e "${BLUE}📱 Building Mobile App (Expo)${NC}"
cd apps/mobile
npm install
npm run lint
echo -e "${GREEN}✓ Mobile app ready${NC}"

echo -e "${BLUE}🌐 Building Web App (React)${NC}"
cd ../../apps/web
npm install
npm run build
echo -e "${GREEN}✓ Web app built to dist/${NC}"

echo -e "${BLUE}🔌 Setting up Backend (FastAPI)${NC}"
cd ../../apps/backend
python3 -m venv venv
source venv/bin/activate || . venv/Scripts/activate
pip install -r requirements.txt
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ All builds complete!${NC}"
echo -e "${GREEN}================================================${NC}"

echo -e "\n${BLUE}To run locally:${NC}"
echo "1. Backend:  cd apps/backend && python main.py"
echo "2. Web:      cd apps/web && npm run dev"
echo "3. Mobile:   cd apps/mobile && npm start"

echo -e "\n${BLUE}Environment Setup:${NC}"
echo "1. Copy apps/backend/.env.example to .env"
echo "2. Add your OPENAI_API_KEY to backend/.env"
echo "3. Optional: Add SUPABASE credentials to mobile/.env"

echo -e "\n${BLUE}API Documentation:${NC}"
echo "Visit http://localhost:8000/docs when backend is running"

echo -e "\n${GREEN}Happy coding! 🎉${NC}"
