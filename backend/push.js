const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:thmmoraes@icloud.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const notificar = async (titulo, corpo, motoristaId, dados = {}) => {
  try {
    const subs = await PushSubscription.find({ motorista: motoristaId });
    const payload = JSON.stringify({ titulo, corpo, dados });

    const promises = subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        console.log('✅ Push enviado');
      } catch (err) {
        // Remove subscription inválida
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.findByIdAndDelete(sub._id);
          console.log('🗑️ Subscription expirada removida');
        } else {
          console.error('❌ Erro push:', err.message);
        }
      }
    });

    await Promise.allSettled(promises);
  } catch (err) {
    console.error('Erro ao enviar push:', err.message);
  }
};

async function pushNovoAgendamento(motoristaId, agendamento) {
  const titulo = '🚗 Novo agendamento!';
  const corpo = `${agendamento.cliente.nome} — ${agendamento.horario} — ${agendamento.origem} → ${agendamento.destino}`;
  await notificar(titulo, corpo, motoristaId);
}

module.exports = { notificar, pushNovoAgendamento };
