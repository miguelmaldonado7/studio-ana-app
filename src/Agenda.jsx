import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { X } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { authFetch } from './utils/authFetch';

const locales = { 'pt-BR': ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// Converte um objeto Date para string "HH:mm"
const dateParaHora = (date) => format(date, 'HH:mm');

// Combina uma data base com uma string "HH:mm" e retorna um Date
const combinaDataHora = (dataBase, horaStr) => {
  const [horas, minutos] = horaStr.split(':').map(Number);
  const resultado = new Date(dataBase);
  resultado.setHours(horas, minutos, 0, 0);
  return resultado;
};

// Componente customizado para exibir hora + nome no calendário
const EventoCustom = ({ event }) => (
  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
    {format(event.start, 'HH:mm')} {event.title}
  </span>
);

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
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFim, setHoraFim] = useState('11:00');
  const [erroHorario, setErroHorario] = useState('');

  const formatarTelefone = (valor) => {
    const v = valor.replace(/\D/g, '');
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
        title: a.clientes?.nome || 'Cliente',
        start: new Date(a.data_hora_inicio),
        end: new Date(a.data_hora_fim),
        telefone: a.clientes?.telefone || '',
        estimativaRetorno: a.estimativa_retorno_meses || '',
        notas: a.notas || '',
      })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { carregarAgendamentos(); }, []);

  const abrirModalNovo = (slotInfo) => {
    setAgendamentoEditando(null);
    setNome(''); setTelefone(''); setEstimativa(''); setNotas('');
    setErroHorario('');
    setDataSelecionada(slotInfo.start);

    // Se o usuário clicou num slot de hora (view semana/dia), preenche os horários automaticamente
    const horaDoSlot = slotInfo.start.getHours();
    const fimDoSlot = slotInfo.end;
    const diferencaHoras = (fimDoSlot - slotInfo.start) / (1000 * 60 * 60);

    // Na view semana/dia, o slot tem horário real. Na view mês, cai em 00:00
    if (horaDoSlot === 0 && diferencaHoras >= 24) {
      // Clique na view mês — usa horário padrão
      setHoraInicio('09:00');
      setHoraFim('11:00');
    } else {
      // Clique na view semana/dia — pré-preenche com o slot clicado
      setHoraInicio(dateParaHora(slotInfo.start));
      setHoraFim(dateParaHora(slotInfo.end));
    }

    setIsModalOpen(true);
  };

  const abrirModalEditar = (evento) => {
    setAgendamentoEditando(evento);
    setNome(evento.title);
    setTelefone(evento.telefone);
    setEstimativa(evento.estimativaRetorno);
    setNotas(evento.notas);
    setErroHorario('');
    setDataSelecionada(evento.start);
    setHoraInicio(dateParaHora(evento.start));
    setHoraFim(dateParaHora(evento.end));
    setIsModalOpen(true);
  };

  const salvarAgendamento = async (e) => {
    e.preventDefault();
    setErroHorario('');

    // Validação: fim deve ser depois do início
    const inicioDate = combinaDataHora(dataSelecionada, horaInicio);
    const fimDate = combinaDataHora(dataSelecionada, horaFim);

    if (fimDate <= inicioDate) {
      setErroHorario('O horário de término deve ser depois do início.');
      return;
    }

    const pacoteDeDados = {
      nomeCliente: nome.trim(),
      telefone: telefone.trim(),
      estimativaRetorno: parseInt(estimativa) || null,
      notas: notas.trim(),
    };

    try {
      let url = `${import.meta.env.VITE_API_URL}/agendamentos`;
      let metodo = 'POST';

      if (agendamentoEditando) {
        url += `/${agendamentoEditando.id}`;
        metodo = 'PUT';
        pacoteDeDados.cliente_id = agendamentoEditando.cliente_id;
      } else {
        pacoteDeDados.dataInicio = inicioDate.toISOString();
        pacoteDeDados.dataFim = fimDate.toISOString();
      }

      const res = await authFetch(url, { method: metodo, body: JSON.stringify(pacoteDeDados) });
      if (res.ok) { setIsModalOpen(false); carregarAgendamentos(); }
    } catch (e) { console.error(e); }
  };

  const deletarAgendamento = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    try {
      const resposta = await authFetch(
        `${import.meta.env.VITE_API_URL}/agendamentos/${agendamentoEditando.id}`,
        { method: 'DELETE' }
      );
      if (resposta.ok) { setIsModalOpen(false); carregarAgendamentos(); }
    } catch (erro) { console.error('Erro ao excluir:', erro); }
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
          onSelectSlot={abrirModalNovo}
          onSelectEvent={abrirModalEditar}
          eventPropGetter={() => ({
            style: {
              backgroundColor: '#f43f5e',
              borderRadius: '4px',
              color: 'white',
              border: 'none',
              padding: '2px 5px',
            },
          })}
          components={{ event: EventoCustom }}
          date={dataCalendario}
          onNavigate={setDataCalendario}
          view={visualizacao}
          onView={setVisualizacao}
          culture="pt-BR"
          messages={{
            next: 'Próximo', previous: 'Anterior', today: 'Hoje',
            month: 'Mês', week: 'Semana', day: 'Dia', agenda: 'Lista',
          }}
          style={{ height: '100%' }}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* Cabeçalho */}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-rose-500">
                {agendamentoEditando ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-rose-50 rounded-full transition-colors">
                <X className="text-gray-400" size={22} />
              </button>
            </div>

            <form onSubmit={salvarAgendamento} className="space-y-4">

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Cliente *</label>
                <input
                  required maxLength="100"
                  value={nome} onChange={(e) => setNome(e.target.value)}
                  type="text"
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-rose-200 outline-none text-sm"
                  placeholder="Ex: Maria Silva"
                />
              </div>

              {/* Telefone + Data */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    value={telefone} onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                    type="text"
                    className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-rose-200 outline-none text-sm"
                    placeholder="(11) 90000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input
                    type="text" disabled
                    value={dataSelecionada ? format(dataSelecionada, 'dd/MM/yyyy') : ''}
                    className="w-full border border-gray-100 bg-gray-50 text-gray-500 p-2.5 rounded-lg text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Horários */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Início</label>
                    <input
                      required type="time"
                      value={horaInicio} onChange={(e) => { setHoraInicio(e.target.value); setErroHorario(''); }}
                      className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-rose-200 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Término</label>
                    <input
                      required type="time"
                      value={horaFim} onChange={(e) => { setHoraFim(e.target.value); setErroHorario(''); }}
                      className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-rose-200 outline-none text-sm"
                    />
                  </div>
                </div>
                {erroHorario && (
                  <p className="text-red-500 text-xs mt-1">{erroHorario}</p>
                )}
              </div>

              {/* Estimativa de retorno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimativa de Retorno (Meses)</label>
                <input
                  value={estimativa} onChange={(e) => setEstimativa(e.target.value)}
                  type="number" min="1" max="12"
                  className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-rose-200 outline-none text-sm"
                  placeholder="Ex: 3"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  maxLength="500"
                  value={notas} onChange={(e) => setNotas(e.target.value)}
                  rows="3"
                  className="w-full border border-gray-200 p-2.5 rounded-lg outline-none resize-none text-sm"
                  placeholder="Serviço, pagamento, observações..."
                />
              </div>

              {/* Botões */}
              <div className="flex flex-col md:flex-row gap-3 pt-2">
                {agendamentoEditando && (
                  <button
                    type="button" onClick={deletarAgendamento}
                    className="w-full md:w-1/3 bg-white hover:bg-red-50 text-red-500 font-bold py-3 rounded-lg transition-colors border border-red-200 order-2 md:order-1 text-sm"
                  >
                    Excluir
                  </button>
                )}
                <button
                  type="submit"
                  className={`w-full ${agendamentoEditando ? 'md:w-2/3' : ''} bg-rose-400 hover:bg-rose-500 text-white font-bold py-3 rounded-lg transition-colors order-1 md:order-2 text-sm`}
                >
                  {agendamentoEditando ? 'Atualizar' : 'Salvar Agendamento'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
