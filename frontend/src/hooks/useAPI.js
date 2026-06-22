import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Hook para buscar perfil do motorista
export function useMotorista(slug) {
  const [motorista, setMotorista] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!slug) return;
    axios.get(`${API}/api/motoristas/${slug}`)
      .then(r => setMotorista(r.data.motorista))
      .catch(() => setErro('Motorista não encontrado'))
      .finally(() => setLoading(false));
  }, [slug]);

  return { motorista, loading, erro };
}

// Hook para buscar horários disponíveis
export function useHorarios(slug, data) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const buscar = useCallback(() => {
    if (!slug || !data) return;
    setLoading(true);
    axios.get(`${API}/api/agendamentos/horarios/${slug}`, { params: { data } })
      .then(r => setSlots(r.data.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [slug, data]);

  useEffect(() => { buscar(); }, [buscar]);

  return { slots, loading, recarregar: buscar };
}

// Hook para buscar agendamentos do painel
export function useAgendamentos(slug) {
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  const buscar = useCallback(() => {
    if (!slug) return;
    setLoading(true);
    axios.get(`${API}/api/agendamentos/motorista/${slug}`)
      .then(r => setAgendamentos(r.data.agendamentos))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => { buscar(); }, [buscar]);

  return { agendamentos, loading, recarregar: buscar };
}

// Função para criar agendamento
export async function criarAgendamento(dados) {
  const r = await axios.post(`${API}/api/agendamentos`, dados);
  return r.data;
}

// Função para atualizar status
export async function atualizarStatus(id, status) {
  const r = await axios.patch(`${API}/api/agendamentos/${id}/status`, { status });
  return r.data;
}

// Função para buscar QR Code
export async function buscarQRCode(slug) {
  const r = await axios.get(`${API}/api/motoristas/${slug}/qrcode`);
  return r.data;
}
