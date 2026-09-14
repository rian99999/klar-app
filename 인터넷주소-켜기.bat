@echo off
chcp 65001 >nul
cd /d "%~dp0"
title KLAR 인터넷 주소

echo.
echo  ===============================================
echo   KLAR 인터넷 주소 만들기
echo  ===============================================
echo.
echo  이 창을 켜 두는 동안에만 주소가 살아 있습니다.
echo  창을 닫으면 주소도 사라집니다.
echo.

rem 0) 인터넷에 열기 전에 비밀번호부터 확인합니다.
findstr /b /c:"KLAR_PASSWORD" .env >nul 2>&1
if errorlevel 1 (
  echo  [멈춤] 비밀번호가 정해져 있지 않습니다.
  echo.
  echo   인터넷에 열면 주소를 아는 누구나 접속을 시도할 수 있습니다.
  echo   개발용 기본 비밀번호 그대로 여는 것은 위험합니다.
  echo.
  echo   1. 이 폴더의 .env.example 파일을 복사합니다.
  echo   2. 이름을 .env 로 바꿉니다.
  echo   3. 메모장으로 열어 KLAR_PASSWORD 를 원하는 비밀번호로 바꾸고 저장합니다.
  echo   4. 이 파일을 다시 실행합니다.
  echo.
  pause
  exit /b 1
)

rem 1) 앱 서버가 꺼져 있으면 켭니다.
curl -s -o nul http://127.0.0.1:5173/api/health
if errorlevel 1 (
  echo  [1/3] 앱 서버를 켭니다...
  start "KLAR App Server" cmd /k "npm start"
  timeout /t 6 /nobreak >nul
) else (
  echo  [1/3] 앱 서버는 이미 켜져 있습니다.
)

rem 2) 터널 프로그램을 한 번만 내려받습니다.
if not exist "cloudflared.exe" (
  echo  [2/3] 연결 프로그램을 내려받는 중... ^(처음 한 번만^)
  curl -L -o cloudflared.exe https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
  if not exist "cloudflared.exe" (
    echo.
    echo  내려받기에 실패했습니다. 인터넷 연결을 확인하고 다시 실행해 주세요.
    pause
    exit /b 1
  )
) else (
  echo  [2/3] 연결 프로그램 준비됨.
)

rem 3) 인터넷 주소를 만듭니다. 아래 trycloudflare.com 주소가 사이트 주소입니다.
echo  [3/3] 인터넷 주소를 만드는 중...
echo.
echo  잠시 뒤 아래에 나오는 https://...trycloudflare.com 주소가
echo  다른 사람도 접속할 수 있는 사이트 주소입니다.
echo.
cloudflared.exe tunnel --url http://127.0.0.1:5173
pause
