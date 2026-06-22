import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMotorista, useHorarios, criarAgendamento } from '../hooks/useAPI';

const ORS_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjZlMzljOWUxMWUzMjQ2NzY4NTVkNTkxOTA0MTMyNjNjIiwiaCI6Im11cm11cjY0In0=';

const SERVICOS = [
  { id: 'local', label: '🚗 Corrida local', min: 2.5, max: 3.0, minimo: 25 },
  { id: 'executivo', label: '🖤 Executivo / Black', min: 3.5, max: 4.5, minimo: 35 },
  { id: 'aeroporto', label: '✈️ Aeroporto / Viagem', min: 4.0, max: 5.0, minimo: 40 },
];

function proximosDias(n = 5) {
  const dias = [];
  let atual = new Date();
  for (let i = 0; i < n; i++) dias.push(addDays(atual, i));
  return dias;
}

async function buscarSugestoes(texto) {
  if (texto.length < 3) return [];
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(texto + ' São Paulo')}&format=json&limit=5&addressdetails=1`, {
      headers: { 'Accept-Language': 'pt-BR' }
    });
    const data = await r.json();
    return data.map(d => ({ label: d.display_name.split(',').slice(0, 3).join(','), lat: parseFloat(d.lat), lon: parseFloat(d.lon) }));
  } catch { return []; }
}

async function calcularRota(origCoord, destCoord) {
  try {
    const r = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': ORS_KEY },
      body: JSON.stringify({ coordinates: [[origCoord.lon, origCoord.lat], [destCoord.lon, destCoord.lat]] })
    });
    const data = await r.json();
    const dist = data.routes[0].summary.distance / 1000;
    const dur = Math.round(data.routes[0].summary.duration / 60);
    return { km: dist.toFixed(1), min: dur };
  } catch { return null; }
}

function InputComSugestoes({ label, placeholder, value, onChange, onSelect }) {
  const [sugestoes, setSugestoes] = useState([]);
  const [aberto, setAberto] = useState(false);
  const timer = useRef(null);

  function handleChange(e) {
    onChange(e.target.value);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const s = await buscarSugestoes(e.target.value);
      setSugestoes(s);
      setAberto(s.length > 0);
    }, 500);
  }

  return (
    <div className="form-group" style={{ position: 'relative' }}>
      <label className="form-label">{label} *</label>
      <input className="form-input" value={value} onChange={handleChange} placeholder={placeholder} onBlur={() => setTimeout(() => setAberto(false), 200)} />
      {aberto && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e8e8e8', borderRadius: 10, zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {sugestoes.map((s, i) => (
            <div key={i} onClick={() => { onChange(s.label); onSelect(s); setAberto(false); }}
              style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', borderBottom: i < sugestoes.length - 1 ? '1px solid #f5f5f5' : 'none', color: '#333' }}>
              📍 {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppCliente() {
  const { slug } = useParams();
  const { motorista, loading: loadingMotorista, erro } = useMotorista(slug);

  const [step, setStep] = useState(1);
  const [diaSelecionado, setDiaSelecionado] = useState(new Date());
  const [slotSelecionado, setSlotSelecionado] = useState(null);
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', origem: '', destino: '', observacoes: '' });
  const [origemCoord, setOrigemCoord] = useState(null);
  const [destCoord, setDestCoord] = useState(null);
  const [servicoSelecionado, setServicoSelecionado] = useState(SERVICOS[0]);
  const [rota, setRota] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);
  const [erroEnvio, setErroEnvio] = useState('');

  const dataFormatada = format(diaSelecionado, 'yyyy-MM-dd');
  const { slots, loading: loadingSlots } = useHorarios(slug, dataFormatada);
  const dias = proximosDias(5);

  useEffect(() => {
    if (origemCoord && destCoord) {
      setCalculando(true);
      calcularRota(origemCoord, destCoord).then(r => {
        setRota(r);
        setCalculando(false);
      });
    }
  }, [origemCoord, destCoord]);

  function estimativa() {
    if (!rota) return null;
    const km = parseFloat(rota.km);
    const s = servicoSelecionado;
    const min = Math.max(s.minimo, km * s.min);
    const max = Math.max(s.minimo, km * s.max);
    return { min: min.toFixed(0), max: max.toFixed(0) };
  }

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
    const est = estimativa();
    try {
      const result = await criarAgendamento({
        slugMotorista: slug,
        cliente: { nome: form.nome, telefone: form.telefone, email: form.email || undefined },
        data: dataFormatada,
        horario: slotSelecionado,
        origem: form.origem,
        destino: form.destino,
        observacoes: `[${servicoSelecionado.label}]${rota ? ` ${rota.km}km ~${rota.min}min` : ''}${est ? ` R$${est.min}-${est.max}` : ''}${form.observacoes ? ' | ' + form.observacoes : ''}`
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

  const est = estimativa();

  return (
    <div className="app-container">
      <div className="hero">
        <div className="hero-badge">⭐ {motorista.avaliacao.toFixed(2)} · Motorista verificado</div>
        {motorista.foto && (
          <img src={motorista.foto} alt={motorista.nome} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: '3px solid rgba(255,255,255,0.35)', marginBottom: 12, display: 'block' }} />
        )}
        <div className="hero-name">{motorista.nome}</div>
        <div className="hero-sub">Motorista particular · São Paulo</div>
        <div className="hero-stats">
          <div className="stat-pill"><div className="stat-pill-num">{(motorista.totalViagens / 1000).toFixed(1)}k</div><div className="stat-pill-lbl">Viagens</div></div>
          <div className="stat-pill"><div className="stat-pill-num">{motorista.anosAtuando} anos</div><div className="stat-pill-lbl">Atuando</div></div>
          <div className="stat-pill"><div className="stat-pill-num">R$0</div><div className="stat-pill-lbl">Taxa serv.</div></div>
        </div>
      </div>

      <div className="step-indicator">
        <div className={`step-dot ${step > 1 ? 'done' : step === 1 ? 'active' : 'idle'}`}>{step > 1 ? '✓' : '1'}</div>
        <div className={`step-line ${step > 1 ? 'done' : ''}`}></div>
        <div className={`step-dot ${step > 2 ? 'done' : step === 2 ? 'active' : 'idle'}`}>{step > 2 ? '✓' : '2'}</div>
        <div className={`step-line ${step > 2 ? 'done' : ''}`}></div>
        <div className={`step-dot ${step === 3 ? 'done' : 'idle'}`}>{step === 3 ? '✓' : '3'}</div>
      </div>

      {step === 1 && (
        <div className="section">
          <div className="section-title">Escolha o dia</div>
          <div className="days-row">
            {dias.map(d => (
              <button key={d.toISOString()} className={`day-btn ${format(d, 'yyyy-MM-dd') === dataFormatada ? 'selected' : ''}`}
                onClick={() => { setDiaSelecionado(d); setSlotSelecionado(null); }}>
                {labelDia(d)}<small>{format(d, 'dd MMM', { locale: ptBR })}</small>
              </button>
            ))}
          </div>
          <div className="section-title">Horários disponíveis</div>
          {loadingSlots ? <div className="loading">Verificando horários...</div> : (
            <div className="slot-grid">
              {slots.map(s => (
                <div key={s.horario} className={`slot-card ${!s.disponivel ? 'ocupado' : ''} ${slotSelecionado === s.horario ? 'selected' : ''}`}
                  onClick={() => s.disponivel && setSlotSelecionado(s.horario)}>
                  <div className="slot-time">{s.horario}</div>
                  <span className={`slot-badge ${s.disponivel ? 'ok' : 'busy'}`}>{s.disponivel ? 'Disponível' : 'Ocupado'}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: '1.25rem' }}>
            <button className="btn-primary" disabled={!slotSelecionado} onClick={() => setStep(2)}>Continuar</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="section">
          <div className="section-title">Tipo de serviço</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {SERVICOS.map(s => (
              <div key={s.id} onClick={() => setServicoSelecionado(s)}
                style={{ border: `1.5px solid ${servicoSelecionado.id === s.id ? '#185FA5' : '#e8e8e8'}`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', background: servicoSelecionado.id === s.id ? '#EBF4FF' : 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111' }}>{s.label}</div>
                <div style={{ fontSize: 12, color: '#888' }}>R$ {s.min.toFixed(2)}-{s.max.toFixed(2)}/km</div>
              </div>
            ))}
          </div>

          <div className="section-title">Rota</div>
          <InputComSugestoes label="Origem" placeholder="Rua de partida, bairro..." value={form.origem}
            onChange={v => setForm(f => ({ ...f, origem: v }))} onSelect={c => setOrigemCoord(c)} />
          <InputComSugestoes label="Destino" placeholder="Rua de chegada, bairro..." value={form.destino}
            onChange={v => setForm(f => ({ ...f, destino: v }))} onSelect={c => setDestCoord(c)} />

          {calculando && <div style={{ textAlign: 'center', padding: '1rem', fontSize: 13, color: '#888' }}>🗺️ Calculando rota...</div>}

          {rota && (
            <div style={{ background: '#EBF4FF', border: '1px solid #b3d4f5', borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#185FA5', fontWeight: 500 }}>📍 {rota.km} km · ⏱ ~{rota.min} min</div>
                  {est && <div style={{ fontSize: 14, fontWeight: 600, color: '#0d3d6b', marginTop: 4 }}>Estimativa: R$ {est.min} – R$ {est.max}</div>}
                </div>
                <div style={{ fontSize: 11, color: '#888', textAlign: 'right' }}>Valor<br/>estimado</div>
              </div>
            </div>
          )}

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
            {rota && <div className="appt-detail" style={{ marginTop: 6 }}>🗺️ {rota.km} km · ~{rota.min} min</div>}
            {est && <div className="appt-detail" style={{ marginTop: 6 }}>💰 Estimativa: R$ {est.min} – R$ {est.max}</div>}
          </div>
          <button className="btn-outline" style={{ marginTop: '1rem' }} onClick={() => {
            setStep(1); setSlotSelecionado(null); setRota(null); setOrigemCoord(null); setDestCoord(null);
            setForm({ nome: '', telefone: '', email: '', origem: '', destino: '', observacoes: '' });
            setConfirmacao(null);
          }}>+ Novo agendamento</button>
        </div>
      )}
    </div>
  );
}
