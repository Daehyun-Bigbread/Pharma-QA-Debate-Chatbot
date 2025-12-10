// API Base URL
const API_BASE_URL = 'http://localhost:8000';

// 전역 변수
let currentDebate = null;
let currentTopic = '';

// 기본 공통 QA 설정
const DEFAULT_COMMON_QA = `- 두 에이전트 모두 제약회사 품질보증부(QA)에서 10년 이상 근무한 전문가입니다.
- FDA, EU GMP, MFDS(식약처) 규제 및 관련 가이드라인을 준수해야 합니다.
- Validation, Cleaning Validation, CPV, APR/PQR, Change Control 등 기본 QA 시스템을 이해하고 있습니다.
- 규제를 위반하는 것이 아니라, 같은 규정을 다른 관점에서 해석하고 적용 전략을 제시합니다.`;

// 기본 에이전트 프로필
const DEFAULT_AGENT_A = `- 전통적인 품질 시스템을 선호합니다.
- 정기적 재밸리데이션(예: 3개 배치 수행)을 기본 원칙으로 생각합니다.
- 규제기관 실사에서 '너무 공격적으로 바꾼 시스템'은 리스크라고 보는 입장입니다.
- "관행 + 문서화된 근거"를 가장 안전한 선택으로 봅니다.
- "만약 문제가 생겼을 때 규제기관이 어떻게 볼 것인가"를 중요하게 생각합니다.`;

const DEFAULT_AGENT_B = `- Risk-based, Evidence-based 접근을 선호합니다.
- ICH Q8~Q11, Q9(QRM), Q10(PQS)와 FDA Process Validation Guidance의 "Lifecycle approach"를 적극적으로 활용합니다.
- 고정적으로 배치를 재밸리데이션 하는 것보다, CPP-CQA 모니터링 및 CPV/연간 품질평가로 공정 적합성을 확인하는 것이 합리적이라고 봅니다.
- 통계적 공정관리, 트렌드 분석, Cpk, OOS/OOT 데이터 등을 활용합니다.
- 리소스 효율성과 품질시스템의 민첩성(agility)도 함께 중요하게 생각합니다.`;

// 페이지 로드 시 기본값 설정
window.addEventListener('DOMContentLoaded', () => {
    // 기본 프로필 설정
    document.getElementById('agentAProfile').value = DEFAULT_AGENT_A;
    document.getElementById('agentBProfile').value = DEFAULT_AGENT_B;
});

// 기본 QA 설정 불러오기
function loadDefaultCommonQA() {
    document.getElementById('commonQA').value = DEFAULT_COMMON_QA;
}

// 섹션 토글
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const btn = section.previousElementSibling;

    if (section.classList.contains('show')) {
        section.classList.remove('show');
        btn.classList.remove('active');
    } else {
        section.classList.add('show');
        btn.classList.add('active');
    }
}

// 토론 시작
async function startDebate() {
    const topic = document.getElementById('topic').value.trim();
    const agentAProfile = document.getElementById('agentAProfile').value.trim();
    const agentBProfile = document.getElementById('agentBProfile').value.trim();

    if (!topic) {
        alert('토론 주제를 입력해주세요.');
        return;
    }

    if (!agentAProfile) {
        alert('Agent A의 성향을 입력해주세요.');
        return;
    }

    if (!agentBProfile) {
        alert('Agent B의 성향을 입력해주세요.');
        return;
    }

    const commonQA = document.getElementById('commonQA').value.trim() || DEFAULT_COMMON_QA;
    const rounds = parseInt(document.getElementById('rounds').value);
    const responseLength = document.getElementById('responseLength').value;
    const tone = document.getElementById('tone').value;

    // UI 업데이트
    document.getElementById('input-section').classList.add('hidden');
    document.getElementById('loading-section').classList.remove('hidden');
    document.getElementById('debate-section').classList.add('hidden');

    currentTopic = topic;

    try {
        const response = await fetch(`${API_BASE_URL}/api/debate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic,
                commonQA,
                agentAProfile,
                agentBProfile,
                rounds,
                responseLength,
                tone
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || '토론 생성에 실패했습니다.');
        }

        const data = await response.json();
        currentDebate = data.debate;

        // 토론 결과 표시
        displayDebate(data.debate);

        // UI 업데이트
        document.getElementById('loading-section').classList.add('hidden');
        document.getElementById('debate-section').classList.remove('hidden');

        // 토론 섹션으로 스크롤
        document.getElementById('debate-section').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loading-section').classList.add('hidden');
        document.getElementById('input-section').classList.remove('hidden');

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = `오류: ${error.message}`;
        document.getElementById('input-section').appendChild(errorDiv);

        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// 토론 표시
function displayDebate(debate) {
    const debateContent = document.getElementById('debate-content');
    debateContent.innerHTML = '';

    debate.forEach((round, index) => {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'round-container';

        roundDiv.innerHTML = `
            <div class="round-title">
                <h3>Round ${round.round} - ${round.roundTitle}</h3>
            </div>
            <div class="debate-messages">
                <div class="message agent-a">
                    <div class="message-header">
                        <div class="agent-icon">A</div>
                        <div>
                            <div class="agent-name">QA Specialist A</div>
                            <div class="agent-role">전통적 QA 접근</div>
                        </div>
                    </div>
                    <div class="message-content">${escapeHtml(round.agentA)}</div>
                </div>
                <div class="message agent-b">
                    <div class="message-header">
                        <div class="agent-icon">B</div>
                        <div>
                            <div class="agent-name">QA Specialist B</div>
                            <div class="agent-role">근거 기반 QA 접근</div>
                        </div>
                    </div>
                    <div class="message-content">${escapeHtml(round.agentB)}</div>
                </div>
            </div>
        `;

        debateContent.appendChild(roundDiv);
    });
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 토론 요약 표시
async function showSummary() {
    if (!currentDebate || currentDebate.length === 0) {
        alert('토론 내용이 없습니다.');
        return;
    }

    const summarySection = document.getElementById('summary-section');
    const summaryContent = document.getElementById('summary-content');
    const summaryLoading = document.getElementById('summary-loading');

    // UI 업데이트
    summarySection.classList.remove('hidden');
    summaryLoading.style.display = 'block';
    summaryContent.style.display = 'none';
    summaryContent.innerHTML = '';

    // 요약 섹션으로 스크롤
    summarySection.scrollIntoView({ behavior: 'smooth' });

    try {
        const response = await fetch(`${API_BASE_URL}/api/debate/summary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topic: currentTopic,
                debateHistory: currentDebate
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || '요약 생성에 실패했습니다.');
        }

        const data = await response.json();

        // 요약 표시
        summaryContent.textContent = data.summary;
        summaryLoading.style.display = 'none';
        summaryContent.style.display = 'block';

    } catch (error) {
        console.error('Error:', error);
        summaryLoading.style.display = 'none';
        summaryContent.style.display = 'block';
        summaryContent.innerHTML = `<div class="error-message">오류: ${error.message}</div>`;
    }
}

// 요약 닫기
function closeSummary() {
    document.getElementById('summary-section').classList.add('hidden');
}

// 토론 리셋
function resetDebate() {
    currentDebate = null;
    currentTopic = '';

    // UI 리셋
    document.getElementById('debate-section').classList.add('hidden');
    document.getElementById('summary-section').classList.add('hidden');
    document.getElementById('input-section').classList.remove('hidden');

    // 입력 섹션으로 스크롤
    document.getElementById('input-section').scrollIntoView({ behavior: 'smooth' });
}
