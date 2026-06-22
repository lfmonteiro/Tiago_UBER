import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAgendamentos, atualizarStatus, buscarQRCode } from '../hooks/useAPI';
import { usePush } from '../hooks/usePush';

// Slug do motorista — em produção, vem de autenticação ou localStorage
const SLUG_MOTORISTA = process.env.REACT_APP_MOTORISTA_SLUG || 'ricardo-souza';

export default function Painel() {
  const [aba, setAba] = useState('agendamentos');
  const [qrCode, setQrCode] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const { agendamentos, loading, recarregar } = useAgendamentos(SLUG_MOTORISTA);
  usePush(SLUG_MOTORISTA);

  const pendentes    = agendamentos.filter(a => a.status === 'pendente');
  const confirmados  = agendamentos.filter(a => a.status === 'confirmado');
  const hoje         = new Date().toISOString().slice(0, 10);
  const agendHoje    = agendamentos.filter(a => a.data?.slice(0, 10) === hoje);

  async function aceitar(id) {
    await atualizarStatus(id, 'confirmado');
    recarregar();
  }
  async function recusar(id) {
    await atualizarStatus(id, 'recusado');
    recarregar();
  }
  async function carregarQR() {
    setLoadingQR(true);
    const data = await buscarQRCode(SLUG_MOTORISTA);
    setQrCode(data);
    setLoadingQR(false);
  }

  return (
    <div className="app-container">
      {/* Header */}
      <div className="hero" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Painel do motorista</div>
            <div style={{ color: 'white', fontSize: 18, fontWeight: 600, marginTop: 2 }}>Tiago Moraes</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'white' }}>
            🟢 Online
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
        {['agendamentos', 'qrcode'].map(tab => (
          <button key={tab} onClick={() => { setAba(tab); if (tab === 'qrcode' && !qrCode) carregarQR(); }}
            style={{ flex: 1, padding: '12px 8px', fontSize: 13, fontWeight: 500, border: 'none', background: 'transparent', cursor: 'pointer', color: aba === tab ? '#111' : '#888', borderBottom: aba === tab ? '2px solid #111' : '2px solid transparent' }}>
            {tab === 'agendamentos' ? '📋 Agendamentos' : '📱 QR Code'}
          </button>
        ))}
      </div>

      {/* Aba Agendamentos */}
      {aba === 'agendamentos' && (
        <div>
          {/* Métricas */}
          <div className="section">
            <div className="metric-grid">
              <div className="metric-card"><div className="metric-label">Hoje</div><div className="metric-value">{agendHoje.length}</div></div>
              <div className="metric-card"><div className="metric-label">Pendentes</div><div className="metric-value">{pendentes.length}</div></div>
              <div className="metric-card"><div className="metric-label">Confirmados</div><div className="metric-value">{confirmados.length}</div></div>
              <div className="metric-card"><div className="metric-label">Total</div><div className="metric-value">{agendamentos.length}</div></div>
            </div>
          </div>

          <div className="divider" />

          {loading ? (
            <div className="loading">Carregando agendamentos...</div>
          ) : (
            <>
              {/* Pendentes */}
              {pendentes.length > 0 && (
                <div className="section">
                  <div className="section-title">Solicitações pendentes ({pendentes.length})</div>
                  {pendentes.map(a => (
                    <AgendamentoCard key={a._id} agendamento={a} onAceitar={() => aceitar(a._id)} onRecusar={() => recusar(a._id)} mostrarAcoes />
                  ))}
                </div>
              )}

              {pendentes.length > 0 && confirmados.length > 0 && <div className="divider" />}

              {/* Confirmados */}
              {confirmados.length > 0 && (
                <div className="section">
                  <div className="section-title">Confirmados</div>
                  {confirmados.map(a => (
                    <AgendamentoCard key={a._id} agendamento={a} />
                  ))}
                </div>
              )}

              {agendamentos.length === 0 && (
                <div className="loading" style={{ flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 32 }}>📭</span>
                  <span>Nenhum agendamento ainda</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Aba QR Code */}
      {aba === 'qrcode' && (
        <div className="section">
          <div style={{ textAlign: 'center', background: '#f7f7f7', borderRadius: 16, padding: '1.5rem', marginBottom: '1.25rem' }}>
            {loadingQR && <div className="loading">Gerando QR Code...</div>}
            {qrCode && (
              <>
                <img src={qrCode.qrcode} alt="QR Code" style={{ width: 200, height: 200, borderRadius: 8, margin: '0 auto 1rem', display: 'block' }} />
                <div style={{ fontWeight: 600, fontSize: 14 }}>Tiago Moraes · Motorista Particular</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Escaneie para agendar uma corrida</div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, background: 'white', border: '1px solid #e8e8e8', borderRadius: 20, padding: '5px 14px', display: 'inline-block', marginTop: 8, color: '#555' }}>
                  {qrCode.url}
                </div>
              </>
            )}
          </div>

          <div className="section-title">Como usar</div>
          {[
            ['1', 'Imprima e plastifique o QR Code'],
            ['2', 'Cole no banco traseiro do carro'],
            ['3', 'Passageiro escaneia com a câmera'],
            ['4', 'Você recebe no WhatsApp + e-mail + painel']
          ].map(([n, txt]) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
              <div style={{ width: 28, height: 28, background: '#1a1a2e', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{n}</div>
              <div style={{ fontSize: 14, color: '#333' }}>{txt}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AgendamentoCard({ agendamento: a, onAceitar, onRecusar, mostrarAcoes }) {
  const data = format(new Date(a.data), "dd 'de' MMM", { locale: ptBR });
  const statusLabel = { pendente: 'Pendente', confirmado: 'Confirmado', recusado: 'Recusado', concluido: 'Concluído' };
  const statusClass = { pendente: 'pending', confirmado: 'confirmed', recusado: 'rejected', concluido: 'rejected' };

  function abrirWhatsApp() {
    const num = '55' + a.cliente.telefone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá ${a.cliente.nome.split(' ')[0]}, tudo bem? Confirmo sua corrida em ${data} às ${a.horario}: ${a.origem} → ${a.destino}.`);
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  }

  return (
    <div className="appt-card">
      <div className="appt-header">
        <div className="appt-name">{a.cliente.nome}</div>
        <span className={`badge ${statusClass[a.status] || 'pending'}`}>{statusLabel[a.status] || a.status}</span>
      </div>
      <div className="appt-detail">📅 {data} às {a.horario}</div>
      <div className="appt-detail">📍 {a.origem} → {a.destino}</div>
      <div className="appt-detail">📱 {a.cliente.telefone}</div>
      {a.observacoes && <div className="appt-detail">💬 {a.observacoes}</div>}
      {mostrarAcoes && (
        <div className="appt-actions">
          <button className="btn-sm accept" onClick={onAceitar}>✓ Aceitar</button>
          <button className="btn-sm reject" onClick={onRecusar}>✕ Recusar</button>
          <button className="btn-sm" onClick={abrirWhatsApp}>💬 WhatsApp</button>
        </div>
      )}
    </div>
  );
}
