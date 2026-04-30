# Handover: 보리의 성경책 (Bori's Bible)

## 1. 완료된 작업 (Work Completed)
- **정적 웹앱 구조 설계**: 서버가 필요 없는 정적 호스팅(Github Pages)에 최적화된 HTML/CSS/JS 구조 설계.
- **데이터 파이프라인 구축**: 수천 개의 마크다운 성경 파일을 병합하여 `bible-basic.json`과 `bible-story.json` 두 가지 버전으로 전처리 로직 완성.
- **고령자 맞춤형 UI/UX**:
    - 눈이 편안한 다크 모드(기본) 및 고대비 라이트 모드 테마 시스템.
    - 직관적인 글자 크기 조절 기능(+, - 버튼) 및 상단 영역 고정(Sticky Header).
    - 홈 화면에서 직관적인 버전 선택(일반형/스토리형) 버튼 지원.
- **지능형 책갈피 시스템**:
    - 읽고 있는 구절 터치 시 자동 저장 및 알림 제공.
    - 홈 화면 '이어서 읽기' 버튼을 통한 자동 스크롤 연동.
- **성경 표준 정렬**: 한글 성경의 정석 순서대로 목록 자동 정렬 로직 반영.

## 2. 예정된 작업 (Next Tasks)
- **PWA(Progressive Web App) 도입**: 오프라인 상태에서도 끊김 없이 읽을 수 있는 서비스 워커(Service Worker) 적용 및 홈 화면 '앱 설치' 기능 추가.

## 3. 중요 이슈 및 데이터 업데이트 방법 (Crucial Notes)
- **데이터 업데이트 절차**:
    1. 새롭게 가공된 JSON 파일 이름을 `bible-basic.json` 또는 `bible-story.json`으로 지정합니다.
    2. 생성된 JSON 파일을 Github 저장소의 `data/` 폴더에 덮어쓰기(Overwrite) 한 후 Push하여 배포를 갱신합니다.
- **기술적 유의사항**:
    - **CORS 보안**: 로컬 테스트 시 반드시 `python3 -m http.server`를 사용해야 합니다.
    - **유니코드 정규화(NFC)**: Mac 특유의 자모 분리 현상 방지를 위해 `normalize('NFC')` 로직이 필수적으로 유지되어야 합니다.