from fastapi import APIRouter
from app.api.v1 import auth, lancamentos, chat, dashboard, relatorios, categorias

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticação"])
api_router.include_router(lancamentos.router, prefix="/lancamentos", tags=["Lançamentos"])
api_router.include_router(chat.router, prefix="/chat", tags=["Inteligência Artificial e Chat"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard KPIs"])
api_router.include_router(relatorios.router, prefix="/relatorios", tags=["Relatórios"])
api_router.include_router(categorias.router, prefix="/categorias", tags=["Categorias"])
