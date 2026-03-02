import os
import httpx
from typing import AsyncGenerator

class GroqClient:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        if not self.api_key:
            print("AVISO: GROQ_API_KEY não encontrada no .env")

    async def generate_response(self, prompt: str, model: str = "llama-3.3-70b-versatile") -> AsyncGenerator[str, None]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.5,
            "stream": True
        }
        
        async with httpx.AsyncClient() as client:
            async with client.stream("POST", self.base_url, json=payload, headers=headers) as response:
                if response.status_code != 200:
                    error_msg = await response.aread()
                    print("ERRO GROQ:", response.status_code, error_msg)
                    yield f"Desculpe, erro {response.status_code} na API da Groq."
                    return
                    
                async for line in response.aiter_lines():
                    if line.startswith("data: ") and line != "data: [DONE]":
                        try:
                            import json
                            data = json.loads(line[6:])
                            content = data["choices"][0]["delta"].get("content", "")
                            if content:
                                yield content
                        except:
                            continue

groq_client = GroqClient()
