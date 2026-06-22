const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:thmmoraes@icloud.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Envia push para uma subscription
async function enviarPush(subscription, titulo, corpo, url = '/painel') {
  try {
    await webpush.sendNotification(subscription, JSON.stringify({
      title: titulo,
      body: corpo,
      url
    }));
    return { sucesso: true };
  } catch (err) {
    console.error('❌ Erro push:', err.message);
    return { sucesso: false, erro: err.message };
  }
}

// Notifica novo agendamento
async function pushNovoAgendamento(subscriptions, agendamento) {
  if (!subscriptions || subscriptions.length === 0) return;
  const titulo = '🚗 Novo agendamento!';
  const corpo = `${agendamento.cliente.nome} — ${agendamento.horario} — ${agendamento.origem} → ${agendamento.destino}`;
  for (const sub of subscriptions) {
    await enviarPush(sub, titulo, corpo);
  }
}

module.exports = { enviarPush, pushNovoAgendamento };
