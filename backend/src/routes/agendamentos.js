const express = require('express');
const router = express.Router();
const Agendamento = require('../models/Agendamento');
const Motorista = require('../models/Motorista');
const whatsapp = require('../services/whatsapp');
const email = require('../services/email');

// ─────────────────────────────────────────────
// GET /api/agendamentos/motorista/:slug
// Retorna agendamentos do motorista (painel)
// ─────────────────────────────────────────────
router.get('/motorista/:slug', async (req, res) => {
  try {
    const motorista = await Motorista.findOne({ slug: req.params.slug });
    if (!motorista) return res.status(404).json({ erro: 'Motorista não encontrado' });

    const { status, data } = req.query;
    const filtro = { motorista: motorista._id };
    if (status) filtro.status = status;
    if (data) {
      const inicio = new Date(data);
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(data);
      fim.setHours(23, 59, 59, 999);
      filtro.data = { $gte: inicio, $lte: fim };
    }

    const agendamentos = await Agendamento.find(filtro).sort({ data: 1, horario: 1 });
    res.json({ sucesso: true, agendamentos });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/agendamentos/horarios/:slug?data=YYYY-MM-DD
// Retorna horários disponíveis para um dia
// ─────────────────────────────────────────────
router.get('/horarios/:slug', async (req, res) => {
  try {
    const motorista = await Motorista.findOne({ slug: req.params.slug });
    if (!motorista) return res.status(404).json({ erro: 'Motorista não encontrado' });

    const dataSolicitada = req.query.data ? new Date(req.query.data) : new Date();
    const inicio = new Date(dataSolicitada);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(dataSolicitada);
    fim.setHours(23, 59, 59, 999);

    // Busca horários já ocupados no dia
    const ocupados = await Agendamento.find({
      motorista: motorista._id,
      data: { $gte: inicio, $lte: fim },
      status: { $in: ['pendente', 'confirmado'] }
    }).select('horario');

    const horariosOcupados = ocupados.map(a => a.horario);

    const slots = motorista.horariosDisponiveis.map(h => ({
      horario: h,
      disponivel: !horariosOcupados.includes(h)
    }));

    res.json({ sucesso: true, slots });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/agendamentos
// Cria novo agendamento e dispara notificações
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { slugMotorista, cliente, data, horario, origem, destino, observacoes } = req.body;

    // Validação básica
    if (!slugMotorista || !cliente?.nome || !cliente?.telefone || !data || !horario || !origem || !destino) {
      return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });
    }

    const motorista = await Motorista.findOne({ slug: slugMotorista, ativo: true });
    if (!motorista) return res.status(404).json({ erro: 'Motorista não encontrado' });

    // Verifica se horário ainda está livre
    const dataObj = new Date(data);
    const inicio = new Date(dataObj); inicio.setHours(0, 0, 0, 0);
    const fim = new Date(dataObj); fim.setHours(23, 59, 59, 999);

    const conflito = await Agendamento.findOne({
      motorista: motorista._id,
      data: { $gte: inicio, $lte: fim },
      horario,
      status: { $in: ['pendente', 'confirmado'] }
    });

    if (conflito) {
      return res.status(409).json({ erro: 'Horário indisponível. Escolha outro.' });
    }

    // Cria o agendamento
    const agendamento = await Agendamento.create({
      motorista: motorista._id,
      cliente,
      data: dataObj,
      horario,
      origem,
      destino,
      observacoes: observacoes || ''
    });

    // Dispara notificações em paralelo (não bloqueia a resposta)
    Promise.allSettled([
      whatsapp.notificarMotoristaNovoPedido(motorista, agendamento).then(r => {
        if (r.sucesso) Agendamento.findByIdAndUpdate(agendamento._id, { 'notificacoes.whatsappEnviado': true }).exec();
      }),
      email.emailMotoristaNovoPedido(motorista, agendamento).then(r => {
        if (r.sucesso) Agendamento.findByIdAndUpdate(agendamento._id, { 'notificacoes.emailEnviado': true }).exec();
      })
    ]).then(results => {
      results.forEach((r, i) => {
        if (r.status === 'rejected') console.error(`Notificação ${i} falhou:`, r.reason);
      });
    });

    res.status(201).json({
      sucesso: true,
      mensagem: 'Agendamento criado! O motorista será notificado.',
      agendamento: {
        id: agendamento._id,
        cliente: agendamento.cliente,
        data: agendamento.data,
        horario: agendamento.horario,
        origem: agendamento.origem,
        destino: agendamento.destino,
        status: agendamento.status
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ erro: 'Horário indisponível. Escolha outro.' });
    }
    res.status(500).json({ erro: err.message });
  }
});

// ─────────────────────────────────────────────
// PATCH /api/agendamentos/:id/status
// Motorista aceita ou recusa via painel
// ─────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmado', 'recusado', 'concluido', 'cancelado'].includes(status)) {
      return res.status(400).json({ erro: 'Status inválido' });
    }

    const agendamento = await Agendamento.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('motorista');

    if (!agendamento) return res.status(404).json({ erro: 'Agendamento não encontrado' });

    // Notifica o cliente
    if (status === 'confirmado') {
      await whatsapp.notificarClienteConfirmacao(agendamento);
      await email.emailClienteConfirmacao(agendamento);
    } else if (status === 'recusado') {
      await whatsapp.notificarClienteRecusa(agendamento);
    }

    res.json({ sucesso: true, agendamento });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/agendamentos/:id/acao
// Aceitar ou recusar via link do e-mail (token)
// ─────────────────────────────────────────────
router.get('/:id/acao', async (req, res) => {
  try {
    const { token, acao } = req.query;
    if (!['confirmar', 'recusar'].includes(acao)) {
      return res.status(400).send('<h2>Ação inválida.</h2>');
    }

    const agendamento = await Agendamento.findOne({
      _id: req.params.id,
      tokenAcao: token
    }).populate('motorista');

    if (!agendamento) return res.status(404).send('<h2>Link inválido ou expirado.</h2>');
    if (agendamento.status !== 'pendente') {
      return res.send(`<h2>Este agendamento já foi ${agendamento.status}.</h2>`);
    }

    const novoStatus = acao === 'confirmar' ? 'confirmado' : 'recusado';
    agendamento.status = novoStatus;
    await agendamento.save();

    // Notifica o cliente
    if (novoStatus === 'confirmado') {
      await whatsapp.notificarClienteConfirmacao(agendamento);
      await email.emailClienteConfirmacao(agendamento);
    } else {
      await whatsapp.notificarClienteRecusa(agendamento);
    }

    const emoji = novoStatus === 'confirmado' ? '✅' : '❌';
    const msg   = novoStatus === 'confirmado' ? 'Corrida confirmada!' : 'Corrida recusada.';
    const data  = new Date(agendamento.data).toLocaleDateString('pt-BR');

    res.send(`
      <!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${msg}</title>
      <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5}
      .card{background:white;border-radius:12px;padding:2rem;text-align:center;max-width:360px;box-shadow:0 2px 8px rgba(0,0,0,.1)}
      h2{margin:0 0 .5rem}p{color:#666;margin:.25rem 0}</style></head>
      <body><div class="card"><div style="font-size:48px">${emoji}</div>
      <h2>${msg}</h2>
      <p>${agendamento.cliente.nome}</p>
      <p>${data} às ${agendamento.horario}</p>
      <p>${agendamento.origem} → ${agendamento.destino}</p>
      </div></body></html>
    `);
  } catch (err) {
    res.status(500).send(`<h2>Erro: ${err.message}</h2>`);
  }
});

module.exports = router;
