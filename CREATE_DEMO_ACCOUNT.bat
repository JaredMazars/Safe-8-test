@echo off
echo.
echo ============================================
echo    CREATING DEMO ACCOUNT
echo ============================================
echo.

cd /d "%~dp0"

echo Stopping any running node processes...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo Starting backend server...
start "Backend Server" cmd /k "cd server && node index.js"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"

echo Waiting for frontend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo    Running account creation test...
echo ============================================
echo.

node TEST_ACCOUNT_DIRECT.js

echo.
echo ============================================
echo.
pause
