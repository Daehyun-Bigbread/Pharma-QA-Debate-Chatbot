# Pharma QA Debate Chatbot

의약품 품질보증(QA) 전문가 2명이 규제 프레임워크 안에서 서로 다른 관점으로 **실시간 스트리밍**으로 토론하는 대화형 챗봇 시스템입니다.

## 🎯 개요

이 프로젝트는 제약회사 QA 조직 내부의 교육, 토론, 워크숍용 도구로 활용할 수 있으며, "전통적 방식"과 "근거 기반 개선" 사이의 규제 해석 및 실무적 고민을 시뮬레이션합니다.

### ⭐ 주요 기능

- **실시간 스트리밍 답변**: ChatGPT처럼 답변이 실시간으로 타이핑되며 생성됩니다
- **채팅 UI**: 깔끔한 채팅 인터페이스로 토론을 쉽게 확인
- **두 개의 AI 에이전트**: 전통적 QA 접근 vs 근거 기반 QA 접근
- **커스터마이징 가능한 에이전트**: 각 에이전트의 성향과 조건을 사용자가 직접 설정
- **다중 라운드 토론**: 2-10 라운드까지 설정 가능
- **토론 요약 기능**: AI가 토론 내용을 객관적으로 분석하고 요약
- **실무 중심**: FDA, EU GMP, MFDS 규제 및 가이드라인 기반

## 기술 스택

### 백엔드
- Python 3.8+
- FastAPI (StreamingResponse 사용)
- OpenAI API (GPT-4 streaming)

### 프론트엔드
- HTML5
- CSS3
- Vanilla JavaScript (Fetch API streaming)

## 🚀 빠른 시작 (초보자용 - 추천!)

개발을 잘 모르시는 분들을 위한 **가장 쉬운 방법**입니다!

### 1단계: OpenAI API 키 준비
1. https://platform.openai.com/api-keys 접속
2. "Create new secret key" 클릭하여 API 키 생성
3. 생성된 키 복사 (sk-로 시작)

### 2단계: 프로그램 실행

**Windows 사용자:**
- 프로젝트 폴더에서 `start.bat` 파일을 **더블클릭**

**Mac/Linux 사용자:**
```bash
python start.py
```

### 3단계: 완료!
- 자동으로 필요한 패키지 설치 확인
- 자동으로 백엔드/프론트엔드 서버 시작
- 자동으로 브라우저 열림 → 바로 사용 가능! 🎉

**종료 방법:** 터미널에서 `Ctrl + C`

---

## 설치 방법 (수동 설치)

### 1. 저장소 클론

```bash
git clone https://github.com/yourusername/Pharma-QA-Debate-Chatbot.git
cd Pharma-QA-Debate-Chatbot
```

### 2. 백엔드 설정

```bash
cd backend

# Python 가상환경 생성 (선택사항이지만 권장)
python -m venv venv

# 가상환경 활성화
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# 필요한 패키지 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
```

`.env` 파일을 열어서 OpenAI API 키를 입력하세요:

```
OPENAI_API_KEY=your_actual_openai_api_key_here
PORT=8000
```

### 3. OpenAI API 키 발급

