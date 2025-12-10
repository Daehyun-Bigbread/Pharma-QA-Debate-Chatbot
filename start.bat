@echo off
REM Pharma QA Debate Chatbot 자동 실행 스크립트 (Windows)
REM 이 파일을 더블클릭하면 모든 서버가 시작되고 브라우저가 자동으로 열립니다.

echo ============================================================
echo   Pharma QA Debate Chatbot
echo   의약품 QA 토론 챗봇 자동 시작 프로그램
echo ============================================================
echo.

REM Python이 설치되어 있는지 확인
python --version >nul 2>&1
if errorlevel 1 (
    echo [오류] Python이 설치되어 있지 않습니다.
    echo Python 3.8 이상을 설치한 후 다시 실행해주세요.
    echo 다운로드: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM start.py 실행
python start.py

pause
