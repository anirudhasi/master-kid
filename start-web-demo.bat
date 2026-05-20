@echo off
echo Starting Master-Kids Demo...
echo.
echo [1] Starting Python Backend on http://localhost:8000
start "Master-Kids Backend" cmd /k "cd /d "%~dp0apps\backend-py" && uvicorn main:app --reload --port 8000"

echo [2] Starting React Web App on http://localhost:3000
timeout /t 2 /nobreak >nul
start "Master-Kids Web" cmd /k "cd /d "%~dp0apps\web" && npm run dev"

echo.
echo Both servers starting...
echo Backend: http://localhost:8000/health
echo Web App: http://localhost:3000
echo.
timeout /t 5 /nobreak >nul
start "" "http://localhost:3000"
