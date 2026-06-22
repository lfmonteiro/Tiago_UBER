const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:thmmoraes@icloud.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function enviarPush(subscription, titulo, corpo, url = '/') {
  try {
    await webpush.sendNotification(subscription, JSON.stringify({ titulo, corpo, url }));
    return { sucesso: true };
  } catch (err) {
    console.error('❌ Erro push:', err.message);
    return { sucesso: false, erro: err.message };
  }
}

async function pushNovoAgendamento(subscriptions, agendamento) {
  if (!subscriptions || subscriptions.length === 0) return;
  const titulo = '🚗 Novo agendamento!';
  const corpo = `${agendamento.cliente.nome} — ${agendamento.horario} — ${agendamento.origem} → ${agendamento.destino}`;
  for (const sub of subscriptions) {
    await enviarPush(sub, titulo, corpo);
  }
}

module.exports = { enviarPush, pushNovoAgendamento };
