// API Base URL
const API_BASE_URL = 'http://localhost:8000';

// 전역 변수
let currentDebate = [];
let currentTopic = '';
let isDebating = false;

// 기본 프로필
const DEFAULT_COMMON_QA = `- 두 에이전트 모두 제약회사 품질보증부(QA)에서 10년 이상 근무한 전문가입니다.
- FDA, EU GMP, MFDS(식약처) 규제 및 관련 가이드라인을 준수해야 합니다.
- Validation, Cleaning Validation, CPV, APR/PQR, Change Control 등 기본 QA 시스템을 이해하고 있습니다.`;

const DEFAULT_AGENT_A = `- 전통적인 품질 시스템을 선호합니다.
- 정기적 재밸리데이션(예: 3개 배치 수행)을 기본 원칙으로 생각합니다.
- 규제기관 실사에서 '너무 공격적으로 바꾼 시스템'은 리스크라고 보는 입장입니다.
- "관행 + 문서화된 근거"를 가장 안전한 선택으로 봅니다.`;

const DEFAULT_AGENT_B = `- Risk-based, Evidence-based 접근을 선호합니다.
- ICH Q8~Q11, Q9(QRM), Q10(PQS)를 적극적으로 활용합니다.
- CPP-CQA 모니터링과 연간 품질평가를 선호합니다.
- 리소스 효율성과 지속적 개선을 중요하게 생각합니다.`;

// 페이지 로드 시
window.addEventListener('DOMContentLoaded', () => {
    // Enter 키로 전송
    document.getElementById('topic-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            startDebate();
        }
    });

    // 초기 히스토리 로드
    loadHistoryList();
    updateHistoryCount();
});

// 고급 설정 토글
function toggleAdvancedSettings() {
    const advancedSettings = document.getElementById('advanced-settings');
    advancedSettings.classList.toggle('show');
}

// 섹션 표시
function showSection(section) {
    // 모든 섹션 숨기기
    document.getElementById('debate-settings').style.display = 'none';
    document.getElementById('history-section').style.display = 'none';
    document.getElementById('settings-section').style.display = 'none';

    // 모든 버튼에서 active 클래스 제거
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // 선택된 섹션 표시
    if (section === 'debate') {
        document.getElementById('debate-settings').style.display = 'block';
        document.querySelectorAll('.nav-btn')[0].classList.add('active');
    } else if (section === 'history') {
        document.getElementById('history-section').style.display = 'block';
        document.querySelectorAll('.nav-btn')[1].classList.add('active');
        loadHistoryList();
    } else if (section === 'settings') {
        document.getElementById('settings-section').style.display = 'block';
        document.querySelectorAll('.nav-btn')[2].classList.add('active');
        updateHistoryCount();
    }
}

// LocalStorage에서 토론 기록 가져오기
function getDebateHistory() {
    const history = localStorage.getItem('debateHistory');
    return history ? JSON.parse(history) : [];
}

// LocalStorage에 토론 기록 저장
function saveDebateToHistory(topic, debateData, rounds) {
    const history = getDebateHistory();
    const newDebate = {
        id: Date.now(),
        topic: topic,
        rounds: rounds,
        debate: debateData,
        timestamp: new Date().toISOString()
    };

    history.unshift(newDebate); // 최신 토론을 맨 앞에 추가

    // 최대 50개까지만 저장
    if (history.length > 50) {
        history.pop();
    }

    localStorage.setItem('debateHistory', JSON.stringify(history));
    updateHistoryCount();
}

