# 인쇄용 방탈출

초등 저학년 아이용 방탈출 문제지를 A4 한 장으로 인쇄하는 사이트예요.

사이트: https://ggah1911.github.io/kids-escape-room/

## 새 회차 추가 방법
1. `rooms/01.json`을 복사해 `rooms/02.json`처럼 새 파일을 만들고 내용을 바꿔요.
2. `node tools/build.mjs`를 실행해요. 비밀번호와 거짓말 문제 해를 검사하고 `rooms/index.json`을 갱신해요.
3. 커밋하고 push하면 첫 화면에 새 회차가 나와요.
