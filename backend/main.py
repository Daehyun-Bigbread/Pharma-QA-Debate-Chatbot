from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import asyncio
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = FastAPI(title="Pharma QA Debate Backend")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI 클라이언트 초기화
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# Pydantic 모델 정의
class DebateRequest(BaseModel):
    topic: str
    commonQA: str
    agentAProfile: str
    agentBProfile: str
    rounds: Optional[int] = 3
    responseLength: Optional[str] = "보통"
    tone: Optional[str] = "실무자 느낌"


class RoundResult(BaseModel):
    round: int
    roundTitle: str
    agentA: str
    agentB: str


class DebateResponse(BaseModel):
    success: bool
    debate: List[RoundResult]


class SummaryRequest(BaseModel):
    topic: str
    debateHistory: List[RoundResult]


class SummaryResponse(BaseModel):
    success: bool
    summary: str


# 프롬프트 생성 함수
def generate_system_prompt(common_qa: str, agent_profile: str, agent_type: str) -> str:
    agent_name = "Agent A (전통적 QA 접근)" if agent_type == "A" else "Agent B (근거 기반 QA 접근)"

    return f"""[공통 QA 조건]
{common_qa}

[{agent_name} 전용 설정]
당신은 {agent_name} 입니다.
아래 조건과 성향을 가진 QA 전문가로서 발언해야 합니다:

{agent_profile}

[대화 규칙]
- 규제를 위반하는 주장은 하지 않습니다.
- 상대방을 비난하지 말고, 논리와 근거 위주로 토론합니다.
- 실제 제약회사 QA 실무를 반영합니다.
- 모든 답변은 한국어로 작성합니다.
- FDA, EU GMP, MFDS(식약처) 규제 및 가이드라인을 근거로 활용합니다."""


# 라운드별 프롬프트 생성
def generate_round_prompt(round_number: int, total_rounds: int, response_length: str) -> str:
    length_guide = {
        "짧게": "3-4문장",
        "보통": "5-7문장",
        "길게": "8-10문장"
    }

    round_instructions = {
        1: f"Round 1 - 입장 발표: 자신의 입장을 {length_guide[response_length]}으로 개괄하여 발표하세요.",
        2: f"Round 2 - 반박: 상대방의 주장에 대해 논리적으로 반박하고, 추가 근거를 {length_guide[response_length]}으로 제시하세요.",
        3: f"Round 3 - 추가 논의: 실제 실사/감사 시나리오를 가정하여, 자신의 접근법이 어떤 장점이 있는지 {length_guide[response_length]}으로 설명하세요.",
        4: f"Round 4 - 심화 반박: 상대방의 실사/감사 시나리오에 대해 구체적인 반례나 리스크를 {length_guide[response_length]}으로 제시하세요.",
        5: f"Round 5 - 사례 분석: 실제 업계 사례나 규제 사례를 들어 자신의 주장을 {length_guide[response_length]}으로 뒷받침하세요.",
        6: f"Round 6 - 대안 제시: 상대방의 우려를 인정하면서도, 자신의 접근법을 보완하는 대안을 {length_guide[response_length]}으로 제시하세요.",
        7: f"Round 7 - 비용-편익 분석: 각 접근법의 비용, 시간, 리소스 측면에서의 장단점을 {length_guide[response_length]}으로 분석하세요.",
        8: f"Round 8 - 미래 전망: 규제 트렌드와 업계 방향성을 고려하여 장기적 관점을 {length_guide[response_length]}으로 제시하세요.",
        9: f"Round 9 - 최종 반론: 상대방의 모든 주장을 종합하여 최종 반론을 {length_guide[response_length]}으로 제시하세요.",
        10: f"Round 10 - 종합 결론: 전체 토론을 정리하고 최종 입장을 {length_guide[response_length]}으로 명확히 밝히세요."
    }

    # 10 라운드를 초과하면 심화 토론으로 계속 진행
    if round_number > 10:
        return f"Round {round_number} - 심화 토론: 이전 라운드의 논점을 더 깊이 있게 논의하고 새로운 관점을 {length_guide[response_length]}으로 제시하세요."

    return round_instructions.get(round_number, round_instructions[1])


