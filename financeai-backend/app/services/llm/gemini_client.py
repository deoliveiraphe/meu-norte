import os
from google import genai

class GeminiEmbeddingClient:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            print("AVISO: GEMINI_API_KEY não encontrada no .env")
        else:
            self.client = genai.Client(api_key=self.api_key)

    async def embed(self, text: str, model: str = "text-embedding-004") -> list[float]:
        if not self.api_key:
            # Fallback seguro para não travar o worker se não tiver API key
            return [0.0] * 768
            
        try:
            # text-embedding-004 gera vetor 768 por padrão (compatível com nosso banco)
            result = self.client.models.embed_content(
                model=model,
                contents=text,
            )
            return result.embeddings[0].values
        except Exception as e:
            print(f"Erro ao gerar embedding: {e}")
            return [0.0] * 768

gemini_client = GeminiEmbeddingClient()
