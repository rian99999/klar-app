# KLAR App

KLAR 고객/예약/퍼스널컬러/메이크업 결과 관리 앱입니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:5173/`로 접속합니다.

## 서버 저장

`npm run dev`는 Express 서버와 Vite 화면을 함께 실행합니다. 앱 데이터는 자동으로 서버 API(`/api/state`)에 저장되며 기본 저장 파일은 아래 경로입니다.

```text
server/data/klar-db.json
```

저장 위치를 바꾸려면 `KLAR_DB_PATH` 환경 변수를 설정합니다.

운영 모드로 빌드 후 실행하려면:

```bash
npm run build
npm run start:prod
```