@app.get("/health")
async def health_check():
    return {"status": "OK", "message": "Pharma QA Debate Backend is running"}


@app.post("/api/debate", response_model=DebateResponse)
async def create_debate(request: DebateRequest):
    try:
        if not request.topic:
            raise HTTPException(status_code=400, detail="토론 주제를 입력해주세요.")

        debate_history = []
        conversation_history = {
            "agentA": [],
            "agentB": []
        }

        # 각 라운드별로 토론 진행
        for round_num in range(1, request.rounds + 1):
            round_prompt = generate_round_prompt(round_num, request.rounds, request.responseLength)

            # Agent A 발언
            system_prompt_a = generate_system_prompt(request.commonQA, request.agentAProfile, "A")

            previous_b_response = ""
            if round_num > 1 and debate_history:
                previous_b_response = f"\n\n[Agent B의 이전 발언]\n{debate_history[-1]['agentB']}"

            user_prompt_a = f"""[토론 주제]
{request.topic}

[{round_num}라운드 지시사항]
{round_prompt}
{previous_b_response}

위 내용을 바탕으로 당신의 입장을 발표하세요."""

            conversation_history["agentA"].append({
                "role": "user",
                "content": user_prompt_a
            })

            response_a = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt_a},
                    *conversation_history["agentA"]
                ],
                temperature=0.7,
                max_tokens=1000
            )

            agent_a_response = response_a.choices[0].message.content
            conversation_history["agentA"].append({
                "role": "assistant",
                "content": agent_a_response
            })

            # Agent B 발언
            system_prompt_b = generate_system_prompt(request.commonQA, request.agentBProfile, "B")

            user_prompt_b = f"""[토론 주제]
{request.topic}

[{round_num}라운드 지시사항]
{round_prompt}

[Agent A의 발언]
{agent_a_response}

위 내용을 바탕으로 당신의 입장을 발표하세요."""

            conversation_history["agentB"].append({
                "role": "user",
                "content": user_prompt_b
            })

            response_b = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt_b},
                    *conversation_history["agentB"]
                ],
                temperature=0.7,
                max_tokens=1000
            )

            agent_b_response = response_b.choices[0].message.content
            conversation_history["agentB"].append({
                "role": "assistant",
                "content": agent_b_response
            })

            # 라운드 결과 저장
            debate_history.append({
                "round": round_num,
                "roundTitle": round_prompt.split(':')[0],
                "agentA": agent_a_response,
                "agentB": agent_b_response
            })

        return DebateResponse(success=True, debate=debate_history)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"토론 생성 중 오류가 발생했습니다: {str(e)}")


@app.post("/api/debate/summary", response_model=SummaryResponse)
async def create_summary(request: SummaryRequest):
    try:
        print(f"Summary request received. Topic: {request.topic}")
        print(f"Debate history length: {len(request.debateHistory) if request.debateHistory else 0}")

        if not request.debateHistory or len(request.debateHistory) == 0:
            raise HTTPException(status_code=400, detail="토론 내용이 없습니다.")

        # 토론 내용을 하나의 텍스트로 정리
        debate_text = "\n".join([
            f"Round {round.round} - {round.roundTitle}\nAgent A: {round.agentA}\nAgent B: {round.agentB}\n"
            for round in request.debateHistory
        ])

        print(f"Debate text length: {len(debate_text)}")

        summary_prompt = f"""다음은 의약품 QA 전문가 두 명의 토론 내용입니다.

[토론 주제]
{request.topic}

[토론 내용]
{debate_text}

위 토론을 다음 항목으로 요약해주세요:
1. Agent A의 핵심 논리 (3-4개 bullet points)
2. Agent B의 핵심 논리 (3-4개 bullet points)
3. 두 에이전트가 공통적으로 동의하는 규제 원칙
4. 의견이 갈리는 핵심 지점

각 항목을 명확하게 구분하여 bullet point 형식으로 정리해주세요."""

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "당신은 제약 업계 QA 토론을 객관적으로 분석하고 요약하는 중립적인 전문가입니다."
                },
                {
                    "role": "user",
                    "content": summary_prompt
                }
            ],
            temperature=0.5,
            max_tokens=1500
        )

        summary = response.choices[0].message.content

        return SummaryResponse(success=True, summary=summary)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"요약 생성 중 오류가 발생했습니다: {str(e)}")


