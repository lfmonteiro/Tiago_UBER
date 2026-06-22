const mongoose = require('mongoose');

const agendamentoSchema = new mongoose.Schema({
  motorista: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Motorista',
    required: true
  },
  // Dados do cliente
  cliente: {
    nome: { type: String, required: true, trim: true },
    telefone: { type: String, required: true },
    email: { type: String, default: null, lowercase: true },
  },
  // Data e horário
  data: { type: Date, required: true },
  horario: { type: String, required: true }, // "08:00"
  // Rota
  origem: { type: String, required: true, trim: true },
  destino: { type: String, required: true, trim: true },
  observacoes: { type: String, default: '', trim: true },
  // Status do agendamento
  status: {
    type: String,
    enum: ['pendente', 'confirmado', 'recusado', 'concluido', 'cancelado'],
    default: 'pendente'
  },
  // Controle de notificações disparadas
  notificacoes: {
    whatsappEnviado: { type: Boolean, default: false },
    emailEnviado: { type: Boolean, default: false },
    confirmacaoClienteEnviada: { type: Boolean, default: false },
  },
  // Token único para aceitar/recusar via link no e-mail
  tokenAcao: {
    type: String,
    default: () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  },
}, {
  timestamps: true
});

// Índice para evitar duplicidade de horário no mesmo dia
agendamentoSchema.index({ motorista: 1, data: 1, horario: 1 }, { unique: true });

module.exports = mongoose.model('Agendamento', agendamentoSchema);
