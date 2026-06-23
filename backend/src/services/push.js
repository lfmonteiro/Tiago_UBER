const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:thmmoraes@icloud.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const notificar = async (titulo, corpo, motoristaId) => {
  try {
    const subs = await PushSubscription.find({ motorista: motoristaId });
    console.log('Push: ' + subs.length + ' subscriptions encontradas');
    const payload = JSON.stringify({ titulo, corpo });
    for (const sub of subs) {
      try {
        await webpush.sendNotification(sub.subscription, payload);
        console.log('Push enviado com sucesso');
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.findByIdAndDelete(sub._id);
        } else {
          console.error('Erro push:', err.message);
        }
      }
    }
  } catch (err) {
    console.error('Erro ao enviar push:', err.message);
  }
};

async function pushNovoAgendamento(motoristaId, agendamento) {
  const titulo = 'Novo agendamento!';
  const corpo = agendamento.cliente.nome + ' - ' + agendamento.horario + ' - ' + agendamento.origem + ' para ' + agendamento.destino;
  await notificar(titulo, corpo, motoristaId);
}

module.exports = { notificar, pushNovoAgendamento };
