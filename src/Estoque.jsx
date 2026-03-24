import { useState, useEffect } from 'react';
import { Package, Trash2, Plus } from 'lucide-react';
import { authFetch } from './utils/authFetch';

export default function Estoque() {
  const [estoque, setEstoque] = useState([]);
  
  const [descricao, setDescricao] = useState('');
  const [peso, setPeso] = useState('');
  const [comprimento, setComprimento] = useState('');
  const [cor, setCor] = useState('');
  const [textura, setTextura] = useState('');
  const [erroDescricao, setErroDescricao] = useState('');

  const carregarEstoque = async () => {
    try {
      const resposta = await authFetch(`${import.meta.env.VITE_API_URL}/estoque`);
      if(!resposta.ok) return;
      const dados = await resposta.json();
      setEstoque(dados);
    } catch (erro) {
      console.error("Erro ao carregar estoque:", erro);
    }
  };

  useEffect(() => {
    carregarEstoque();
  }, []);

  const adicionarPeca = async (e) => {
    e.preventDefault();
    setErroDescricao('');
    
    if (descricao.length > 100) {
      setErroDescricao("A descrição deve ter no máximo 100 caracteres.");
      return;
    }

    const pacoteDeDados = {
      descricao: descricao.trim(),
      peso_gramas: parseFloat(peso),
      comprimento_cm: parseInt(comprimento),
      cor: cor.trim(),
      textura: textura.trim()
    };

    try {
      const resposta = await authFetch(`${import.meta.env.VITE_API_URL}/estoque`, {
        method: 'POST',
        body: JSON.stringify(pacoteDeDados)
      });

      if (resposta.ok) {
        setDescricao(''); setPeso(''); setComprimento(''); setCor(''); setTextura('');
        carregarEstoque(); 
      }
    } catch (erro) {
      console.error("Erro ao adicionar peça:", erro);
    }
  };

  const deletarPeca = async (id) => {
    const confirmar = window.confirm("Confirmar a remoção desta peça?");
    if (!confirmar) return;

    try {
      const resposta = await authFetch(`${import.meta.env.VITE_API_URL}/estoque/${id}`, {
        method: 'DELETE'
      });

      if (resposta.ok) {
        carregarEstoque();
      }
    } catch (erro) {
      console.error("Erro ao deletar:", erro);
    }
  };

 return (
    <div className="p-4 md:p-8 h-full flex flex-col bg-slate-50 overflow-auto">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-rose-500">Controle de Estoque</h1>
        <p className="text-sm md:text-base text-gray-500 mt-1 md:mt-0">Cadastre novas peças de Mega Hair ou dê baixa nas utilizadas.</p>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-rose-100 mb-6 md:mb-8">
        <h2 className="text-base md:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Plus size={20} className="text-rose-500" /> Dar Entrada em Novo Lote
        </h2>
        
        {/* Ajuste: sm:grid-cols-2 ajuda em celulares em pé/deitados */}
        <form onSubmit={adicionarPeca} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
          <div className="sm:col-span-2 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Origem *</label>
            <input required maxLength="100" value={descricao} onChange={(e) => setDescricao(e.target.value)} type="text" className={`w-full border ${erroDescricao ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-rose-200'} rounded-lg p-2.5 focus:outline-none focus:ring-2 text-sm`} placeholder="Ex: Lote de x fornecedor" />
            {erroDescricao && <span className="absolute -bottom-5 left-0 text-red-500 text-xs">{erroDescricao}</span>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Peso (g) *</label>
            <input required value={peso} onChange={(e) => setPeso(e.target.value)} type="number" step="0.1" min="0" className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm" placeholder="Ex: 150" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho (cm) *</label>
            <input required value={comprimento} onChange={(e) => setComprimento(e.target.value)} type="number" min="0" className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm" placeholder="Ex: 60" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor / Tom *</label>
            <input required value={cor} onChange={(e) => setCor(e.target.value)} type="text" className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm" placeholder="Ex: Castanho Escuro" />
          </div>

          <div className="sm:col-span-2 md:col-span-1">
            <button type="submit" className="w-full bg-rose-400 hover:bg-rose-500 text-white font-bold py-2.5 rounded-lg transition-colors text-sm">
              Adicionar
            </button>
          </div>
        </form>
      </div>

      <h2 className="text-base md:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Package size={20} className="text-rose-500" /> Peças Disponíveis ({estoque.length})
      </h2>
      
      {estoque.length === 0 ? (
        <div className="text-center py-10 bg-white border border-dashed border-gray-300 rounded-xl text-gray-500">
          Nenhuma peça de mega hair no estoque atualmente.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {estoque.map((peca) => (
            <div key={peca.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-rose-300 transition-colors relative group">
              <button onClick={() => deletarPeca(peca.id)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity" title="Dar baixa nesta peça">
                <Trash2 size={20} />
              </button>
              <h3 className="font-bold text-gray-800 mb-2 pr-6 truncate">{peca.descricao}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-semibold text-gray-800">Peso:</span> {peca.peso_gramas}g</p>
                <p><span className="font-semibold text-gray-800">Comprimento:</span> {peca.comprimento_cm}cm</p>
                <p><span className="font-semibold text-gray-800">Cor:</span> {peca.cor}</p>
                {peca.textura && <p><span className="font-semibold text-gray-800">Textura:</span> {peca.textura}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}