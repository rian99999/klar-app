@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cd /d "%~dp0"
title KLAR 앱 업데이트

echo.
echo  ========================================
echo    KLAR 앱 업데이트
echo  ========================================
echo.

echo  [1/3] 최신 코드를 받는 중...
git pull
if errorlevel 1 (
  echo.
  echo  !! 코드를 받지 못했습니다.
  echo     인터넷 연결을 확인하시고, GitHub 에서 PR 을 먼저 머지했는지 확인해 주세요.
  echo.
  pause
  exit /b 1
)
echo.

echo  [2/3] 필요한 프로그램을 설치하는 중... (처음에는 몇 분 걸립니다)
call npm install
if errorlevel 1 (
  echo.
  echo  !! 설치에 실패했습니다. 위의 메시지를 캡처해서 문의해 주세요.
  echo.
  pause
  exit /b 1
)
echo.

echo  [3/3] 비밀번호 설정 확인 중...
if exist ".env" (
  echo      이미 설정되어 있습니다. 건너뜁니다.
) else (
  echo.
  echo      앱에 들어갈 때 쓸 비밀번호를 정해 주세요.
  echo      그냥 엔터를 누르면 기본값 klar-dev 로 설정됩니다.
  echo.
  set "KLARPW="
  set /p "KLARPW=      비밀번호: "
  if "!KLARPW!"=="" set "KLARPW=klar-dev"
  >".env" echo KLAR_PASSWORD="!KLARPW!"
  >>".env" echo KLAR_SESSION_SECRET="klar-%RANDOM%%RANDOM%%RANDOM%-%RANDOM%%RANDOM%"
  echo.
  echo      저장했습니다.
)
echo.

echo  ========================================
echo    완료. 앱을 시작합니다.
echo  ========================================
echo.
timeout /t 2 /nobreak >nul
start "KLAR App Server" cmd /k "npm start"
timeout /t 4 /nobreak >nul
start "" "http://127.0.0.1:5173/"
exit /b 0