// 토론 기록 목록 표시
function loadHistoryList() {
    const history = getDebateHistory();
    const historyList = document.getElementById('history-list');

    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-message">저장된 토론이 없습니다.</p>';
        return;
    }

    historyList.innerHTML = '';

    history.forEach(item => {
        const date = new Date(item.timestamp);
        const formattedDate = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-item-topic">${item.topic}</div>
            <div class="history-item-info">
                <span class="history-item-date">${formattedDate}</span>
                <span class="history-item-rounds">${item.rounds} 라운드</span>
            </div>
        `;

        historyItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('history-item-delete')) {
                loadDebateFromHistory(item);
            }
        });

        historyList.appendChild(historyItem);
    });
}

// 과거 토론 불러오기
function loadDebateFromHistory(item) {
    // 새 토론 시작 섹션으로 전환
    showSection('debate');

    // 메시지 영역 초기화
    document.getElementById('messages').innerHTML = '';
    document.getElementById('welcome-screen').style.display = 'none';

    // 사용자 메시지 추가
    addMessage('user', '사용자', '', item.topic);

    // 토론 내용 표시
    item.debate.forEach(round => {
        addRoundDivider(round.round, round.roundTitle);
        addMessage('agent-a', 'QA Specialist A', '전통적 QA 접근', round.agentA);
        addMessage('agent-b', 'QA Specialist B', '근거 기반 QA 접근', round.agentB);
    });

    // 전역 변수 업데이트
    currentDebate = item.debate;
    currentTopic = item.topic;

    // 요약 버튼 표시
    document.getElementById('summary-btn').style.display = 'block';

    addMessage('system', '시스템', '', '✅ 과거 토론을 불러왔습니다!');
}

// 특정 토론 삭제
function deleteDebate(id) {
    let history = getDebateHistory();
    history = history.filter(item => item.id !== id);
    localStorage.setItem('debateHistory', JSON.stringify(history));
    loadHistoryList();
    updateHistoryCount();
}

// 모든 토론 기록 삭제
function clearAllHistory() {
    if (confirm('정말로 모든 토론 기록을 삭제하시겠습니까?')) {
        localStorage.removeItem('debateHistory');
        loadHistoryList();
        updateHistoryCount();
        alert('모든 토론 기록이 삭제되었습니다.');
    }
}

// 기본값으로 되돌리기
function resetToDefaults() {
    if (confirm('모든 설정을 기본값으로 되돌리시겠습니까?')) {
        document.getElementById('rounds').value = '3';
        document.getElementById('responseLength').value = '보통';
        document.getElementById('commonQA').value = '';
        document.getElementById('agentAProfile').value = '';
        document.getElementById('agentBProfile').value = '';
        alert('기본값으로 되돌렸습니다.');
    }
}

// 히스토리 개수 업데이트
function updateHistoryCount() {
    const history = getDebateHistory();
    const countElement = document.getElementById('history-count');
    if (countElement) {
        countElement.textContent = `${history.length}개`;
    }
}

// 주제 설정
function setTopic(topic) {
    document.getElementById('topic-input').value = topic;
    document.getElementById('topic-input').focus();
}

// 메시지 추가
function addMessage(type, name, role, content, isStreaming = false) {
    const messagesDiv = document.getElementById('messages');
    const welcomeScreen = document.getElementById('welcome-screen');

    // 웰컴 화면 숨기기
    if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const avatarClass = type === 'user' ? 'user' :
                       type === 'agent-a' ? 'agent-a' :
                       type === 'agent-b' ? 'agent-b' : 'system';

    const avatarText = type === 'user' ? '👤' :
                      type === 'agent-a' ? 'A' :
                      type === 'agent-b' ? 'B' : 'ℹ️';

    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-avatar ${avatarClass}">${avatarText}</div>
            <div>
                <div class="message-name">${name}</div>
                ${role ? `<div class="message-role">${role}</div>` : ''}
            </div>
        </div>
        <div class="message-content" id="content-${Date.now()}">
            ${isStreaming ? '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>' : content}
        </div>
    `;

    messagesDiv.appendChild(messageDiv);
    scrollToBottom();

    return messageDiv.querySelector('.message-content');
}

// 라운드 구분선 추가
function addRoundDivider(round, title) {
    const messagesDiv = document.getElementById('messages');
    const divider = document.createElement('div');
    divider.className = 'round-divider';
    divider.innerHTML = `<span class="round-badge">Round ${round} - ${title}</span>`;
    messagesDiv.appendChild(divider);
    scrollToBottom();
}

// 스크롤을 맨 아래로
function scrollToBottom() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 토론 시작
async function startDebate() {
    if (isDebating) return;

    const topic = document.getElementById('topic-input').value.trim();
    if (!topic) {
        alert('토론 주제를 입력해주세요.');
        return;
    }

    const agentAProfile = document.getElementById('agentAProfile').value.trim() || DEFAULT_AGENT_A;
    const agentBProfile = document.getElementById('agentBProfile').value.trim() || DEFAULT_AGENT_B;
    const commonQA = document.getElementById('commonQA').value.trim() || DEFAULT_COMMON_QA;
    const rounds = parseInt(document.getElementById('rounds').value);
    const responseLength = document.getElementById('responseLength').value;

    isDebating = true;
    currentTopic = topic;
    currentDebate = [];

    // 버튼 비활성화
    const sendBtn = document.getElementById('send-btn');
    sendBtn.disabled = true;

    // 사용자 메시지 추가
    addMessage('user', '사용자', '', topic);

    // 시스템 메시지
    addMessage('system', '시스템', '', `${rounds}라운드 토론을 시작합니다... AI 에이전트들이 준비 중입니다.`);

    try {
        // 스트리밍 토론 시작
        await streamDebate({
            topic,
            commonQA,
            agentAProfile,
            agentBProfile,
            rounds,
            responseLength
        });

        // 토론 완료 후 히스토리에 저장
        if (currentDebate.length > 0) {
            saveDebateToHistory(currentTopic, currentDebate, rounds);
        }

        // 요약 버튼 표시
        document.getElementById('summary-btn').style.display = 'block';

    } catch (error) {
        console.error('Error:', error);
        addMessage('system', '시스템', '', `오류 발생: ${error.message}`);
    } finally {
        isDebating = false;
        sendBtn.disabled = false;
    }
}

// 스트리밍 토론
async function streamDebate(params) {
    const response = await fetch(`${API_BASE_URL}/api/debate/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        throw new Error('토론 생성에 실패했습니다.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    let currentMessageElement = null;
    let currentAgent = null;
    let currentRound = 0;
    let currentRoundTitle = '';

    while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 마지막 불완전한 라인은 버퍼에 보관

        for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue;

            const data = line.substring(6); // 'data: ' 제거

            if (data === '[DONE]') {
                continue;
            }

            try {
                const parsed = JSON.parse(data);

                // 라운드 시작
                if (parsed.type === 'round_start') {
                    currentRound = parsed.round;
                    currentRoundTitle = parsed.title;
                    addRoundDivider(parsed.round, parsed.title);
                }
                // Agent A 시작
                else if (parsed.type === 'agent_a_start') {
                    currentAgent = 'a';
                    currentMessageElement = addMessage('agent-a', 'QA Specialist A', '전통적 QA 접근', '', true);
                    // 타이핑 인디케이터 제거
                    setTimeout(() => {
                        currentMessageElement.innerHTML = '';
                    }, 100);
                }
                // Agent B 시작
                else if (parsed.type === 'agent_b_start') {
                    currentAgent = 'b';
                    currentMessageElement = addMessage('agent-b', 'QA Specialist B', '근거 기반 QA 접근', '', true);
                    // 타이핑 인디케이터 제거
                    setTimeout(() => {
                        currentMessageElement.innerHTML = '';
                    }, 100);
                }
                // 컨텐츠 청크
                else if (parsed.type === 'content' && currentMessageElement) {
                    const content = parsed.content;
                    currentMessageElement.textContent += content;
                    scrollToBottom();
                }
                // Agent 완료
                else if (parsed.type === 'agent_complete') {
                    if (currentAgent === 'a') {
                        currentDebate.push({
                            round: currentRound,
                            roundTitle: currentRoundTitle,
                            agentA: currentMessageElement.textContent,
                            agentB: '' // 나중에 채워질 예정
                        });
                    } else if (currentAgent === 'b') {
                        const lastDebate = currentDebate[currentDebate.length - 1];
                        if (lastDebate && lastDebate.round === currentRound) {
                            lastDebate.agentB = currentMessageElement.textContent;
                        }
                    }
                    currentMessageElement = null;
                }

            } catch (e) {
                console.error('JSON parse error:', e, data);
            }
        }
    }

    addMessage('system', '시스템', '', '✅ 토론이 완료되었습니다!');
}

// 토론 요약
async function showSummary() {
    if (currentDebate.length === 0) {
        alert('토론 내용이 없습니다.');
        return;
    }

    console.log('Current debate:', currentDebate);
    console.log('Current topic:', currentTopic);

    const messageElement = addMessage('system', '시스템', '', '', true);

    try {
        const requestBody = {
            topic: currentTopic,
            debateHistory: currentDebate
        };

        console.log('Sending summary request:', requestBody);

        const response = await fetch(`${API_BASE_URL}/api/debate/summary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Summary response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Summary error:', errorData);
            throw new Error(errorData.detail || '요약 생성에 실패했습니다.');
        }

        const data = await response.json();
        console.log('Summary received:', data);
        messageElement.innerHTML = `<strong>📊 토론 요약</strong><br><br>${data.summary.replace(/\n/g, '<br>')}`;

    } catch (error) {
        console.error('Summary error:', error);
        messageElement.innerHTML = `오류: ${error.message}`;
    }
}

// 토론 리셋
function resetDebate() {
    currentDebate = [];
    currentTopic = '';
    isDebating = false;

    document.getElementById('messages').innerHTML = '';
    document.getElementById('topic-input').value = '';
    document.getElementById('welcome-screen').style.display = 'flex';
    document.getElementById('summary-btn').style.display = 'none';

    // 토론 시작 섹션으로 이동
    showSection('debate');
}