1. [OpenAI 웹사이트](https://platform.openai.com/)에 가입/로그인
2. API Keys 섹션으로 이동
3. "Create new secret key" 클릭
4. 생성된 키를 복사하여 `.env` 파일에 붙여넣기

## 실행 방법 (수동 실행)

### 1. 백엔드 서버 실행

```bash
cd backend
python main.py
```

서버가 `http://localhost:8000`에서 실행됩니다.

### 2. 프론트엔드 실행

새로운 터미널 창을 열고:

```bash
cd frontend
# 간단한 HTTP 서버 실행 (Python 3)
python -m http.server 3000
```

### 3. 브라우저에서 접속

브라우저에서 `http://localhost:3000`으로 접속하세요.

---

## 🎮 사용 방법

### 1. 토론 주제 입력

하단 입력창에 토론하고 싶은 QA 관련 주제를 입력합니다.

**예시:**
- "정기적 재밸리데이션에서 3 batch 수행이 필수적인가?"
- "Cleaning Validation의 worst-case 선정 기준은?"
- "CPV와 연간 품질평가만으로 재밸리데이션을 대체할 수 있는가?"

또는 초기 화면의 예시 주제를 클릭하면 자동으로 입력됩니다.

### 2. 토론 설정 (왼쪽 사이드바)

#### 기본 설정:
- **라운드 수**: 2-10 라운드 선택 (기본 3 라운드 권장)
- **발언 길이**: 짧게/보통/길게

#### 고급 설정 (선택):
- **공통 QA 조건**: 두 에이전트의 공통 배경
- **Agent A 성향**: 전통적 QA 접근 성향
- **Agent B 성향**: 근거 기반 QA 접근 성향

비워두면 기본값이 자동으로 적용됩니다.

### 3. 토론 시작

- 전송 버튼(▶️) 클릭 또는 Enter 키
- ChatGPT처럼 답변이 **실시간으로 타이핑되며 생성**됩니다!
- 각 라운드마다 Agent A, Agent B가 순서대로 발언

### 4. 토론 진행

- **Agent A** (빨간색): 전통적 QA 접근
- **Agent B** (파란색): 근거 기반 QA 접근
- 라운드별로 구분되어 표시
- 실시간으로 답변이 생성되는 것을 확인 가능

### 5. 토론 요약

토론 완료 후 우측 상단의 "📊 요약" 버튼을 클릭하여:
- Agent A의 핵심 논리
- Agent B의 핵심 논리
- 공통 규제 원칙
- 의견 차이점

---

## 프로젝트 구조

```
Pharma-QA-Debate-Chatbot/
├── backend/
│   ├── main.py              # FastAPI 서버 (스트리밍 지원)
│   ├── requirements.txt     # Python 패키지 의존성
│   ├── .env.example         # 환경 변수 예시
│   └── .env                 # 환경 변수 (생성 필요)
├── frontend/
│   ├── index.html           # 채팅 UI 메인 파일
│   ├── css/
│   │   └── style.css        # 채팅 스타일시트
│   └── js/
│       └── app.js           # 스트리밍 로직
├── start.py                 # 자동 실행 스크립트 (Mac/Linux)
├── start.bat                # 자동 실행 스크립트 (Windows)
├── requirements.md          # 프로젝트 요구사항 문서
├── 사용법.md                # 상세 사용 가이드
├── 시작하기.txt             # 빠른 시작 가이드
└── README.md               # 이 파일
```

## 📊 라운드별 주제 (2-10 라운드)

1. **Round 1** - 입장 발표: 기본 입장 개괄
2. **Round 2** - 반박: 상대방 주장에 대한 논리적 반박
3. **Round 3** - 추가 논의: 실사/감사 시나리오 기반 논의
4. **Round 4** - 심화 반박: 구체적인 반례나 리스크 제시
5. **Round 5** - 사례 분석: 실제 업계/규제 사례 제시
6. **Round 6** - 대안 제시: 상대방 우려를 반영한 대안
7. **Round 7** - 비용-편익 분석: 비용, 시간, 리소스 분석
8. **Round 8** - 미래 전망: 규제 트렌드와 장기 전망
9. **Round 9** - 최종 반론: 모든 주장을 종합한 최종 반론
10. **Round 10** - 종합 결론: 전체 토론 정리 및 최종 입장

## API 엔드포인트

### POST /api/debate/stream (NEW!)
실시간 스트리밍 방식으로 토론 생성

**특징:**
- Server-Sent Events (SSE) 방식
- ChatGPT처럼 실시간 타이핑 효과
- 각 토큰이 생성되는 즉시 전송

### POST /api/debate
일반 방식 토론 생성 (레거시)

### POST /api/debate/summary
토론 요약 생성

## 주의사항

- OpenAI API 사용 시 비용이 발생할 수 있습니다. GPT-4 모델 사용 시 특히 주의하세요.
- 스트리밍 방식이므로 실시간으로 API 호출이 발생합니다.
- API 키는 절대 공개 저장소에 커밋하지 마세요.
- `.env` 파일은 `.gitignore`에 포함되어 있습니다.

## 💰 예상 비용

| 라운드 | 예상 시간 | 예상 비용 |
|--------|-----------|-----------|
| 2-3 라운드 | 1-2분 | $0.5-1 |
| 3-5 라운드 | 2-4분 | $1-2 |
| 6-8 라운드 | 5-7분 | $2-4 |
| 9-10 라운드 | 8-10분 | $3-5 |

## 트러블슈팅

### CORS 오류가 발생하는 경우
백엔드 서버가 제대로 실행되고 있는지 확인하세요.

### API 키 오류가 발생하는 경우
1. `.env` 파일에 올바른 OpenAI API 키가 입력되었는지 확인
2. API 키에 충분한 크레딧이 있는지 확인
3. 백엔드 서버를 재시작

### 스트리밍이 끊기는 경우
- 인터넷 연결 확인
- 방화벽 설정 확인
- 백엔드 서버 로그 확인

### 토론 생성이 느린 경우
GPT-4 모델은 응답 생성에 시간이 걸릴 수 있습니다. 스트리밍 방식이므로 기다리는 동안 실시간으로 답변을 볼 수 있습니다.

## 향후 개선 사항

- [x] 실시간 스트리밍 답변
- [x] 채팅 UI 개선
- [x] 10 라운드까지 확장
- [ ] 토론 히스토리 저장
- [ ] 주제 템플릿 제공
- [ ] 3명 토론 모드 (중립 조정자 추가)
- [ ] SOP 초안 생성 기능
- [ ] 더 다양한 AI 모델 지원

## 라이선스

MIT License

## 기여

이슈와 풀 리퀘스트는 언제나 환영합니다!

## 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**🎉 ChatGPT처럼 실시간으로 생성되는 QA 토론을 즐겨보세요!**
