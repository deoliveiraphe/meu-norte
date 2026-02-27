const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api/v1`;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('@MeuNorte:token');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        // Token expirado ou inválido — limpa sessão e redireciona ao login
        if (response.status === 401) {
            localStorage.removeItem('@MeuNorte:token');
            window.location.href = '/login';
            throw new Error('Sessão expirada. Faça login novamente.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Erro na requisição da API');
    }

    // Rotas de DELETE as vezes não retornam JSON válido
    if (response.status === 204) {
        return null;
    }

    return response.json();
}

export const api = {
    get: (endpoint: string, options?: RequestInit) => fetchWithAuth(endpoint, { ...options, method: 'GET' }),
    post: (endpoint: string, data: any, options?: RequestInit) => fetchWithAuth(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
    put: (endpoint: string, data: any, options?: RequestInit) => fetchWithAuth(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
    delete: (endpoint: string, options?: RequestInit) => fetchWithAuth(endpoint, { ...options, method: 'DELETE' }),
};
