# Paperlogy 폰트 넣는 곳

헤드라인 서체 **Paperlogy Black(9Black)** 파일을 이 폴더에 넣으면 자동으로 적용된다.

```
public/fonts/paperlogy/Paperlogy-9Black.woff2
```

## 왜 저장소에 직접 넣어야 하나

Paperlogy는 npm 패키지도, 구글 폰트도 아니다. 배포처(눈누 등)에서 직접 받아야 한다.

## 받는 방법

1. 눈누(<https://noonnu.cc>)에서 `Paperlogy`를 검색해 폰트 파일을 받는다.
2. `Paperlogy-9Black.ttf`(또는 `.otf`)를 웹폰트용 `woff2`로 변환한다.
   변환 도구 예: <https://transfonter.org> — 포맷에서 `WOFF2`만 선택.
3. 변환된 파일 이름을 `Paperlogy-9Black.woff2`로 맞춰 이 폴더에 넣는다.

## 파일이 없으면 어떻게 되나

`app/globals.css`의 `@font-face` 폴백에 따라 **Pretendard 900(Black)** 으로 자연스럽게 대체된다.
화면이 깨지지 않고, 헤드라인이 조금 덜 개성 있어 보일 뿐이다. 배포를 막지 않는다.

## 라이선스

Paperlogy 라이선스 조건(웹폰트 사용 허용 여부, 출처 표기 의무)을 반드시 확인하고
`docs/`에 근거를 남긴다.
