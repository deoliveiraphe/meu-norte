import httpx
from typing import AsyncGenerator, List, Dict, Any
from app.config import settings

class OllamaClient:
    def __init__(self):
        self.base_url = settings.OLLAMA_URL
        self.chat_model = "llama3.2"
        self.embed_model = "nomic-embed-text"

    async def generate_chat_stream(self, prompt: str, system: str = None) -> AsyncGenerator[str, None]:
        """Gera resposta em stream via API do Ollama"""
        payload = {
            "model": self.chat_model,
            "prompt": prompt,
            "stream": True
        }
        if system:
            payload["system"] = system

        async with httpx.AsyncClient() as client:
            async with client.stream("POST", f"{self.base_url}/api/generate", json=payload, timeout=60.0) as response:
                response.raise_for_status()
                async for chunk in response.aiter_lines():
                    if chunk:
                        import json
                        data = json.loads(chunk)
                        if "response" in data:
                            yield data["response"]

    async def generate_json(self, prompt: str, system: str = None) -> dict:
        """Gera resposta em formato JSON via API do Ollama"""
        payload = {
            "model": self.chat_model,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }
        if system:
            payload["system"] = system

        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.base_url}/api/generate", json=payload, timeout=60.0)
            response.raise_for_status()
            data = response.json()
            import json
            try:
                return json.loads(data.get("response", "{}"))
            except json.JSONDecodeError:
                return {}

    async def get_embedding(self, text: str) -> List[float]:
        """Gera embedding vetorial do texto (assíncrono)"""
        payload = {
            "model": self.embed_model,
            "prompt": text
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.base_url}/api/embeddings", json=payload, timeout=30.0)
            response.raise_for_status()
            return response.json().get("embedding", [])

    def get_embedding_sync(self, text: str) -> List[float]:
        """Gera embedding vetorial sincrono (para uso no Celery Worker)"""
        payload = {
            "model": self.embed_model,
            "prompt": text
        }
        with httpx.Client() as client:
            response = client.post(f"{self.base_url}/api/embeddings", json=payload, timeout=30.0)
            response.raise_for_status()
            return response.json().get("embedding", [])

ollama_client = OllamaClient()
