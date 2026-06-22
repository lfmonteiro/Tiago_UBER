const mongoose = require('mongoose');

const motoristaSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    // Ex: "ricardo-souza" — usado na URL e no QR Code
  },
  nome: { type: String, required: true, trim: true },
  telefone: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  foto: { type: String, default: null },
  avaliacao: { type: Number, default: 5.0, min: 1, max: 5 },
  totalViagens: { type: Number, default: 0 },
  anosAtuando: { type: Number, default: 1 },
  especialidades: {
    type: [String],
    default: ['Viagens longas', 'Aeroporto', 'Corridas locais']
  },
  // Horários que o motorista disponibiliza por padrão
  horariosDisponiveis: {
    type: [String],
    default: ['08:00', '10:30', '14:00', '17:00', '19:30', '21:00']
  },
  ativo: { type: Boolean, default: true },
  qrCodeUrl: { type: String, default: null },
}, {
  timestamps: true
});

module.exports = mongoose.model('Motorista', motoristaSchema);