@app.post("/api/debate/stream")
async def stream_debate(request: DebateRequest):
    """스트리밍 방식으로 토론 생성"""

    async def generate():
        try:
            if not request.topic:
                yield f"data: {json.dumps({'type': 'error', 'message': '토론 주제를 입력해주세요.'})}\n\n"
                return

            conversation_history = {
                "agentA": [],
                "agentB": []
            }

            # 각 라운드별로 토론 진행
            for round_num in range(1, request.rounds + 1):
                round_prompt = generate_round_prompt(round_num, request.rounds, request.responseLength)
                round_title = round_prompt.split(':')[0].replace(f'Round {round_num} - ', '')

                # 라운드 시작 알림
                yield f"data: {json.dumps({'type': 'round_start', 'round': round_num, 'title': round_title})}\n\n"
                await asyncio.sleep(0.1)

                # Agent A 발언
                system_prompt_a = generate_system_prompt(request.commonQA, request.agentAProfile, "A")

                previous_b_response = ""
                if round_num > 1 and len(conversation_history["agentB"]) > 0:
                    previous_b_response = f"\n\n[Agent B의 이전 발언]\n{conversation_history['agentB'][-1]['content']}"

                user_prompt_a = f"""[토론 주제]
{request.topic}

[{round_num}라운드 지시사항]
{round_prompt}
{previous_b_response}

위 내용을 바탕으로 당신의 입장을 발표하세요."""

                conversation_history["agentA"].append({
                    "role": "user",
                    "content": user_prompt_a
                })

                # Agent A 시작 알림
                yield f"data: {json.dumps({'type': 'agent_a_start'})}\n\n"
                await asyncio.sleep(0.1)

                # Agent A 스트리밍 응답
                agent_a_content = ""
                stream_a = client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": system_prompt_a},
                        *conversation_history["agentA"]
                    ],
                    temperature=0.7,
                    max_tokens=1000,
                    stream=True
                )

                for chunk in stream_a:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        agent_a_content += content
                        yield f"data: {json.dumps({'type': 'content', 'content': content})}\n\n"
                        await asyncio.sleep(0.01)

                conversation_history["agentA"].append({
                    "role": "assistant",
                    "content": agent_a_content
                })

                # Agent A 완료
                yield f"data: {json.dumps({'type': 'agent_complete', 'agent': 'a'})}\n\n"
                await asyncio.sleep(0.5)

                # Agent B 발언
                system_prompt_b = generate_system_prompt(request.commonQA, request.agentBProfile, "B")

                user_prompt_b = f"""[토론 주제]
{request.topic}

[{round_num}라운드 지시사항]
{round_prompt}

[Agent A의 발언]
{agent_a_content}

위 내용을 바탕으로 당신의 입장을 발표하세요."""

                conversation_history["agentB"].append({
                    "role": "user",
                    "content": user_prompt_b
                })

                # Agent B 시작 알림
                yield f"data: {json.dumps({'type': 'agent_b_start'})}\n\n"
                await asyncio.sleep(0.1)

                # Agent B 스트리밍 응답
                agent_b_content = ""
                stream_b = client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": system_prompt_b},
                        *conversation_history["agentB"]
                    ],
                    temperature=0.7,
                    max_tokens=1000,
                    stream=True
                )

                for chunk in stream_b:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        agent_b_content += content
                        yield f"data: {json.dumps({'type': 'content', 'content': content})}\n\n"
                        await asyncio.sleep(0.01)

                conversation_history["agentB"].append({
                    "role": "assistant",
                    "content": agent_b_content
                })

                # Agent B 완료
                yield f"data: {json.dumps({'type': 'agent_complete', 'agent': 'b'})}\n\n"
                await asyncio.sleep(0.5)

            # 완료
            yield f"data: [DONE]\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
