import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Package, LogOut, Menu, X } from 'lucide-react'; // Ícones novos adicionados
import Agenda from './Agenda';
import Estoque from './Estoque';
import Login from './Login';
import { authFetch } from './utils/authFetch';

export default function App() {
  const [isLogado, setIsLogado] = useState(false);
  const [carregandoAuth, setCarregandoAuth] = useState(true);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false); // Novo estado para o celular

  useEffect(() => {
    const verificarSessao = async () => {
      try {
        const res = await authFetch(`${import.meta.env.VITE_API_URL}/check-auth`);
        setIsLogado(res.ok);
      } catch {
        setIsLogado(false);
      } finally {
        setCarregandoAuth(false);
      }
    };
    verificarSessao();

    const handleAuthInvalida = () => setIsLogado(false);
    window.addEventListener('auth-invalida', handleAuthInvalida);
    return () => window.removeEventListener('auth-invalida', handleAuthInvalida);
  }, []);

  const handleLogin = async (email, senha) => {
    try {
      const resposta = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify({ email, senha })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        setIsLogado(true);
      } else {
        return dados.erro || 'Erro ao tentar fazer login.';
      }
    } catch (erro) {
      console.error('Erro de rede:', erro);
      return 'Não foi possível conectar ao servidor.';
    }
  };

  const handleLogout = async () => {
    try {
      await authFetch(`${import.meta.env.VITE_API_URL}/logout`, { method: 'POST' });
    } finally {
      setIsLogado(false);
    }
  };

  // Função para fechar o menu ao clicar em um link no celular
  const fecharMenu = () => setMenuMobileAberto(false);

  const RotaProtegida = ({ children }) => {
    if (carregandoAuth) return <div className="p-8 text-center text-gray-500">Verificando segurança...</div>;
    return isLogado ? children : <Navigate to="/login" replace />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={ isLogado ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} /> } />

        <Route path="/*" element={
          <RotaProtegida>
            {/* O flex-col resolve o empilhamento no celular, md:flex-row mantém lado a lado no PC */}
            <div className="flex h-screen bg-gray-50 font-sans flex-col md:flex-row relative">
              
              {/* BARRA SUPERIOR EXCLUSIVA DO CELULAR */}
              <div className="md:hidden flex justify-between items-center bg-white p-4 border-b border-gray-200 z-50 shadow-sm">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                  <h2 className="text-lg font-bold text-rose-600">Studio Ana</h2>
                </div>
                <button 
                  onClick={() => setMenuMobileAberto(!menuMobileAberto)} 
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  {menuMobileAberto ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>

              {/* MENU LATERAL (Escondido no celular a menos que seja clicado, fixo no PC) */}
              <nav className={`
                ${menuMobileAberto ? 'flex absolute top-[65px] left-0 w-full h-[calc(100vh-65px)] z-40' : 'hidden'} 
                md:flex md:w-64 md:relative md:h-full bg-white border-r border-gray-200 flex-col transition-all
              `}>
                <div className="hidden md:flex p-6 border-b border-gray-200 items-center gap-3">
                  <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                  <div>
                    <h2 className="text-xl font-bold text-rose-600 leading-tight">Studio Ana</h2>
                    <p className="text-xs text-gray-400 mt-1">Gestão Interna</p>
                  </div>
                </div>
                
                <ul className="flex-1 p-4 space-y-2">
                  <li>
                    <Link to="/" onClick={fecharMenu} className="flex items-center gap-3 p-3 text-gray-700 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors font-medium">
                      <CalendarIcon size={20} /> Agenda
                    </Link>
                  </li>
                  <li>
                    <Link to="/estoque" onClick={fecharMenu} className="flex items-center gap-3 p-3 text-gray-700 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors font-medium">
                      <Package size={20} /> Estoque
                    </Link>
                  </li>
                </ul>

                <div className="p-4 border-t border-gray-200">
                  <button onClick={handleLogout} className="flex items-center gap-3 p-3 w-full text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium">
                    <LogOut size={20} /> Sair
                  </button>
                </div>
              </nav>

              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Agenda />} />
                  <Route path="/estoque" element={<Estoque />} />
                </Routes>
              </main>
            </div>
          </RotaProtegida>
        } />
      </Routes>
    </Router>
  );
}