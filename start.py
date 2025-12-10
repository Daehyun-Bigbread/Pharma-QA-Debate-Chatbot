#!/usr/bin/env python3
"""
Pharma QA Debate Chatbot 자동 실행 스크립트
이 스크립트 하나만 실행하면 모든 서버가 시작되고 브라우저가 자동으로 열립니다.
"""

import subprocess
import time
import webbrowser
import os
import sys
from pathlib import Path

def print_banner():
    """시작 배너 출력"""
    print("=" * 60)
    print("  Pharma QA Debate Chatbot")
    print("  의약품 QA 토론 챗봇 자동 시작 프로그램")
    print("=" * 60)
    print()

def check_env_file():
    """환경 변수 파일 확인"""
    env_file = Path("backend/.env")
    env_example = Path("backend/.env.example")

    if not env_file.exists():
        print("⚠️  .env 파일이 없습니다. 생성 중...")
        if env_example.exists():
            # .env.example을 .env로 복사
            with open(env_example, 'r') as f:
                content = f.read()
            with open(env_file, 'w') as f:
                f.write(content)
            print("✅ .env 파일이 생성되었습니다.")
        else:
            # 기본 .env 파일 생성
            with open(env_file, 'w') as f:
                f.write("OPENAI_API_KEY=your_openai_api_key_here\nPORT=8000\n")
            print("✅ .env 파일이 생성되었습니다.")

    # API 키 확인
    with open(env_file, 'r') as f:
        content = f.read()
        if "your_openai_api_key_here" in content or "OPENAI_API_KEY=" not in content:
            print()
            print("=" * 60)
            print("⚠️  OpenAI API 키가 설정되지 않았습니다!")
            print("=" * 60)
            print()
            print("API 키 설정 방법:")
            print("1. https://platform.openai.com/api-keys 접속")
            print("2. 'Create new secret key' 클릭하여 API 키 생성")
            print("3. backend/.env 파일을 열어서 아래와 같이 수정:")
            print("   OPENAI_API_KEY=sk-proj-여기에실제키붙여넣기")
            print()
            print("자세한 방법은 '사용법.md' 파일을 참고하세요.")
            print("=" * 60)
            print()

            response = input("지금 API 키를 입력하시겠습니까? (y/n): ").strip().lower()
            if response == 'y':
                api_key = input("OpenAI API 키를 입력하세요: ").strip()
                if api_key and api_key.startswith('sk-'):
                    # .env 파일 업데이트
                    new_content = content.replace("your_openai_api_key_here", api_key)
                    with open(env_file, 'w') as f:
                        f.write(new_content)
                    print("✅ API 키가 저장되었습니다!")
                    return True
                else:
                    print("❌ 올바른 API 키가 아닙니다. (sk-로 시작해야 합니다)")
                    return False
            else:
                print()
                print("나중에 backend/.env 파일에서 API 키를 설정한 후 다시 실행해주세요.")
                return False

    return True

def check_dependencies():
    """필요한 패키지 설치 확인"""
    print("📦 필요한 패키지 확인 중...")

    requirements_file = Path("backend/requirements.txt")
    if requirements_file.exists():
        try:
            # 필요한 패키지가 설치되어 있는지 확인
            import fastapi
            import uvicorn
            import openai
            print("✅ 모든 패키지가 설치되어 있습니다.")
            return True
        except ImportError:
            print("⚠️  필요한 패키지를 설치해야 합니다.")
            response = input("지금 설치하시겠습니까? (y/n): ").strip().lower()
            if response == 'y':
                print("설치 중... (1-2분 소요)")
                result = subprocess.run(
                    [sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"],
                    capture_output=True,
                    text=True
                )
                if result.returncode == 0:
                    print("✅ 패키지 설치 완료!")
                    return True
                else:
                    print("❌ 패키지 설치 실패:", result.stderr)
                    return False
            else:
                print()
                print("다음 명령어로 수동 설치 후 다시 실행해주세요:")
                print("  pip install -r backend/requirements.txt")
                return False
    return True

def start_backend():
    """백엔드 서버 시작"""
    print("🚀 백엔드 서버 시작 중...")
    backend_process = subprocess.Popen(
        [sys.executable, "backend/main.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    return backend_process

def start_frontend():
    """프론트엔드 서버 시작"""
    print("🌐 프론트엔드 서버 시작 중...")
    frontend_process = subprocess.Popen(
        [sys.executable, "-m", "http.server", "3000"],
        cwd="frontend",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    return frontend_process

def wait_for_server(url, max_attempts=30):
    """서버가 준비될 때까지 대기"""
    import urllib.request
    import urllib.error

    for i in range(max_attempts):
        try:
            urllib.request.urlopen(url, timeout=1)
            return True
        except (urllib.error.URLError, ConnectionRefusedError, TimeoutError):
            time.sleep(0.5)
    return False

def main():
    """메인 실행 함수"""
    print_banner()

    # 환경 변수 파일 확인
    if not check_env_file():
        print("\n프로그램을 종료합니다.")
        sys.exit(1)

    # 패키지 확인
    if not check_dependencies():
        print("\n프로그램을 종료합니다.")
        sys.exit(1)

    print()
    print("=" * 60)
    print("  서버를 시작합니다...")
    print("=" * 60)
    print()

    # 백엔드 시작
    backend_process = start_backend()
    time.sleep(2)  # 백엔드가 먼저 시작되도록 대기

    # 프론트엔드 시작
    frontend_process = start_frontend()

    print()
    print("⏳ 서버 준비 중... (최대 15초)")

    # 백엔드 서버 대기
    if wait_for_server("http://localhost:8000/health", max_attempts=30):
        print("✅ 백엔드 서버 준비 완료! (http://localhost:8000)")
    else:
        print("❌ 백엔드 서버 시작 실패")
        backend_process.terminate()
        frontend_process.terminate()
        sys.exit(1)

    # 프론트엔드 서버 대기
    if wait_for_server("http://localhost:3000", max_attempts=20):
        print("✅ 프론트엔드 서버 준비 완료! (http://localhost:3000)")
    else:
        print("❌ 프론트엔드 서버 시작 실패")
        backend_process.terminate()
        frontend_process.terminate()
        sys.exit(1)

    print()
    print("=" * 60)
    print("  🎉 모든 서버가 준비되었습니다!")
    print("=" * 60)
    print()
    print("📱 브라우저가 자동으로 열립니다...")
    print()
    print("💡 사용 안내:")
    print("  - 브라우저 주소: http://localhost:3000")
    print("  - 종료하려면: 이 창에서 Ctrl+C 누르기")
    print()
    print("=" * 60)
    print()

    # 브라우저 자동으로 열기
    time.sleep(1)
    webbrowser.open("http://localhost:3000")

    try:
        # 프로세스가 계속 실행되도록 대기
        print("서버가 실행 중입니다... (종료: Ctrl+C)")
        print()
        backend_process.wait()
    except KeyboardInterrupt:
        print("\n\n서버를 종료합니다...")
        backend_process.terminate()
        frontend_process.terminate()
        print("✅ 모든 서버가 종료되었습니다.")
        print("다시 실행하려면: python start.py")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        print("\n문제가 계속되면 '사용법.md' 파일을 참고하거나 수동으로 실행해주세요.")
        sys.exit(1)
