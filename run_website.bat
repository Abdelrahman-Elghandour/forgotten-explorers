@echo off
title NASA Space Apps 2026 - Forgotten Explorers
cd /d "%~dp0"
echo ==============================================================
echo   NASA Space Apps Challenge 2026 - Forgotten Explorers
echo ==============================================================
echo.
echo Starting local web server...
start http://localhost:8000/
python serve.py
if errorlevel 1 (
    echo.
    echo Trying fallback server...
    start http://localhost:8000/
    python -m http.server 8000
)
pause
