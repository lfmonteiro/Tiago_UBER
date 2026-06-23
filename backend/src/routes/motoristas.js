const express = require('express');
const router = express.Router();
const Motorista = require('../models/Motorista');
const { gerarQRCodeBase64 } = require('../services/qrcode');

// GET /api/motoristas/:slug — perfil público (usado pelo app do cliente)
router.get('/:slug', async (req, res) => {
  try {
    const motorista = await Motorista.findOne({
      slug: req.params.slug,
      ativo: true
    }).select('-__v');

    if (!motorista) return res.status(404).json({ erro: 'Motorista não encontrado' });

    res.json({ sucesso: true, motorista });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/motoristas/:slug/qrcode — retorna QR Code em base64
router.get('/:slug/qrcode', async (req, res) => {
  try {
    const motorista = await Motorista.findOne({ slug: req.params.slug, ativo: true });
    if (!motorista) return res.status(404).json({ erro: 'Motorista não encontrado' });

    const base64 = await gerarQRCodeBase64(motorista.slug);
    res.json({ sucesso: true, qrcode: base64, url: `${process.env.FRONTEND_URL}/${motorista.slug}` });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/motoristas — cadastra novo motorista
router.post('/', async (req, res) => {
  try {
    const { nome, telefone, email, slug, horariosDisponiveis, especialidades } = req.body;
    if (!nome || !telefone || !email || !slug) {
      return res.status(400).json({ erro: 'nome, telefone, email e slug são obrigatórios' });
    }

    const motorista = await Motorista.create({
      nome, telefone, email, slug,
      horariosDisponiveis: horariosDisponiveis || undefined,
      especialidades: especialidades || undefined
    });

    res.status(201).json({ sucesso: true, motorista });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ erro: 'Slug já em uso. Escolha outro.' });
    }
    res.status(500).json({ erro: err.message });
  }
});

// PATCH /api/motoristas/:slug — atualiza horários ou dados
router.patch('/:slug', async (req, res) => {
  try {
    const campos = {};
    const permitidos = ['horariosDisponiveis', 'especialidades', 'foto', 'avaliacao', 'nome', 'telefone', 'email', 'totalViagens', 'anosAtuando'];
    permitidos.forEach(c => { if (req.body[c] !== undefined) campos[c] = req.body[c]; });

    const motorista = await Motorista.findOneAndUpdate(
      { slug: req.params.slug },
      campos,
      { new: true }
    );

    if (!motorista) return res.status(404).json({ erro: 'Motorista não encontrado' });
    res.json({ sucesso: true, motorista });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
