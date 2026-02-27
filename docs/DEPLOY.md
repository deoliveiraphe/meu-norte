# 🚀 Guia de Deploy Gratuito em Nuvem — Meu Norte

Este guia orienta passo a passo o deploy **100% gratuito** de toda a infraestrutura do **Meu Norte** utilizando serviços Modern Cloud (Serverless e PaaS).

A arquitetura final será dividida nos seguintes serviços:
- **Frontend (React)**: Vercel
- **Backend (FastAPI)**: Render (Web Service)
- **Background Worker (Celery)**: Render (Background Worker)
- **Banco de Dados (PostgreSQL + pgvector)**: Supabase
- **Mensageria (Redis)**: Upstash
- **AI / LLMs**: Groq (Streaming LLaMA 3) e Google Gemini API (Embeddings 768d)

---

## 1. Banco de Dados com Supabase (PostgreSQL)

O Supabase oferece um PostgreSQL gerenciado com a extensão `pgvector` pré-instalada, ideal para nossa RAG.

1. Crie uma conta no [Supabase](https://supabase.com/).
2. Clique em **"New Project"**.
3. Escolha uma senha segura para o banco de dados (guarde-a).
4. Em **Project Settings > Database**, role até a seção **Connection String** e selecione o formato **URI**.
5. Copie a URI. Ela será algo parecido com: `postgresql://postgres.[sua-ref]:[sua-senha]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`.

> **⚠️ IMPORTANTE para Asyncpg:** Como nosso backend usa a biblioteca assíncrona `asyncpg`, você precisa alterar o schema da URI do supabase de `postgresql://` para `postgresql+asyncpg://` nas suas variáveis de ambiente finais.

## 2. Mensageria com Upstash (Redis)

O Celery necessita de um corretor de mensagens (Message Broker). O Upstash oferece redis Serverless na Free Tier perfeito para tarefas agendadas e WebSocket do RAG.

1. Crie uma conta no [Upstash](https://upstash.com/).
2. Clique em **"Create Database"** na seção Redis.
3. Escolha a região mais próxima da API (EUA costuma ser melhor caso o Render suba seu Web Service por lá). Ative o TLS (opção padrão).
4. Abaixo de **Connect to your database**, role até encontrar a aba **URI**.
5. Mude a flag/biblioteca para `ioredis` ou `Python (redis-py)` e copie a string de conexão completa que começa com `rediss://`. *Atenção: o 's' duplo em rediss:// indica conexão segura SSL.*

## 3. Chaves das APIs de Inteligência Artificial

Nossa aplicação abandonou servidores locais exigentes de GPU (Ollama) para rodar a IA através de Web APIs gratuitas.

- **Groq API (O Cérebro da Inteligência/Chat):**
  - Vá em [Groq Console](https://console.groq.com/keys) e crie sua API Key (`gsk_...`).
- **Google GenAI / Gemini (Responsável por transformar textos em vetores Matemáticos):**
  - Vá em [Google AI Studio](https://aistudio.google.com/app/apikey) e crie uma chave (`AIzaSy...`).

## 4. Deploy do Backend (Render.com)

O repositório já contém um arquivo `render.yaml` na raiz do backend que descreve via IaC (Infrastructure as Code) como nosso sistema precisa subir.

1. Faça login no [Render](https://render.com/).
2. No Dashboard, clique em **New** e selecione **Blueprint**.
3. Conecte sua conta do GitHub e selecione o repositório (`deoliveiraphe/meu-norte` ou `finai-mente`).
4. Na tela de configuração das Variáveis de Ambiente, preencha as chaves:
   - `DATABASE_URL`: Cole a URL do Supabase com prefixo `postgresql+asyncpg://`.
   - `REDIS_URL`: Cole a URI de conexão segura do Upstash (`rediss://...`).
   - `SECRET_KEY`: Será gerada automaticamente e aleatoriamente pelo Render!
   - `GROQ_API_KEY`: Cole a chave gerada.
   - `GEMINI_API_KEY`: Cole a chave gerada.
5. Selecione a instância *Free* e clique em **Apply**. O Render construirá e iniciará ambos a API e o Celery Worker de forma autônoma.
6. Copie a URL do serviço final gerada pelo Render (ex: `https://meu-norte-api-xp2s.onrender.com`).

*(A primeira subida pode demorar alguns minutos. Fique de olho no log do deploy).*

> **⚠️ Criando a Primeira Conta (Migração e Seed):** Diferente do local, no cloud você deve acessar a rota administrativa do banco na sua API para preencher a primeira conta (que não estará populada e migrada no banco Supabase puro). Pelo terminal logado na Render digite `alembic upgrade head` ou faça login via painel (Swagger/Frontend).

## 5. Deploy do Frontend (Vercel)

Já que seu backend está publicado na nuvem com um link público HTTPS (Gerado pelo Render), agora subimos o projeto em React (Vite).

1. No código `.env` da pasta do frontend, altere a URL que sua aplicação usa para se comunicar com o Render.
   Mude de `http://localhost:8000/api/v1` para `https://[SUA-URL-DO-RENDER.COM]/api/v1`.
2. Commit (git commit) essa alteração e faça um push para a main do GitHub.
3. Faça login na [Vercel](https://vercel.com/) com a sua conta do GitHub.
4. Clique em **Add New... > Project**.
5. Importe o mesmo repositório do "Meu Norte".
6. Na configuração do projeto:
   - Framework Preset: **Vite**
   - Root Directory: O diretório onde está o `package.json` dependendo da forma que estruturou (se as pastas `src`/`package.json` moram no root ou estão sub alocadas).
7. Clique em **Deploy**.

O arquivo `vercel.json` na raiz da pasta que enviamos já avisará os servidores para encaminhar requisições em rotas virtuais (SPA fallback) blindando o usuário da página 404!

---

**Sucesso! 🎉 Você tem uma aplicação bancária IA robusta rodando 100% cloud de forma gratuita!**
