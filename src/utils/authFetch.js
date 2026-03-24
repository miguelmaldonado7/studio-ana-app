// src/utils/authFetch.js
export const authFetch = async (url, options = {}) => {
  const defaultOptions = {
    // Isso instrui o browser a enviar os cookies (incluindo o HttpOnly com o JWT)
    credentials: 'include', 
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const resposta = await fetch(url, { ...defaultOptions, ...options });

  // Se o backend disser que não estamos autorizados (token inválido/expirado)
  if (resposta.status === 401) {
    // Dispara um evento global que o App.jsx vai escutar para deslogar o usuário
    window.dispatchEvent(new Event('auth-invalida'));
  }

  return resposta;
};