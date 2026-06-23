const nodemailer = require('nodemailer');

const porta = parseInt(process.env.EMAIL_PORT) || 465;
const seguro = porta === 465;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: porta,
  secure: seguro,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 15000,
  socketTimeout: 15000
});

function htmlBase(conteudo) {
  return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f5f5f5;margin:0;padding:20px}.container{max-width:520px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)}.header{background:#1a1a2e;padding:24px 28px}.header h1{color:white;font-size:18px;font-weight:600;margin:0}.header p{color:rgba(255,255,255,0.6);font-size:13px;margin:4px 0 0}.body{padding:24px 28px}.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px}.row:last-child{border-bottom:none}.label{color:#888}.value{color:#111;font-weight:500;text-align:right;max-width:60%}.btn{display:inline-block;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:8px 8px 0 0}.btn-green{background:#1a7a4a;color:white}.btn-red{background:#c0392b;color:white}.footer{padding:16px 28px;background:#fafafa;border-top:1px solid #f0f0f0;font-size:12px;color:#aaa}</style></head><body><div class="container">' + conteudo + '<div class="footer">Este e-mail foi gerado automaticamente pelo sistema de agendamentos.</div></div></body></html>';
}

async function emailMotoristaNovoPedido(motorista, agendamento) {
  const data = new Date(agendamento.data).toLocaleDateString('pt-BR');
  const urlAceitar = process.env.BACKEND_URL + '/api/agendamentos/' + agendamento._id + '/acao?token=' + agendamento.tokenAcao + '&acao=confirmar';
  const urlRecusar = process.env.BACKEND_URL + '/api/agendamentos/' + agendamento._id + '/acao?token=' + agendamento.tokenAcao + '&acao=recusar';

  const conteudo = '<div class="header"><h1>Novo agendamento</h1><p>Um passageiro solicitou uma corrida particular</p></div><div class="body"><div class="row"><span class="label">Cliente</span><span class="value">' + agendamento.cliente.nome + '</span></div><div class="row"><span class="label">WhatsApp</span><span class="value">' + agendamento.cliente.telefone + '</span></div><div class="row"><span class="label">Data</span><span class="value">' + data + ' as ' + agendamento.horario + '</span></div><div class="row"><span class="label">Origem</span><span class="value">' + agendamento.origem + '</span></div><div class="row"><span class="label">Destino</span><span class="value">' + agendamento.destino + '</span></div>' + (agendamento.observacoes ? '<div class="row"><span class="label">Obs</span><span class="value">' + agendamento.observacoes + '</span></div>' : '') + '<div style="margin-top:20px"><a href="' + urlAceitar + '" class="btn btn-green">Aceitar corrida</a><a href="' + urlRecusar + '" class="btn btn-red">Recusar</a></div></div>';

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: motorista.email,
      subject: 'Novo agendamento - ' + agendamento.cliente.nome + ' - ' + data + ' ' + agendamento.horario,
      html: htmlBase(conteudo)
    });
    console.log('E-mail enviado para:', motorista.email);
    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error.message);
    return { sucesso: false, erro: error.message };
  }
}

async function emailClienteConfirmacao(agendamento) {
  if (!agendamento.cliente.email) return;
  const data = new Date(agendamento.data).toLocaleDateString('pt-BR');
  const conteudo = '<div class="header"><h1>Corrida confirmada!</h1><p>Seu motorista particular confirmou o agendamento</p></div><div class="body"><div class="row"><span class="label">Data</span><span class="value">' + data + ' as ' + agendamento.horario + '</span></div><div class="row"><span class="label">Origem</span><span class="value">' + agendamento.origem + '</span></div><div class="row"><span class="label">Destino</span><span class="value">' + agendamento.destino + '</span></div></div>';

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: agendamento.cliente.email,
      subject: 'Corrida confirmada - ' + data + ' as ' + agendamento.horario,
      html: htmlBase(conteudo)
    });
    return { sucesso: true };
  } catch (error) {
    return { sucesso: false, erro: error.message };
  }
}

module.exports = { emailMotoristaNovoPedido, emailClienteConfirmacao };
