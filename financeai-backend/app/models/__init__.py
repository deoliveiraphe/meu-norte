from app.db.base import Base

# Import all models here so Alembic can discover them
from app.models.user import User
from app.models.categoria import Categoria
from app.models.lancamento import Lancamento
from app.models.embedding import FinanceEmbedding
from app.models.conversa import Conversa, Mensagem
