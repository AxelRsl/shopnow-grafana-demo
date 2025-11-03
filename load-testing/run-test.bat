@echo off
REM K6 Test Runner for Windows

echo.
echo ================================================
echo    ShopNow K6 Load Testing
echo ================================================
echo.

if "%1"=="" (
    echo Usage: run-test.bat [smoke^|baseline^|black-friday^|frontend]
    echo.
    echo Examples:
    echo   run-test.bat smoke          - Quick smoke test
    echo   run-test.bat baseline       - Normal load test
    echo   run-test.bat black-friday   - Black Friday simulation
    echo   run-test.bat frontend       - Frontend RUM test
    echo.
    exit /b 1
)

set TEST=%1
set API_URL=http://localhost:3000
set FRONTEND_URL=http://localhost:3001

echo Test: %TEST%
echo API URL: %API_URL%
echo.

REM Check if K6 is installed
where k6 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: K6 is not installed!
    echo.
    echo Install K6:
    echo   choco install k6
    echo   Or download from: https://k6.io/docs/get-started/installation/
    echo.
    exit /b 1
)

REM Select script
if "%TEST%"=="smoke" set SCRIPT=scripts\smoke-test.js
if "%TEST%"=="baseline" set SCRIPT=scripts\baseline.js
if "%TEST%"=="black-friday" set SCRIPT=scripts\black-friday.js
if "%TEST%"=="frontend" set SCRIPT=scripts\frontend-test.js

if not defined SCRIPT (
    echo ERROR: Invalid test type: %TEST%
    echo Valid options: smoke, baseline, black-friday, frontend
    exit /b 1
)

echo Starting K6 test...
echo.

k6 run %SCRIPT%

echo.
echo View results in Grafana Cloud:
echo   https://axel041219.grafana.net
echo.
