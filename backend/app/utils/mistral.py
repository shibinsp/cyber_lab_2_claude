import httpx
import json
from typing import List, Dict

MISTRAL_API_KEY = "CNYRMJHhgFHMJQQBqgKKNX6zjwXzFmQ0"
MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"

async def generate_quiz_questions(category: str, num_questions: int = 5, difficulty: str = "intermediate") -> List[Dict]:
    """Generate unique quiz questions using Mistral AI"""

    prompt = f"""Generate {num_questions} multiple choice questions about {category} in cybersecurity.
Difficulty level: {difficulty}

Return ONLY a valid JSON array with this exact format (no markdown, no explanation):
[
  {{
    "question": "Question text here?",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option",
    "correct_answer": "a",
    "points": 10
  }}
]

Make questions practical and scenario-based. Each question should test real cybersecurity knowledge."""

    headers = {
        "Authorization": f"Bearer {MISTRAL_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "mistral-small-latest",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.8,
        "max_tokens": 2000
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(MISTRAL_API_URL, headers=headers, json=payload)
            response.raise_for_status()

            result = response.json()
            content = result["choices"][0]["message"]["content"]

            # Clean up the response
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            questions = json.loads(content)
            return questions

    except Exception as e:
        print(f"Mistral API error: {e}")
        # Return fallback questions
        return get_fallback_questions(category, num_questions)

def get_fallback_questions(category: str, num_questions: int) -> List[Dict]:
    """Fallback questions if API fails"""

    fallback = {
        "Network Security": [
            {
                "question": "Which protocol provides secure remote access to network devices?",
                "option_a": "Telnet",
                "option_b": "SSH",
                "option_c": "FTP",
                "option_d": "HTTP",
                "correct_answer": "b",
                "points": 10
            },
            {
                "question": "What type of attack floods a network with traffic to make it unavailable?",
                "option_a": "Phishing",
                "option_b": "SQL Injection",
                "option_c": "DDoS",
                "option_d": "XSS",
                "correct_answer": "c",
                "points": 10
            }
        ],
        "Web Security": [
            {
                "question": "Which header helps prevent XSS attacks?",
                "option_a": "X-Frame-Options",
                "option_b": "Content-Security-Policy",
                "option_c": "X-Powered-By",
                "option_d": "Cache-Control",
                "correct_answer": "b",
                "points": 10
            },
            {
                "question": "What is the purpose of CSRF tokens?",
                "option_a": "Encrypt passwords",
                "option_b": "Prevent cross-site request forgery",
                "option_c": "Speed up page loading",
                "option_d": "Compress images",
                "correct_answer": "b",
                "points": 10
            }
        ],
        "Cryptography": [
            {
                "question": "Which algorithm is considered quantum-resistant?",
                "option_a": "RSA",
                "option_b": "AES",
                "option_c": "Lattice-based cryptography",
                "option_d": "DES",
                "correct_answer": "c",
                "points": 10
            },
            {
                "question": "What is the main purpose of a digital signature?",
                "option_a": "Encrypt data",
                "option_b": "Verify authenticity and integrity",
                "option_c": "Compress files",
                "option_d": "Generate passwords",
                "correct_answer": "b",
                "points": 10
            }
        ],
        "Linux Fundamentals": [
            {
                "question": "Which command shows disk usage in human-readable format?",
                "option_a": "ls -l",
                "option_b": "df -h",
                "option_c": "ps aux",
                "option_d": "top",
                "correct_answer": "b",
                "points": 10
            },
            {
                "question": "What does the chmod 600 command do?",
                "option_a": "Everyone can read and write",
                "option_b": "Owner can read and write only",
                "option_c": "Everyone can execute",
                "option_d": "No permissions",
                "correct_answer": "b",
                "points": 10
            }
        ],
        "Penetration Testing": [
            {
                "question": "What is the first phase of penetration testing?",
                "option_a": "Exploitation",
                "option_b": "Reconnaissance",
                "option_c": "Reporting",
                "option_d": "Post-exploitation",
                "correct_answer": "b",
                "points": 10
            },
            {
                "question": "Which tool is commonly used for vulnerability scanning?",
                "option_a": "Wireshark",
                "option_b": "Nessus",
                "option_c": "Notepad",
                "option_d": "Chrome",
                "correct_answer": "b",
                "points": 10
            }
        ],
        "Incident Response": [
            {
                "question": "What is the first step in incident response?",
                "option_a": "Eradication",
                "option_b": "Identification",
                "option_c": "Recovery",
                "option_d": "Lessons learned",
                "correct_answer": "b",
                "points": 10
            },
            {
                "question": "What is a IOC in cybersecurity?",
                "option_a": "Input Output Control",
                "option_b": "Indicator of Compromise",
                "option_c": "Internet Operations Center",
                "option_d": "Internal Operating Condition",
                "correct_answer": "b",
                "points": 10
            }
        ]
    }

    questions = fallback.get(category, fallback["Network Security"])
    return questions[:num_questions]
