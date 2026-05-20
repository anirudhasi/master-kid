@echo off
REM Master-Kids Build Script for Windows

echo.
echo 🚀 Master-Kids Full Build ^& Deploy
echo ====================================
echo.

REM Check Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js from https://nodejs.org/
    exit /b 1
)

REM Check Python
where python >nul 2>nul
if errorlevel 1 (
    echo ❌ Python not found. Please install Python from https://python.org/
    exit /b 1
)

echo 📱 Building Mobile App (Expo)
cd apps\mobile
call npm install
call npm run lint
echo ✓ Mobile app ready
cd ..\..

echo.
echo 🌐 Building Web App (React)
cd apps\web
call npm install
call npm run build
echo ✓ Web app built to dist\
cd ..\..

echo.
echo 🔌 Setting up Backend (FastAPI)
cd apps\backend
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
echo ✓ Backend dependencies installed
cd ..\..

echo.
echo ================================================
echo ✅ All builds complete!
echo ================================================
echo.

echo To run locally:
echo 1. Backend:  cd apps\backend ^&^& python main.py
echo 2. Web:      cd apps\web ^&^& npm run dev
echo 3. Mobile:   cd apps\mobile ^&^& npm start
echo.

echo Environment Setup:
echo 1. Copy apps\backend\.env.example to .env
echo 2. Add your OPENAI_API_KEY to backend\.env
echo 3. Optional: Add SUPABASE credentials to mobile\.env
echo.

echo API Documentation:
echo Visit http://localhost:8000/docs when backend is running
echo.

echo 🎉 Happy coding!
echo.
