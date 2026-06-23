const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');
const Motorista = require('../models/Motorista');

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe/:slug', async (req, res) => {
  try {
    const motorista = await Motorista.findOne({ slug: req.params.slug });
    if (!motorista) return res.status(404).json({ erro: 'Motorista não encontrado' });
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ erro: 'Subscription ausente' });
    await PushSubscription.findOneAndUpdate(
      { motorista: motorista._id, 'subscription.endpoint': subscription.endpoint },
      { motorista: motorista._id, subscription },
      { upsert: true, new: true }
    );
    console.log('Push subscription salva');
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

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
