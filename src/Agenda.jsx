import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { X } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { authFetch } from './utils/authFetch';

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function Agenda() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [eventos, setEventos] = useState([]); 
  const [dataCalendario, setDataCalendario] = useState(new Date());
  const [visualizacao, setVisualizacao] = useState('month');
  const [agendamentoEditando, setAgendamentoEditando] = useState(null);
  
  // Campos do formulário
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [estimativa, setEstimativa] = useState('');
  const [notas, setNotas] = useState('');
  const [servico, setServico] = useState(''); // NOVO: Estado do serviço

  const formatarTelefone = (valor) => {
    const v = valor.replace(/\D/g, "");
    if (v.length <= 2) return v;
    if (v.length <= 7) return `(${v.substring(0, 2)}) ${v.substring(2)}`;
    return `(${v.substring(0, 2)}) ${v.substring(2, 7)}-${v.substring(7, 11)}`;
  };

  const carregarAgendamentos = async () => {
    try {
      const resposta = await authFetch(`${import.meta.env.VITE_API_URL}/agendamentos`);
      const dadosDoBanco = await resposta.json();
      setEventos(dadosDoBanco.map(a => ({
        id: a.id,
        cliente_id: a.cliente_id,
        // NOVO: Se tiver serviço, junta com o nome. Se não, mostra só o nome.
        title: a.servico ? `${a.clientes?.nome || 'Cliente'} - ${a.servico}` : (a.clientes?.nome || 'Cliente'),
        nomePuro: a.clientes?.nome || '', // Guarda o nome puro para colocar no form ao editar
        start: new Date(a.data_hora_inicio),
        end: new Date(a.data_hora_fim),
        telefone: a.clientes?.telefone || '',
        estimativaRetorno: a.estimativa_retorno_meses || '',
        notas: a.notas || '',
        servico: a.servico || '' // Puxa o serviço do banco
      })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { carregarAgendamentos(); }, []);

  const salvarAgendamento = async (e) => {
    e.preventDefault();
    const pacoteDeDados = {
      nomeCliente: nome.trim(),
      telefone: telefone.trim(),
      estimativaRetorno: parseInt(estimativa) || null,
      notas: notas.trim(),
      servico: servico.trim() // NOVO: Envia o serviço para o backend
    };

    try {
      let url = `${import.meta.env.VITE_API_URL}/agendamentos`;
      let metodo = 'POST';

      if (agendamentoEditando) {
        url += `/${agendamentoEditando.id}`;
        metodo = 'PUT';
        pacoteDeDados.cliente_id = agendamentoEditando.cliente_id;
      } else {
        pacoteDeDados.dataInicio = dataSelecionada.toISOString();
        pacoteDeDados.dataFim = new Date(dataSelecionada.getTime() + 2 * 60 * 60 * 1000).toISOString();
      }

      const res = await authFetch(url, { method: metodo, body: JSON.stringify(pacoteDeDados) });
      if (res.ok) { setIsModalOpen(false); carregarAgendamentos(); }
    } catch (e) { console.error(e); }
  };

  const deletarAgendamento = async () => {
    if (!window.confirm("Tem certeza que deseja cancelar este agendamento?")) return;

    try {
      const resposta = await authFetch(`${import.meta.env.VITE_API_URL}/agendamentos/${agendamentoEditando.id}`, {
        method: 'DELETE' 
      });

      if (resposta.ok) {
        setIsModalOpen(false);
        carregarAgendamentos(); 
      }
    } catch (erro) {
      console.error("Erro ao excluir:", erro);
    }
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col bg-slate-50 overflow-hidden">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-rose-500">Agenda</h1>
      </div>
      
      <div className="flex-1 bg-white p-2 md:p-6 rounded-xl shadow-sm border border-rose-100 min-h-[450px]">
        <Calendar
          localizer={localizer}
          events={eventos} 
          selectable
          onSelectSlot={(s) => { 
            // NOVO: Limpa o campo de serviço ao abrir um horário novo
            setAgendamentoEditando(null); setNome(''); setTelefone(''); setEstimativa(''); setNotas(''); setServico(''); 
            setDataSelecionada(s.start); setIsModalOpen(true); 
          }}
          onSelectEvent={(e) => { 
            // NOVO: Puxa o serviço e o nome puro ao clicar para editar
            setAgendamentoEditando(e); setNome(e.nomePuro); setTelefone(e.telefone); 
            setEstimativa(e.estimativaRetorno); setNotas(e.notas); setServico(e.servico); 
            setDataSelecionada(e.start); setIsModalOpen(true); 
          }}
          eventPropGetter={() => ({ 
            style: { 
              backgroundColor: '#f43f5e', 
              borderRadius: '4px', 
              color: 'white', 
              fontSize: '11px',
              whiteSpace: 'normal', /* Permite que o texto quebre para a linha de baixo */
              wordBreak: 'break-word', /* Impede que palavras gigantes vazem para fora da caixa */
              padding: '4px', /* Dá um pequeno respiro interno para o texto não colar nas bordas */
              height: 'auto' /* Permite que a caixa cresça consoante a quantidade de texto */
            } 
          })}
          date={dataCalendario}
          onNavigate={setDataCalendario}
          view={visualizacao}
          onView={setVisualizacao}
          culture="pt-BR"
          style={{ height: '100%' }}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-rose-500">{agendamentoEditando ? 'Editar' : 'Novo'}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400" /></button>
            </div>

            <form onSubmit={salvarAgendamento} className="space-y-4">
              <input required maxLength="100" value={nome} onChange={(e) => setNome(e.target.value)} type="text" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-rose-200 outline-none" placeholder="Nome da Cliente" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={telefone} onChange={(e) => setTelefone(formatarTelefone(e.target.value))} type="text" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-rose-200 outline-none" placeholder="Telefone" />
                <input type="text" disabled value={dataSelecionada ? format(dataSelecionada, 'dd/MM/yyyy') : ''} className="w-full border p-2.5 rounded-lg bg-gray-50 text-gray-500" />
              </div>

              {/* NOVO: Campo para digitar o Serviço e Valor */}
              <div>
                <input value={servico} onChange={(e) => setServico(e.target.value)} type="text" className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-rose-200" placeholder="Serviço e Valor (Ex: Luzes R$980,00)" />
              </div>

              <input value={estimativa} onChange={(e) => setEstimativa(e.target.value)} type="number" className="w-full border p-2.5 rounded-lg outline-none" placeholder="Retorno (Meses)" />
              <textarea maxLength="500" value={notas} onChange={(e) => setNotas(e.target.value)} rows="3" className="w-full border p-2.5 rounded-lg outline-none resize-none" placeholder="Notas..."></textarea>

              <div className="flex flex-col md:flex-row gap-3 mt-6">
                {agendamentoEditando && (
                  <button 
                    type="button" 
                    onClick={deletarAgendamento}
                    className="w-full md:w-1/3 bg-white hover:bg-red-50 text-red-500 font-bold py-3 rounded-lg transition-colors border border-red-200 order-2 md:order-1"
                  >
                    Excluir
                  </button>
                )}
                
                <button 
                  type="submit" 
                  className={`w-full ${agendamentoEditando ? 'md:w-2/3' : ''} bg-rose-400 hover:bg-rose-500 text-white font-bold py-3 rounded-lg transition-colors order-1 md:order-2`}
                >
                  {agendamentoEditando ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}