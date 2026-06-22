import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMotorista, useHorarios, criarAgendamento } from '../hooks/useAPI';

// Gera os próximos 5 dias úteis
function proximosDias(n = 5) {
  const dias = [];
  let atual = new Date();
  for (let i = 0; i < n; i++) {
    dias.push(addDays(atual, i));
  }
  return dias;
}

export default function AppCliente() {
  const { slug } = useParams();
  const { motorista, loading: loadingMotorista, erro } = useMotorista(slug);

  const [step, setStep] = useState(1);
  const [diaSelecionado, setDiaSelecionado] = useState(new Date());
  const [slotSelecionado, setSlotSelecionado] = useState(null);
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', origem: '', destino: '', observacoes: '' });
  const [enviando, setEnviando] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);
  const [erroEnvio, setErroEnvio] = useState('');

  const dataFormatada = format(diaSelecionado, 'yyyy-MM-dd');
  const { slots, loading: loadingSlots } = useHorarios(slug, dataFormatada);

  const dias = proximosDias(5);

  function handleForm(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function formValido() {
    return form.nome.trim() && form.telefone.trim() && form.origem.trim() && form.destino.trim();
  }

  async function handleConfirmar() {
    if (!formValido() || !slotSelecionado) return;
    setEnviando(true);
    setErroEnvio('');
    try {
      const result = await criarAgendamento({
        slugMotorista: slug,
        cliente: { nome: form.nome, telefone: form.telefone, email: form.email || undefined },
        data: dataFormatada,
        horario: slotSelecionado,
        origem: form.origem,
        destino: form.destino,
        observacoes: form.observacoes
      });
      setConfirmacao(result.agendamento);
      setStep(3);
    } catch (err) {
      setErroEnvio(err.response?.data?.erro || 'Erro ao enviar. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  if (loadingMotorista) return <div className="app-container"><div className="loading">Carregando...</div></div>;
  if (erro) return <div className="app-container"><div className="loading">⚠️ {erro}</div></div>;

  const labelDia = (d) => {
    const hoje = new Date();
    if (format(d, 'yyyy-MM-dd') === format(hoje, 'yyyy-MM-dd')) return 'Hoje';
    if (format(d, 'yyyy-MM-dd') === format(addDays(hoje, 1), 'yyyy-MM-dd')) return 'Amanhã';
    return format(d, 'EEE', { locale: ptBR }).replace('.', '');
  };

  return (
    <div className="app-container">
      {/* Hero */}
      <div className="hero">
        <div className="hero-badge">⭐ {motorista.avaliacao.toFixed(2)} · Motorista verificado</div>
        {motorista.foto && (
          <img
            src={motorista.foto}
            alt={motorista.nome}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              objectFit: 'cover',
              objectPosition: 'top',
              border: '3px solid rgba(255,255,255,0.35)',
              marginBottom: 12,
              display: 'block'
            }}
          />
        )}
        <div className="hero-name">{motorista.nome}</div>
        <div className="hero-sub">Motorista particular · São Paulo</div>
        <div className="hero-stats">
          <div className="stat-pill"><div className="stat-pill-num">{(motorista.totalViagens / 1000).toFixed(1)}k</div><div className="stat-pill-lbl">Viagens</div></div>
          <div className="stat-pill"><div className="stat-pill-num">{motorista.anosAtuando}+</div><div className="stat-pill-lbl">Anos</div></div>
          <div className="stat-pill"><div className="stat-pill-num">R$0</div><div className="stat-pill-lbl">Taxa serv.</div></div>
        </div>
      </div>

      {/* Indicador de steps */}
      <div className="step-indicator">
        <div className={`step-dot ${step > 1 ? 'done' : step === 1 ? 'active' : 'idle'}`}>{step > 1 ? '✓' : '1'}</div>
        <div className={`step-line ${step > 1 ? 'done' : ''}`}></div>
        <div className={`step-dot ${step > 2 ? 'done' : step === 2 ? 'active' : 'idle'}`}>{step > 2 ? '✓' : '2'}</div>
        <div className={`step-line ${step > 2 ? 'done' : ''}`}></div>
        <div className={`step-dot ${step === 3 ? 'done' : 'idle'}`}>{step === 3 ? '✓' : '3'}</div>
      </div>

      {/* STEP 1 — Escolher dia e horário */}
      {step === 1 && (
        <div className="section">
          <div className="section-title">Escolha o dia</div>
          <div className="days-row">
            {dias.map(d => (
              <button
                key={d.toISOString()}
                className={`day-btn ${format(d, 'yyyy-MM-dd') === dataFormatada ? 'selected' : ''}`}
                onClick={() => { setDiaSelecionado(d); setSlotSelecionado(null); }}
              >
                {labelDia(d)}
                <small>{format(d, 'dd MMM', { locale: ptBR })}</small>
              </button>
            ))}
          </div>

          <div className="section-title">Horários disponíveis</div>
          {loadingSlots ? (
            <div className="loading">Verificando horários...</div>
          ) : (
            <div className="slot-grid">
              {slots.map(s => (
                <div
                  key={s.horario}
                  className={`slot-card ${!s.disponivel ? 'ocupado' : ''} ${slotSelecionado === s.horario ? 'selected' : ''}`}
                  onClick={() => s.disponivel && setSlotSelecionado(s.horario)}
                >
                  <div className="slot-time">{s.horario}</div>
                  <span className={`slot-badge ${s.disponivel ? 'ok' : 'busy'}`}>
                    {s.disponivel ? 'Disponível' : 'Ocupado'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '1.25rem' }}>
            <button className="btn-primary" disabled={!slotSelecionado} onClick={() => setStep(2)}>
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Dados do cliente */}
      {step === 2 && (
        <div className="section">
          <div className="section-title">Seus dados</div>
          <div className="form-group">
            <label className="form-label">Nome completo *</label>
            <input className="form-input" name="nome" value={form.nome} onChange={handleForm} placeholder="Ex: Ana Paula Silva" />
          </div>
          <div className="form-group">
            <label className="form-label">WhatsApp *</label>
            <input className="form-input" name="telefone" value={form.telefone} onChange={handleForm} placeholder="(11) 99999-9999" type="tel" />
          </div>
          <div className="form-group">
            <label className="form-label">E-mail (opcional)</label>
            <input className="form-input" name="email" value={form.email} onChange={handleForm} placeholder="seuemail@gmail.com" type="email" />
          </div>
          <div className="form-group">
            <label className="form-label">Origem *</label>
            <input className="form-input" name="origem" value={form.origem} onChange={handleForm} placeholder="Endereço de partida" />
          </div>
          <div className="form-group">
            <label className="form-label">Destino *</label>
            <input className="form-input" name="destino" value={form.destino} onChange={handleForm} placeholder="Endereço de chegada" />
          </div>
          <div className="form-group">
            <label className="form-label">Observações</label>
            <input className="form-input" name="observacoes" value={form.observacoes} onChange={handleForm} placeholder="Ex: mala grande, precisa de espera..." />
          </div>
          {erroEnvio && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 12 }}>⚠️ {erroEnvio}</p>}
          <button className="btn-primary" disabled={!formValido() || enviando} onClick={handleConfirmar}>
            {enviando ? 'Enviando...' : 'Confirmar agendamento'}
          </button>
          <button className="btn-outline" onClick={() => setStep(1)}>← Voltar</button>
        </div>
      )}

      {/* STEP 3 — Confirmação */}
      {step === 3 && confirmacao && (
        <div className="section">
          <div className="alert-success" style={{ marginBottom: '1rem' }}>
            <span className="alert-success-icon">✅</span>
            <div>
              <div className="alert-success-title">Solicitação enviada!</div>
              <div className="alert-success-sub">{motorista.nome} receberá sua solicitação e confirmará em breve via WhatsApp.</div>
            </div>
          </div>
          <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
            <div className="section-title" style={{ marginBottom: 10 }}>Resumo</div>
            <div className="appt-detail">👤 {confirmacao.cliente.nome}</div>
            <div className="appt-detail" style={{ marginTop: 6 }}>📅 {format(new Date(confirmacao.data), "dd 'de' MMMM", { locale: ptBR })} às {confirmacao.horario}</div>
            <div className="appt-detail" style={{ marginTop: 6 }}>📍 {confirmacao.origem} → {confirmacao.destino}</div>
          </div>
          <div style={{ background: '#f0edff', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#4a3a9e' }}>
            💬 WhatsApp, e-mail e painel do motorista foram notificados automaticamente.
          </div>
          <button className="btn-outline" style={{ marginTop: '1rem' }} onClick={() => { setStep(1); setSlotSelecionado(null); setForm({ nome: '', telefone: '', email: '', origem: '', destino: '', observacoes: '' }); setConfirmacao(null); }}>
            + Novo agendamento
          </button>
        </div>
      )}
    </div>
  );
}
