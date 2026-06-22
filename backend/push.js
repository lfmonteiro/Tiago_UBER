const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');
const Motorista = require('../models/Motorista');

// GET /api/push/vapid-public-key — retorna chave pública para o frontend
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe/:slug — salva subscription do dispositivo
router.post('/subscribe/:slug', async (req, res) => {
  try {
    const motorista = await Motorista.findOne({ slug: req.params.slug });
    if (!motorista) return res.status(404).json({ erro: 'Motorista não encontrado' });

    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ erro: 'Subscription ausente' });

    // Evita duplicata pelo endpoint
    await PushSubscription.findOneAndUpdate(
      { motorista: motorista._id, 'subscription.endpoint': subscription.endpoint },
      { motorista: motorista._id, subscription },
      { upsert: true, new: true }
    );

    res.json({ sucesso: true, mensagem: 'Push registrado!' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// DELETE /api/push/unsubscribe — remove subscription
router.delete('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({ 'subscription.endpoint': endpoint });
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
