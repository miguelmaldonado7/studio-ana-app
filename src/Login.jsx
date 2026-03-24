import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  
  // Rate limiting states
  const [tentativas, setTentativas] = useState(0);
  const [tempoBloqueio, setTempoBloqueio] = useState(0);

  useEffect(() => {
    let timer;
    if (tempoBloqueio > 0) {
      timer = setInterval(() => setTempoBloqueio(prev => prev - 1), 1000);
    } else if (tempoBloqueio === 0 && tentativas >= 3) {
      setTentativas(0); // Reseta as tentativas após o castigo
      setErro('');
    }
    return () => clearInterval(timer);
  }, [tempoBloqueio, tentativas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (tempoBloqueio > 0) return;

    const mensagemErro = await onLogin(email, senha);
    
    if (mensagemErro) {
      const novasTentativas = tentativas + 1;
      setTentativas(novasTentativas);
      setErro(mensagemErro);
      
      if (novasTentativas >= 3) {
        setTempoBloqueio(30);
        setErro('Muitas tentativas falhas. Aguarde para tentar novamente.');
      }
    }
  };

  const isBloqueado = tempoBloqueio > 0;

  return (
    <div className="min-h-screen bg-rose-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-rose-100 p-8">
        
       <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-4">
            <img 
              src="/logo.png" 
              alt="Logo Studio Ana Guilhoto" 
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Studio Ana Guilhoto</h1>
          <p className="text-gray-500 text-sm mt-1">Acesso Restrito ao Sistema</p>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input 
              required 
              disabled={isBloqueado}
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:bg-gray-100 disabled:text-gray-400" 
              placeholder="ana@studio.com" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              required 
              disabled={isBloqueado}
              type="password" 
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:bg-gray-100 disabled:text-gray-400" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isBloqueado}
            className={`w-full font-bold py-3 rounded-lg transition-colors mt-4 flex justify-center items-center gap-2 
              ${isBloqueado ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
          >
            {isBloqueado ? (
              <><Lock size={18} /> Tente novamente em {tempoBloqueio}s...</>
            ) : (
              'Entrar no Sistema'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}