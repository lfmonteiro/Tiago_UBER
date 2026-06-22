const axios = require('axios');

const BASE_URL = process.env.EVOLUTION_API_URL;
const API_KEY  = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE;

// Formata número para o padrão Evolution API (55 + DDD + número, sem caracteres)
function formatarNumero(telefone) {
  return '55' + telefone.replace(/\D/g, '');
}

// Envia texto simples
async function enviarMensagem(para, texto) {
  try {
    const response = await axios.post(
      `${BASE_URL}/message/sendText/${INSTANCE}`,
      {
        number: formatarNumero(para),
        options: { delay: 1000 },
        textMessage: { text: texto }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        }
      }
    );
    console.log(`✅ WhatsApp enviado para ${para}`);
    return { sucesso: true, data: response.data };
  } catch (error) {
    console.error('❌ Erro ao enviar WhatsApp:', error.response?.data || error.message);
    return { sucesso: false, erro: error.message };
  }
}

// Notificação para o MOTORISTA quando chega novo agendamento
async function notificarMotoristaNovoPedido(motorista, agendamento) {
  const data = new Date(agendamento.data).toLocaleDateString('pt-BR');
  const texto = `🚗 *Novo agendamento solicitado!*

👤 *Cliente:* ${agendamento.cliente.nome}
📱 *WhatsApp:* ${agendamento.cliente.telefone}
📅 *Data:* ${data} às ${agendamento.horario}
📍 *Origem:* ${agendamento.origem}
🏁 *Destino:* ${agendamento.destino}
${agendamento.observacoes ? `📝 *Obs:* ${agendamento.observacoes}` : ''}

Acesse seu painel para confirmar ou recusar:
${process.env.FRONTEND_URL}/painel`;

  return enviarMensagem(motorista.telefone, texto);
}

// Confirmação para o CLIENTE após motorista aceitar
async function notificarClienteConfirmacao(agendamento) {
  if (!agendamento.cliente.telefone) return;

  const data = new Date(agendamento.data).toLocaleDateString('pt-BR');
  const texto = `✅ *Agendamento confirmado!*

Olá, ${agendamento.cliente.nome.split(' ')[0]}!

Seu motorista confirmou a corrida:
📅 *Data:* ${data} às ${agendamento.horario}
📍 *Origem:* ${agendamento.origem}
🏁 *Destino:* ${agendamento.destino}

Em caso de dúvidas, entre em contato pelo painel.`;

  return enviarMensagem(agendamento.cliente.telefone, texto);
}

// Recusa para o CLIENTE
async function notificarClienteRecusa(agendamento) {
  if (!agendamento.cliente.telefone) return;

  const texto = `😔 Olá, ${agendamento.cliente.nome.split(' ')[0]}!

Infelizmente o motorista não está disponível no horário solicitado.

Tente agendar outro horário pelo link do QR Code.`;

  return enviarMensagem(agendamento.cliente.telefone, texto);
}

module.exports = {
  notificarMotoristaNovoPedido,
  notificarClienteConfirmacao,
  notificarClienteRecusa,
  enviarMensagem
};
