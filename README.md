# KLAR App

KLAR 고객/예약/퍼스널컬러/메이크업 결과 관리 앱입니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:5173/`로 접속합니다.

## 접속 비밀번호 (필수)

앱 전체가 서버 로그인 뒤에 있습니다. 아래 환경 변수를 **배포 환경에 반드시 설정**해야 하며,
설정하지 않으면 운영 모드에서 서버가 시작되지 않습니다.

| 변수 | 필수 | 설명 |
| --- | --- | --- |
| `KLAR_PASSWORD` | 필수 | 스태프 접속 비밀번호 |
| `KLAR_ADMIN_PASSWORD` | 선택 | 관리자 비밀번호. 설정하지 않으면 `KLAR_PASSWORD`와 동일하게 동작합니다 |
| `KLAR_SESSION_SECRET` | 권장 | 세션 서명 키. 없으면 서버를 재시작할 때마다 로그인이 풀립니다 |

```bash
KLAR_PASSWORD='...' KLAR_SESSION_SECRET='...' npm run start:prod
```

`npm run dev`는 비밀번호를 설정하지 않으면 개발용 `klar-dev`를 사용하고 경고를 출력합니다.

비밀번호는 서버에만 있으며 프런트엔드 번들에 포함되지 않습니다. 예전의
`VITE_ADMIN_PASSCODE` 방식은 값이 빌드 결과물에 그대로 박혀 누구나 볼 수 있었기 때문에
더 이상 사용하지 않습니다.

## 고객 결과지

`/result/:customerId`만 로그인 없이 열립니다. 고객이 이름과 연락처 뒷 4자리를 입력하면
서버가 대조한 뒤 **해당 고객의 기록과 진단 톤에 맞는 제품만** 내려줍니다. 다른 고객의
정보는 응답에 포함되지 않습니다.

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
