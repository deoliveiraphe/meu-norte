import asyncio
import json
import httpx
import websockets

async def test_chat():
    # Login admin
    async with httpx.AsyncClient() as client:
        response = await client.post("http://localhost:8000/api/v1/auth/login", data={"username": "admin@financeai.com", "password": "admin123"})
        if response.status_code != 200:
            print("Login failed:", response.text)
            return
        token = response.json()["access_token"]
        
        # Criar conversa
        res_conv = await client.post(
            "http://localhost:8000/api/v1/chat/conversas", 
            json={"titulo": "Teste RAG Cloud"}, 
            headers={"Authorization": f"Bearer {token}"}
        )
        conversa_id = res_conv.json()["id"]

    # Conectar ao WebSocket
    uri = f"ws://localhost:8000/api/v1/chat/ws/{conversa_id}?token={token}"
    async with websockets.connect(uri) as websocket:
        print("Conectado ao WS!")
        msg = {"message": "Resuma todos os meus lançamentos e diga o que eu paguei mais."}
        await websocket.send(json.dumps(msg))
        
        while True:
            try:
                data = await websocket.recv()
                payload = json.loads(data)
                if payload["type"] == "token":
                    print(payload["content"], end="", flush=True)
                elif payload["type"] == "done":
                    print("\n\n[Mensagem concluída]")
                    break
            except Exception as e:
                print(f"Erro no WS: {e}")
                break

if __name__ == "__main__":
    asyncio.run(test_chat())
