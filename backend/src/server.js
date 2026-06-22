require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────────
// Conexão com banco
// ─────────────────────────────────────────────
connectDB();

// ─────────────────────────────────────────────
// Middlewares globais
// ─────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.set('trust proxy', 1);

// Rate limiting — evita spam de agendamentos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30,
  message: { erro: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
app.use('/api/agendamentos', limiter);

// Servir QR Codes gerados como imagem estática
app.use('/qrcodes', express.static(path.join(__dirname, '../public/qrcodes')));

// ─────────────────────────────────────────────
// Rotas da API
// ─────────────────────────────────────────────
app.use('/api/agendamentos', require('./routes/agendamentos'));
app.use('/api/motoristas', require('./routes/motoristas'));
app.use('/api/push', require('./routes/push'));

// Health check (útil para o Render saber que está no ar)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Handler de erros global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

// ─────────────────────────────────────────────
// Inicia o servidor
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`📋 Health: http://localhost:${PORT}/health`);
});
